import type { ExperimentConfig } from '../src/types.js';

/**
 * Large-model probe: 768-dim models that break BOTH the device budget and
 * the 384-dim index. Eval-only — answers "how much are we losing by staying
 * small?" Docs restricted to the two winning layouts to keep runtime sane;
 * dims axis tests whether 768 buys anything over truncated 384/256.
 */
const config: ExperimentConfig = {
  corpus: 'data/corpus.v1.jsonl',
  judgments: 'data/judgments.v2.json',
  models: ['bge-base-768', 'e5-base-768', 'mpnet-base-768', 'bge-large-1024', 'e5-large-1024'],
  docs: ['canonical', 'tagged'],
  queries: ['raw', 'taste-expanded'],
  dims: [1024, 768, 384, 256],
  topK: [5, 10],
  seeds: [1, 2, 3],
  minRelevantsPerQuery: 5,
  outDir: 'results/large',
};

export default config;
