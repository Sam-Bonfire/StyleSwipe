/**
 * CLI: pnpm --filter @app/evals tune -- --config configs/eval-tune.config.ts [--out results/tune]
 *
 * Tunes the app's learning dynamics with the REAL core functions:
 * swipe sessions replayed through applyDisplacement over an (alpha, beta,
 * super-multiplier, swipe-budget) grid, plus a diversity-caps sweep through
 * diversifyAndLimit. Answers "which values should the app ship?"
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

import type { TuneConfig } from './types.js';

import { registerBuiltins } from './builtins.js';
import { readArg } from './cli.js';
import { loadCorpus, loadJudgments } from './corpus.js';
import { createEmbeddingCache } from './embeddings.js';
import { applyCaps, buildSession, runLearningSession } from './learning/simulate.js';
import { diversityAtK, ndcgAtK, recallAtK } from './metrics.js';
import { registry } from './registry.js';
import { bruteForceTopK, normalize, seededShuffle } from './search.js';

const configPath = readArg(process.argv, '--config') || 'configs/eval-tune.config.ts';
const outName = readArg(process.argv, '--out') || 'results/tune';

registerBuiltins();

const loaded = (await import(pathToFileURL(path.resolve(configPath)).href)) as {
  default: TuneConfig;
};
const config: TuneConfig = {
  ...loaded.default,
  corpus: path.resolve(loaded.default.corpus),
  judgments: path.resolve(loaded.default.judgments),
  outDir: path.resolve(outName),
};

const corpus = loadCorpus(config.corpus);
const { queries, dropped } = loadJudgments(config.judgments, config.minRelevantsPerQuery);
const positives = queries.filter((q) => !q.negative);
if (positives.length === 0) throw new Error('No positive queries — nothing to learn from.');

const embeddings = createEmbeddingCache();
const noopTimings: number[] = [];
const docBuilder = registry.doc(config.doc);
const queryBuilder = registry.query(config.query);
const docVectorsFull = await embeddings.embed(
  config.model,
  `doc:${config.doc}`,
  corpus.map((p) => docBuilder.build(p)),
  noopTimings,
  'doc',
);
const queryVectorsFull = await embeddings.embed(
  config.model,
  `query:${config.query}`,
  positives.map((q) => queryBuilder.build(q)),
  noopTimings,
  'query',
);
embeddings.flush();

const truncate = (v: number[]): number[] =>
  config.dims >= v.length ? v : normalize(v.slice(0, config.dims));
const docVectors = docVectorsFull.map(truncate);
const queryVectors = queryVectorsFull.map(truncate);
const vectorById = new Map(corpus.map((p, i) => [p.id, docVectors[i] as number[]]));
const byId = new Map(corpus.map((p) => [p.id, p]));
const allIds = corpus.map((p) => p.id);
const K = config.topK;

const rank = (vector: number[]) =>
  bruteForceTopK(vector, allIds.map((id) => ({ id, vector: vectorById.get(id) as number[] })), K);

interface LearningRow {
  key: string;
  alpha: number;
  beta: number;
  super: number;
  budget: number;
  seed: number;
  ndcg: number;
  recall: number;
  delta: number;
}

const learningRows: LearningRow[] = [];
for (const alpha of config.alphas) {
  for (const beta of config.betas) {
    for (const superMult of config.supers) {
      for (const budget of config.budgets) {
        for (const seed of config.seeds) {
          let ndcgSum = 0;
          let recallSum = 0;
          let deltaSum = 0;
          positives.forEach((query, qi) => {
            const likeIds = query.relevantIds.slice(0, budget);
            const passPool = seededShuffle(
              allIds.filter((id) => !query.relevantIds.includes(id)),
              seed,
            );
            const passIds = passPool.slice(0, budget);
            const steps = buildSession(
              likeIds.map((id) => vectorById.get(id) as number[]),
              passIds.map((id) => vectorById.get(id) as number[]),
              true,
            );
            const start = queryVectors[qi] as number[];
            const baseRanked = rank(start);
            const base = ndcgAtK(baseRanked, query.relevantIds, K);
            const { final } = runLearningSession(start, steps, {
              alpha,
              beta,
              superLikeMultiplier: superMult,
            });
            const scored = ndcgAtK(rank(final), query.relevantIds, K);
            ndcgSum += scored;
            recallSum += recallAtK(rank(final), query.relevantIds, K);
            deltaSum += scored - base;
          });
          const n = positives.length;
          learningRows.push({
            key: `a${alpha} b${beta} s${superMult} n${budget} seed${seed}`,
            alpha,
            beta,
            super: superMult,
            budget,
            seed,
            ndcg: ndcgSum / n,
            recall: recallSum / n,
            delta: deltaSum / n,
          });
        }
      }
    }
  }
}

learningRows.sort((a, b) => b.ndcg - a.ndcg);
const best = learningRows[0] as LearningRow;

// Learning curve for the winner: mean nDCG after each swipe step.
const curve: { step: number; action: string; ndcg: number }[] = [];
{
  const maxSteps = best.budget * 2;
  const stepSums = new Array<number>(maxSteps + 1).fill(0);
  positives.forEach((query, qi) => {
    const likeIds = query.relevantIds.slice(0, best.budget);
    const passPool = seededShuffle(
      allIds.filter((id) => !query.relevantIds.includes(id)),
      best.seed,
    );
    const steps = buildSession(
      likeIds.map((id) => vectorById.get(id) as number[]),
      passPool.slice(0, best.budget).map((id) => vectorById.get(id) as number[]),
      true,
    );
    const start = queryVectors[qi] as number[];
    stepSums[0] += ndcgAtK(rank(start), query.relevantIds, K);
    const { trajectory } = runLearningSession(start, steps, {
      alpha: best.alpha,
      beta: best.beta,
      superLikeMultiplier: best.super,
    });
    trajectory.slice(1).forEach((vector, t) => {
      stepSums[t + 1] += ndcgAtK(rank(vector), query.relevantIds, K);
    });
  });
  // Action labels from a representative session shape (like,pass alternating, super first).
  const labels: string[] = ['start'];
  for (let i = 0; i < best.budget; i++) {
    labels.push(i === 0 ? 'super' : 'like');
    labels.push('pass');
  }
  stepSums.forEach((sum, t) => {
    curve.push({ step: t, action: labels[t] as string, ndcg: sum / positives.length });
  });
}

// Diversity-caps sweep on no-learning rankings (isolates the caps tradeoff).
interface CapsRow {
  maxPerBrand: number;
  maxPerCategory: number;
  ndcg: number;
  diversity: number;
}
const capsRows: CapsRow[] = [];
for (const maxPerBrand of config.capsBrands) {
  for (const maxPerCategory of config.capsCategories) {
    let ndcgSum = 0;
    let divSum = 0;
    positives.forEach((query, qi) => {
      const ranked = rank(queryVectors[qi] as number[]);
      const { ids } = applyCaps(
        ranked,
        (id) => byId.get(id)?.brand as string,
        (id) => byId.get(id)?.category as string,
        K,
        maxPerBrand,
        maxPerCategory,
      );
      const capped = ids.map((id, i) => ({ id, score: 1 / (i + 1), rank: i + 1 }));
      ndcgSum += ndcgAtK(capped, query.relevantIds, K);
      const vecs = new Map(ids.map((id) => [id, vectorById.get(id) as number[]]));
      divSum += diversityAtK(capped, vecs, K);
    });
    capsRows.push({
      maxPerBrand,
      maxPerCategory,
      ndcg: ndcgSum / positives.length,
      diversity: divSum / positives.length,
    });
  }
}
capsRows.sort((a, b) => b.ndcg - a.ndcg);

const outRoot = config.outDir;
mkdirSync(outRoot, { recursive: true });
writeFileSync(
  path.join(outRoot, 'tune-summary.json'),
  JSON.stringify(
    { config, dropped, best, learningRows, capsRows, curve, queryCount: positives.length },
    null,
    2,
  ),
);
const leaderboard = [
  `# Tune leaderboard (K=${K}, ${positives.length} queries, winner curve + caps below)`,
  '',
  '| rank | config | nDCG | recall | delta-vs-no-learning |',
  '| --- | --- | --- | --- | --- |',
  ...learningRows.slice(0, 20).map(
    (r, i) =>
      `| ${i + 1} | ${r.key} | ${r.ndcg.toFixed(3)} | ${r.recall.toFixed(3)} | ${r.delta >= 0 ? '+' : ''}${r.delta.toFixed(3)} |`,
  ),
  '',
  '## Diversity caps (no-learning rankings)',
  '',
  '| maxPerBrand | maxPerCategory | nDCG | diversity |',
  '| --- | --- | --- | --- |',
  ...capsRows.map(
    (r) => `| ${r.maxPerBrand} | ${r.maxPerCategory} | ${r.ndcg.toFixed(3)} | ${r.diversity.toFixed(3)} |`,
  ),
  '',
  '## Learning curve (winner)',
  '',
  '| step | action | nDCG |',
  '| --- | --- | --- |',
  ...curve.map((c) => `| ${c.step} | ${c.action} | ${c.ndcg.toFixed(3)} |`),
  '',
].join('\n');
writeFileSync(path.join(outRoot, 'tune-leaderboard.md'), leaderboard);
console.log(`Done: ${learningRows.length} learning configs, best ${best.key} nDCG=${best.ndcg.toFixed(3)} delta=${best.delta.toFixed(3)} -> ${outRoot}`);
