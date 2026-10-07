import type { ExperimentConfig } from '../src/types.js';

/**
 * Hinglish probe: same corpus/judgments (includes 2 Hinglish queries), run
 * separately because ml-e5-small is OVER on-device budget (~470MB fp32).
 * Question answered: how much do we lose by staying English-only?
 */
const config: ExperimentConfig = {
  corpus: 'data/corpus.v1.jsonl',
  judgments: 'data/judgments.v2.json',
  models: ['ml-e5-small-384', 'bge-small-384'],
  docs: ['canonical', 'tagged'],
  queries: ['raw', 'taste-expanded'],
  dims: [384],
  topK: [5, 10],
  seeds: [1, 2, 3],
  minRelevantsPerQuery: 5,
  outDir: 'results/multilingual',
};

export default config;
