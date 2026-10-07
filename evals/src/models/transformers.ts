import type { ModelAdapter } from '../types.js';

import { normalize } from '../search.js';

type FeatureExtractionPipeline = (
  text: string | string[],
  options: { pooling: 'mean'; normalize: boolean },
) => Promise<{ data: ArrayLike<number> }>;

/**
 * transformers.js adapter (node). Loads the model lazily on first embed so
 * unit tests and `--list` never pay the download cost.
 */
export function transformersModel(
  id: string,
  hfName: string,
  dims: number,
  approxBytes: number,
): ModelAdapter {
  let extractor: FeatureExtractionPipeline | null = null;
  const load = async (): Promise<FeatureExtractionPipeline> => {
    if (!extractor) {
      const { pipeline } = await import('@xenova/transformers');
      extractor = (await pipeline('feature-extraction', hfName, {})) as FeatureExtractionPipeline;
    }
    return extractor;
  };
  return {
    id,
    dims,
    approxBytes,
    embed: async (texts: string[]): Promise<number[][]> => {
      const pipe = await load();
      const vectors: number[][] = [];
      for (const text of texts) {
        const output = await pipe(text, { pooling: 'mean', normalize: false });
        vectors.push(normalize(Array.from(output.data).slice(0, dims)));
      }
      return vectors;
    },
  };
}

/** Incumbent: what the app ships today (BGE-small, 384-dim). */
export const bgeSmall = (): ModelAdapter =>
  transformersModel('bge-small-384', 'Xenova/bge-small-en-v1.5', 384, 133_000_000);

/** Small on-device candidates (all int8-quantizable, phone-sized). */
export const miniLm = (): ModelAdapter =>
  transformersModel('minilm-l6-384', 'Xenova/all-MiniLM-L6-v2', 384, 90_000_000);

export const e5Small = (): ModelAdapter =>
  transformersModel('e5-small-384', 'Xenova/e5-small-v2', 384, 133_000_000);

export const bgeMicro = (): ModelAdapter =>
  transformersModel('bge-micro-384', 'Xenova/bge-micro-v2', 384, 70_000_000);
