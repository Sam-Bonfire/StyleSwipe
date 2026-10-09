import type { TuneConfig } from '../src/types.js';

/**
 * Learning-dynamics sweep on the retrieval winner (e5-small + tagged).
 * Grid: 4 alphas x 4 betas x 4 super-multipliers x 2 seeds (5 likes + 5
 * passes per session, interleaved, first like upgraded to super).
 * Plus a 5x5 diversity-caps sweep on no-learning rankings.
 */
const config: TuneConfig = {
  corpus: 'data/corpus.v1.jsonl',
  judgments: 'data/judgments.v2.json',
  model: 'e5-small-384',
  doc: 'tagged',
  query: 'raw',
  dims: 384,
  alphas: [0.05, 0.1, 0.2, 0.3],
  betas: [0.02, 0.05, 0.1, 0.2],
  supers: [1, 2, 3, 5],
  budgets: [5],
  seeds: [1, 2],
  topK: 10,
  capsBrands: [1, 2, 3, 5, 999],
  capsCategories: [1, 2, 3, 5, 999],
  minRelevantsPerQuery: 5,
  outDir: 'results/tune',
};

export default config;
