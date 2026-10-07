import type { ExperimentConfig } from '../src/types.js';

/**
 * External-runtime head-to-head: Cactus Needle 3 (custom engine, vectors
 * exported via evals/scripts/export_needle.py) vs the e5-small winner.
 * Native dims (truncate() passes through when dims >= length).
 */
const config: ExperimentConfig = {
  corpus: 'data/corpus.v1.jsonl',
  judgments: 'data/judgments.v2.json',
  models: ['needle3-20L', 'e5-small-384'],
  docs: ['canonical', 'tagged'],
  queries: ['raw'],
  dims: [3072, 768],
  topK: [5, 10],
  seeds: [1, 2, 3],
  minRelevantsPerQuery: 5,
  outDir: 'results/external',
};

export default config;
