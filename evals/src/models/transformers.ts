import type { ModelAdapter } from '../types.js';

import { normalize } from '../search.js';

type FeatureExtractionPipeline = (
  text: string | string[],
  options: { pooling: 'mean'; normalize: boolean },
) => Promise<{ data: ArrayLike<number>; dims: number[] }>;

export interface PrefixOptions {
  /** Prepended to query texts (e.g. E5's "query: "). */
  queryPrefix?: string;
  /** Prepended to document texts (e.g. E5's "passage: "). */
  docPrefix?: string;
  /** Max texts per pipeline call (memory guard). */
  batchSize?: number;
}

/**
 * transformers.js adapter (node). Loads the model lazily on first embed so
 * unit tests and `--list` never pay the download cost. Embeds in batches —
 * per-text calls are 10-50x slower and would make sweeps impractical.
 */
export function transformersModel(
  id: string,
  hfName: string,
  dims: number,
  approxBytes: number,
  prefixes: PrefixOptions = {},
): ModelAdapter {
  let extractor: FeatureExtractionPipeline | null = null;
  const batchSize = prefixes.batchSize ?? 32;
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
    embed: async (texts: string[], role: 'query' | 'doc'): Promise<number[][]> => {
      const pipe = await load();
      const prefix = role === 'query' ? (prefixes.queryPrefix ?? '') : (prefixes.docPrefix ?? '');
      const vectors: number[][] = [];
      for (let i = 0; i < texts.length; i += batchSize) {
        const batch = texts.slice(i, i + batchSize).map((t) => `${prefix}${t}`);
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
export const bgeSmall = (): ModelAdapter =>
  transformersModel('bge-small-384', 'Xenova/bge-small-en-v1.5', 384, 133_000_000);

/**
 * Incumbent + vendor-recommended retrieval instruction on queries.
 * BGE's own card says short queries should carry an instruction — this cell
 * tests whether that guidance holds for our data (prefix itself is a variable).
 */
export const bgeSmallInstruct = (): ModelAdapter =>
  transformersModel('bge-small-384-instruct', 'Xenova/bge-small-en-v1.5', 384, 133_000_000, {
    queryPrefix: 'Represent this sentence for searching relevant passages: ',
  });

/** Speed/quality tradeoff king (90MB fp32, 384-dim, no prefixes needed). */
export const miniLm = (): ModelAdapter =>
  transformersModel('minilm-l6-384', 'Xenova/all-MiniLM-L6-v2', 384, 90_000_000);

/** Quality contender — E5 requires query:/passage: prefixes to be judged fairly. */
export const e5Small = (): ModelAdapter =>
  transformersModel('e5-small-384', 'Xenova/e5-small-v2', 384, 133_000_000, {
    queryPrefix: 'query: ',
    docPrefix: 'passage: ',
  });

/**
 * Hinglish/vernacular probe. OVER on-device budget (~470MB fp32) — eval-only,
 * to quantify what we'd lose by staying English-only. Run separately, not in
 * the default matrix.
 */
export const multilingualE5Small = (): ModelAdapter =>
  transformersModel('ml-e5-small-384', 'Xenova/multilingual-e5-small', 384, 470_000_000, {
    queryPrefix: 'query: ',
    docPrefix: 'passage: ',
  });
