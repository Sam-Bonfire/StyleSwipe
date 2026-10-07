import type { ExperimentConfig } from '../src/types.js';

/**
 * Smoke config: fake embedder + fixture data. Runs offline in seconds.
 * Copy to eval-*.config.ts for real sweeps (swap models to bge-small-384…).
 */
const config: ExperimentConfig = {
  corpus: 'data/corpus.fixture.jsonl',
  judgments: 'data/judgments.fixture.json',
  models: ['fake-hash-64'],
  docs: ['title-only', 'canonical', 'tagged'],
  queries: ['raw', 'taste-expanded'],
  dims: [64],
  topK: [3, 5],
  seeds: [1, 2, 3],
  minRelevantsPerQuery: 3,
  outDir: 'results/smoke',
};

export default config;
