import { mkdirSync } from 'node:fs';

import type {
  ConfigSummary,
  EvalProduct,
  ExperimentConfig,
  QueryScores,
  RankedId,
} from './types.js';

import { loadCorpus, loadJudgments } from './corpus.js';
import { createEmbeddingCache } from './embeddings.js';
import {
  ABSTAIN_TAUS,
  attrHitAtK,
  coverageAtK,
  diversityAtK,
  ndcgAtK,
  recallAtK,
} from './metrics.js';
import { registry } from './registry.js';
import { writeRunFiles } from './report.js';
import { bootstrapCI, bruteForceTopK, normalize, seededShuffle } from './search.js';

function p50(values: number[]): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  return sorted[Math.floor(sorted.length / 2)] as number;
}

function truncate(vector: number[], dims: number): number[] {
  if (dims >= vector.length) return vector;
  return normalize(vector.slice(0, dims));
}

/** Corpus-order baseline (simulates the generic recent-first feed). */
function baselineRanking(products: EvalProduct[], limit: number): RankedId[] {
  return products
    .slice(0, limit)
    .map((p, i) => ({ id: p.id, score: 1 / (i + 1), rank: i + 1 }));
}

export async function runExperiment(config: ExperimentConfig): Promise<ConfigSummary[]> {
  const corpus = loadCorpus(config.corpus);
  const { queries, dropped } = loadJudgments(config.judgments, config.minRelevantsPerQuery);
  const positives = queries.filter((q) => !q.negative);
  if (positives.length === 0) {
    throw new Error('No positive queries left after minRelevants filtering — judgments too thin.');
  }
  if (corpus.length < 10) {
    console.warn(`[evals] corpus has ${corpus.length} products; <10 is toy-only.`);
  }
  if (positives.length < 30) {
    console.warn(`[evals] only ${positives.length} positive queries; treat deltas as directional.`);
  }

  const byId = new Map(corpus.map((p) => [p.id, p]));
  const outRoot = config.outDir;
  mkdirSync(outRoot, { recursive: true });
  const embeddings = createEmbeddingCache();
  const embedCached = embeddings.embed.bind(embeddings);

  const maxK = Math.max(...config.topK);
  const summaries: ConfigSummary[] = [];

  for (const modelId of config.models) {
    const model = registry.model(modelId);
    for (const docId of config.docs) {
      const docBuilder = registry.doc(docId);
      const docTexts = corpus.map((p) => docBuilder.build(p));
      const docTimings: number[] = [];
      const docVectorsFull = await embedCached(modelId, `doc:${docId}`, docTexts, docTimings, 'doc');
      for (const queryId of config.queries) {
        const queryBuilder = registry.query(queryId);
        const queryTexts = queries.map((q) => queryBuilder.build(q));
        const queryTimings: number[] = [];
        const queryVectorsFull = await embedCached(
          modelId,
          `query:${queryId}`,
          queryTexts,
          queryTimings,
          'query',
        );
        for (const dims of config.dims.length > 0 ? config.dims : [model.dims]) {
          const docVectors = docVectorsFull.map((v) => truncate(v, dims));
          const queryVectors = queryVectorsFull.map((v) => truncate(v, dims));
          const vectorById = new Map(corpus.map((p, i) => [p.id, docVectors[i] as number[]]));
          for (const seed of config.seeds) {
            const order = seededShuffle(corpus.map((_, i) => i), seed);
            const orderedDocs = order.map((i) => ({
              id: corpus[i]?.id as string,
              vector: docVectors[i] as number[],
            }));
            const searchTimings: number[] = [];
            const rankedAll = queries.map((query, qi) => {
              const started = performance.now();
              const ranked = bruteForceTopK(queryVectors[qi] as number[], orderedDocs, maxK);
              searchTimings.push(performance.now() - started);
              return { query, ranked };
            });
            const perQuery: QueryScores[] = rankedAll
              .filter(({ query }) => !query.negative)
              .map(({ query, ranked }) => {
                const recall: Record<number, number> = {};
                const ndcg: Record<number, number> = {};
                const attrHit: Record<number, number> = {};
                const coverage: Record<number, number> = {};
                const diversity: Record<number, number> = {};
                for (const k of config.topK) {
                  recall[k] = recallAtK(ranked, query.relevantIds, k);
                  ndcg[k] = ndcgAtK(ranked, query.relevantIds, k);
                  attrHit[k] = attrHitAtK(ranked, byId, query, k);
                  coverage[k] = coverageAtK(ranked, query.relevantIds, k);
                  diversity[k] = diversityAtK(ranked, vectorById, k);
                }
                return {
                  queryId: query.id,
                  recallAtK: recall,
                  ndcgAtK: ndcg,
                  attrHitAtK: attrHit,
                  coverageAtK: coverage,
                  diversityAtK: diversity,
                };
              });
            const negTopScores = rankedAll
              .filter(({ query }) => query.negative)
              .map(({ ranked }) => ranked[0]?.score ?? 0);
            const avgFor = (
              pick: (q: QueryScores) => Record<number, number>,
            ): Record<number, number> => {
              const out: Record<number, number> = {};
              for (const k of config.topK) {
                out[k] = perQuery.reduce((s, q) => s + (pick(q)[k] as number), 0) / perQuery.length;
              }
              return out;
            };
            const key = `${modelId} + ${docId} + ${queryId} + dim${dims} + seed${seed}`;
            const abstainRate: Record<number, number> = {};
            for (const tau of ABSTAIN_TAUS) {
              abstainRate[tau] =
                negTopScores.length === 0
                  ? 0
                  : negTopScores.filter((s) => s < tau).length / negTopScores.length;
            }
            summaries.push({
              key,
              model: modelId,
              doc: docId,
              query: queryId,
              dims,
              seed,
              corpusSize: corpus.length,
              queryCount: perQuery.length,
              droppedQueries: dropped,
              avg: {
                recallAtK: avgFor((q) => q.recallAtK),
                ndcgAtK: avgFor((q) => q.ndcgAtK),
                attrHitAtK: avgFor((q) => q.attrHitAtK),
                coverageAtK: avgFor((q) => q.coverageAtK),
                diversityAtK: avgFor((q) => q.diversityAtK),
              },
              ndcgCI: bootstrapCI(
                perQuery.map((q) => q.ndcgAtK[maxK] as number),
                500,
                seed,
              ),
              negatives: {
                count: negTopScores.length,
                meanTopScore:
                  negTopScores.length === 0
                    ? 0
                    : negTopScores.reduce((s, v) => s + v, 0) / negTopScores.length,
                abstainRate,
              },
              cost: {
                docEmbedMsP50: p50(docTimings),
                queryEmbedMsP50: p50(queryTimings),
                searchMsP50: p50(searchTimings),
                modelBytes: model.approxBytes,
                indexBytes: corpus.length * dims * 8,
              },
              perQuery,
            });
          }
        }
      }
    }

    // Persist per model so a crash (or a bad model id) never discards
    // hours of embedding work — re-runs resume from cache.
    embeddings.flush();
  }

  // Generic baseline (corpus order) for the personalization-delta column.
  const baselineRecall =
    positives.reduce(
      (s, q) => s + recallAtK(baselineRanking(corpus, maxK), q.relevantIds, maxK),
      0,
    ) / positives.length;

  writeRunFiles(outRoot, config, summaries, baselineRecall);
  return summaries;
}
