import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';

import type { ModelAdapter } from '../types.js';

interface PrecomputedFile {
  dims: number;
  version: string;
  vectors: Record<string, number[]>;
}

/**
 * Vectors produced OUTSIDE the TS harness (custom runtimes, vendor APIs).
 * File format: { dims, version, vectors: { <sha1(text).slice(0,16)>: [...] } }.
 * The key scheme must match texts.ts exactly — that script generates both
 * the texts to embed externally and the keys this adapter looks up, so
 * drift is impossible by construction. Missing keys throw (never silent zeros).
 */
export function precomputedVectors(id: string, jsonPath: string): ModelAdapter {
  let file: PrecomputedFile | null = null;
  const load = (): PrecomputedFile => {
    if (!file) {
      try {
        file = JSON.parse(readFileSync(jsonPath, 'utf8')) as PrecomputedFile;
      } catch {
        throw new Error(
          `Precomputed vectors missing: ${jsonPath}. Generate it first (see README "external vectors").`,
        );
      }
    }
    return file;
  };
  return {
    id,
    get dims(): number {
      return load().dims;
    },
    approxBytes: 0,
    cacheable: false,
    get version(): string {
      return load().version;
    },
    embed: (texts: string[]): Promise<number[][]> =>
      Promise.resolve(
        texts.map((text) => {
          const f = load();
          const key = textHash(text);
          const vector = f.vectors[key];
          if (!vector) throw new Error(`No precomputed vector for text hash ${key} in ${jsonPath}`);
          return vector;
        }),
      ),
  };
}

function textHash(text: string): string {
  return createHash('sha1').update(text).digest('hex').slice(0, 16);
}
