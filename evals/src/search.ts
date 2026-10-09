import type { RankedId } from './types.js';

/** L2-normalizes a vector (zero vectors stay zero). */
export function normalize(vector: number[]): number[] {
  const norm = Math.sqrt(vector.reduce((sum, value) => sum + value * value, 0));
  if (!norm || !Number.isFinite(norm)) return vector.map(() => 0);
  return vector.map((value) => value / norm);
}

/** Cosine similarity (0 when either side is degenerate). */
export function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length || a.length === 0) return 0;
  let dot = 0;
  let na = 0;
  let nb = 0;
  for (let i = 0; i < a.length; i++) {
    dot += (a[i] as number) * (b[i] as number);
    na += (a[i] as number) * (a[i] as number);
    nb += (b[i] as number) * (b[i] as number);
  }
  if (na === 0 || nb === 0) return 0;
  return dot / (Math.sqrt(na) * Math.sqrt(nb));
}

/**
 * Brute-force ground truth ranking. ANN (Convex) results are compared
 * against this separately — never conflated with embedding quality.
 */
export function bruteForceTopK(
  query: number[],
  docs: { id: string; vector: number[] }[],
  limit: number,
): RankedId[] {
  return docs
    .map((doc) => ({ id: doc.id, score: cosineSimilarity(query, doc.vector) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((row, index) => ({ ...row, rank: index + 1 }));
}

/** Mulberry32 PRNG. */
export function mulberry32(seed: number): () => number {
  let state = seed >>> 0 || 1;
  return (): number => {
    state |= 0;
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Bootstrap 95% CI of the mean: resample values with replacement
 * (seeded), return the 2.5/97.5 percentiles of resampled means.
 */
export function bootstrapCI(
  values: number[],
  resamples: number,
  seed: number,
): { lo: number; hi: number } {
  if (values.length === 0) return { lo: 0, hi: 0 };
  const rand = mulberry32(seed);
  const means: number[] = [];
  for (let r = 0; r < resamples; r++) {
    let sum = 0;
    for (let i = 0; i < values.length; i++) {
      sum += values[Math.floor(rand() * values.length)] as number;
    }
    means.push(sum / values.length);
  }
  means.sort((a, b) => a - b);
  return {
    lo: (means[Math.floor(0.025 * means.length)] as number) ?? 0,
    hi: (means[Math.min(means.length - 1, Math.floor(0.975 * means.length))] as number) ?? 0,
  };
}

/** Deterministic shuffle (mulberry32) for significance-style resampling. */
export function seededShuffle<T>(items: T[], seed: number): T[] {
  const copy = [...items];
  let state = seed >>> 0 || 1;
  const next = (): number => {
    state |= 0;
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(next() * (i + 1));
    const tmp = copy[i] as T;
    copy[i] = copy[j] as T;
    copy[j] = tmp;
  }
  return copy;
}
