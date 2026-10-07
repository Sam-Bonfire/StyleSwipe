import type { ModelAdapter } from '../types.js';

import { normalize } from '../search.js';

/**
 * Deterministic hash-word embedder. No downloads, no network — used by unit
 * tests and offline smoke runs. NOT a quality baseline: it only checks that
 * the harness mechanics (ranking, metrics, reporting) work.
 */
export function fakeHashEmbedder(dims = 64): ModelAdapter {
  return {
    id: `fake-hash-${dims}`,
    dims,
    approxBytes: 0,
    embed: (texts: string[], role: 'query' | 'doc'): Promise<number[][]> =>
      Promise.resolve(texts.map((text) => normalize(hashVector(`${role} ${text}`, dims)))),
  };
}

function hashWord(word: string, dims: number): number {
  let hash = 2166136261;
  for (let i = 0; i < word.length; i++) {
    hash ^= word.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return ((hash >>> 0) % dims + dims) % dims;
}

function hashVector(text: string, dims: number): number[] {
  const vector = new Array<number>(dims).fill(0);
  for (const word of text.toLowerCase().split(/[^a-z0-9]+/).filter(Boolean)) {
    vector[hashWord(word, dims)] += 1;
  }
  return vector;
}
