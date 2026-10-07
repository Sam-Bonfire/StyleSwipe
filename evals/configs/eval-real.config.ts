import type { ExperimentConfig } from '../src/types.js';

/**
 * Real sweep: dev-DB corpus (500 women's ethnic products) + rule-derived
 * weak judgments. DB-free at run time; downloads ~400MB of models once.
 *
 * Matrix: 4 models x 7 doc layouts x 2 query builders x 3 dim levels x 3 seeds.
 * Dim truncation is post-hoc (no re-embedding), so the dims axis is nearly free.
 * (bge-micro dropped: no verified Xenova/transformers.js build — HF 401s.
 * MiniLM already covers the small-model slot; the dims axis answers the
 * size question empirically.)
 */
const config: ExperimentConfig = {
  corpus: 'data/corpus.v1.jsonl',
  judgments: 'data/judgments.v2.json',
  models: ['bge-small-384', 'bge-small-384-instruct', 'minilm-l6-384', 'e5-small-384'],
  docs: ['title-only', 'title-brand', 'title-brand-desc', 'canonical', 'tagged', 'color-weighted', 'attrs-only'],
  queries: ['raw', 'taste-expanded'],
  dims: [384, 256, 128],
  topK: [5, 10],
  seeds: [1, 2, 3],
  minRelevantsPerQuery: 5,
  outDir: 'results/v1',
};

export default config;
