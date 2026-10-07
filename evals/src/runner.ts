import { createHash } from 'node:crypto';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';

import type {
  ConfigSummary,
  EvalProduct,
  ExperimentConfig,
  QueryScores,
  RankedId,
} from './types.js';

import { loadCorpus, loadJudgments } from './corpus.js';
import { attrHitAtK, coverageAtK, diversityAtK, ndcgAtK, recallAtK } from './metrics.js';
import { registry } from './registry.js';
import { bruteForceTopK, normalize, seededShuffle } from './search.js';

type Cache = Record<string, number[]>;

function textHash(text: string): string {
  return createHash('sha1').update(text).digest('hex').slice(0, 16);
}

function loadCache(dir: string): { cache: Cache; file: string } {
  const file = path.join(dir, 'embeddings.json');
  try {
    return { cache: JSON.parse(readFileSync(file, 'utf8')) as Cache, file };
  } catch {
    return { cache: {}, file };
  }
}

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
  if (queries.length === 0) {
    throw new Error('No queries left after minRelevants filtering — judgments too thin.');
  }
  if (corpus.length < 10) {
    console.warn(`[evals] corpus has ${corpus.length} products; <10 is toy-only.`);
  }
  if (queries.length < 3) {
    console.warn(`[evals] only ${queries.length} queries; treat deltas as directional.`);
  }

  const byId = new Map(corpus.map((p) => [p.id, p]));
  const outRoot = config.outDir;
  mkdirSync(outRoot, { recursive: true });
  const cacheDir = path.join(process.cwd(), '.cache');
  mkdirSync(cacheDir, { recursive: true });
  const { cache, file: cacheFile } = loadCache(cacheDir);
  let cacheDirty = false;

  const embedCached = async (
    modelId: string,
    kind: string,
    texts: string[],
    timings: number[],
  ): Promise<number[][]> => {
    const model = registry.model(modelId);
    const keys = texts.map((t) => `${modelId}::${kind}::${textHash(t)}`);
    const missingIdx: number[] = [];
    const missingTexts: string[] = [];
    keys.forEach((key, i) => {
      if (cache[key] === undefined) {
        missingIdx.push(i);
        missingTexts.push(texts[i] as string);
      }
    });
    if (missingTexts.length > 0) {
      const started = performance.now();
      const vectors = await model.embed(missingTexts);
      timings.push((performance.now() - started) / missingTexts.length);
      missingIdx.forEach((target, k) => {
        cache[keys[target] as string] = vectors[k] as number[];
      });
      cacheDirty = true;
    }
    return keys.map((key) => cache[key] as number[]);
  };

  const maxK = Math.max(...config.topK);
  const summaries: ConfigSummary[] = [];

  for (const modelId of config.models) {
    const model = registry.model(modelId);
    for (const docId of config.docs) {
      const docBuilder = registry.doc(docId);
      const docTexts = corpus.map((p) => docBuilder.build(p));
      const docTimings: number[] = [];
      const docVectorsFull = await embedCached(modelId, `doc:${docId}`, docTexts, docTimings);
      for (const queryId of config.queries) {
        const queryBuilder = registry.query(queryId);
        const queryTexts = queries.map((q) => queryBuilder.build(q));
        const queryTimings: number[] = [];
        const queryVectorsFull = await embedCached(
          modelId,
          `query:${queryId}`,
          queryTexts,
          queryTimings,
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
            const perQuery: QueryScores[] = queries.map((query, qi) => {
              const started = performance.now();
              const ranked = bruteForceTopK(queryVectors[qi] as number[], orderedDocs, maxK);
              searchTimings.push(performance.now() - started);
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
            summaries.push({
              key,
              model: modelId,
              doc: docId,
              query: queryId,
              dims,
              seed,
              corpusSize: corpus.length,
              queryCount: queries.length,
              droppedQueries: dropped,
              avg: {
                recallAtK: avgFor((q) => q.recallAtK),
                ndcgAtK: avgFor((q) => q.ndcgAtK),
                attrHitAtK: avgFor((q) => q.attrHitAtK),
                coverageAtK: avgFor((q) => q.coverageAtK),
                diversityAtK: avgFor((q) => q.diversityAtK),
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
  }

  if (cacheDirty) writeFileSync(cacheFile, JSON.stringify(cache));

  // Generic baseline (corpus order) for the personalization-delta column.
  const baselineRecall =
    queries.reduce(
      (s, q) => s + recallAtK(baselineRanking(corpus, maxK), q.relevantIds, maxK),
      0,
    ) / queries.length;

  writeFileSync(path.join(outRoot, 'config.json'), JSON.stringify(config, null, 2));
  writeFileSync(
    path.join(outRoot, 'summary.json'),
    JSON.stringify({ baselineRecallAtMaxK: baselineRecall, summaries }, null, 2),
  );
  writeFileSync(path.join(outRoot, 'leaderboard.md'), renderLeaderboard(summaries, baselineRecall, maxK));
  return summaries;
}

function renderLeaderboard(summaries: ConfigSummary[], baseline: number, k: number): string {
  const rows = [...summaries].sort(
    (a, b) => (b.avg.ndcgAtK[k] as number) - (a.avg.ndcgAtK[k] as number),
  );
  const lines = [
    `# Leaderboard (K=${k}, generic-baseline recall=${baseline.toFixed(3)})`,
    '',
    '| rank | config | recall | nDCG | attr-hit | coverage | diversity | q-ms |',
    '| --- | --- | --- | --- | --- | --- | --- | --- |',
  ];
  rows.forEach((s, i) => {
    lines.push(
      `| ${i + 1} | ${s.key} | ${(s.avg.recallAtK[k] as number).toFixed(3)} | ${(s.avg.ndcgAtK[k] as number).toFixed(3)} | ${(s.avg.attrHitAtK[k] as number).toFixed(3)} | ${(s.avg.coverageAtK[k] as number).toFixed(3)} | ${(s.avg.diversityAtK[k] as number).toFixed(3)} | ${s.cost.searchMsP50.toFixed(2)} |`,
    );
  });
  return lines.join('\n') + '\n';
}
