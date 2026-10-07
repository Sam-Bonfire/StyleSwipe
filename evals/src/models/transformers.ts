import type { SimpleModel } from '../types.js';

import { normalize } from '../search.js';

type FeatureExtractionPipeline = (
  text: string | string[],
  options: { pooling: 'mean'; normalize: boolean },
) => Promise<{ data: ArrayLike<number>; dims: number[] }>;

const BATCH_SIZE = 32;

/**
 * transformers.js adapter (node). Loads the model lazily on first embed so
 * unit tests and `--list` never pay the download cost. Embeds in batches —
 * per-text calls are 10-50x slower and would make sweeps impractical.
 *
 * Symmetric core: no prefixes here. Retrieval-style prefixes live in
 * `withPrefixes` (models/adapters.ts) and are applied by builtins.
 * Bump `version` if pooling/normalize/batching ever changes the vectors.
 */
export function transformersModel(
  id: string,
  hfName: string,
  dims: number,
  approxBytes: number,
): SimpleModel {
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
    version: '1',
    embed: async (texts: string[]): Promise<number[][]> => {
      const pipe = await load();
      const vectors: number[][] = [];
      for (let i = 0; i < texts.length; i += BATCH_SIZE) {
        const batch = texts.slice(i, i + BATCH_SIZE);
        const output = await pipe(batch, { pooling: 'mean', normalize: false });
        const data = Array.from(output.data);
        const width = output.dims[output.dims.length - 1] as number;
        for (let row = 0; row < batch.length; row++) {
          vectors.push(normalize(data.slice(row * width, row * width + width).slice(0, dims)));
        }
      }
      return vectors;
    },
  };
}

/** Incumbent: what the app ships today (BGE-small, 384-dim, no instruction). */
export const bgeSmall = (): SimpleModel =>
  transformersModel('bge-small-384', 'Xenova/bge-small-en-v1.5', 384, 133_000_000);

/** Incumbent id for the vendor-recommended retrieval instruction variant (prefix applied in builtins). */
export const bgeSmallInstructBase = (): SimpleModel =>
  transformersModel('bge-small-384-instruct', 'Xenova/bge-small-en-v1.5', 384, 133_000_000);

/** Speed/quality tradeoff king (90MB fp32, 384-dim, no prefixes needed). */
export const miniLm = (): SimpleModel =>
  transformersModel('minilm-l6-384', 'Xenova/all-MiniLM-L6-v2', 384, 90_000_000);

/** Quality contender (prefixes applied in builtins — E5 must be judged with them). */
export const e5SmallBase = (): SimpleModel =>
  transformersModel('e5-small-384', 'Xenova/e5-small-v2', 384, 133_000_000);

/**
 * Hinglish/vernacular probe. OVER on-device budget (~470MB fp32) — eval-only,
 * to quantify what we'd lose by staying English-only. Run separately, not in
 * the default matrix.
 */
export const multilingualE5SmallBase = (): SimpleModel =>
  transformersModel('ml-e5-small-384', 'Xenova/multilingual-e5-small', 384, 470_000_000);
