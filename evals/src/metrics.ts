import type { EvalProduct, PersonaQuery, RankedId } from './types.js';

import { cosineSimilarity } from './search.js';

/** Recall@K over the judged relevant set. */
export function recallAtK(ranked: RankedId[], relevantIds: string[], k: number): number {
  if (relevantIds.length === 0) return 0;
  const top = new Set(ranked.slice(0, k).map((r) => r.id));
  const hits = relevantIds.filter((id) => top.has(id)).length;
  return hits / relevantIds.length;
}

/** nDCG@K with binary relevance. */
export function ndcgAtK(ranked: RankedId[], relevantIds: string[], k: number): number {
  const relevant = new Set(relevantIds);
  const gains: number[] = ranked.slice(0, k).map((r) => (relevant.has(r.id) ? 1 : 0));
  const dcg = gains.reduce((sum, gain, i) => sum + gain / Math.log2(i + 2), 0);
  const idealHits = Math.min(k, relevantIds.length);
  let idcg = 0;
  for (let i = 0; i < idealHits; i++) idcg += 1 / Math.log2(i + 2);
  return idcg === 0 ? 0 : dcg / idcg;
}

/**
 * Attribute-hit@K: fraction of top-K items matching ANY required color,
 * occasion, or fit (empty requirement lists are ignored). Directly tests
 * complaints like "dark colors + casual vibe ignored".
 */
export function attrHitAtK(
  ranked: RankedId[],
  byId: Map<string, EvalProduct>,
  query: PersonaQuery,
  k: number,
): number {
  const wants = [...query.requiredAttrs.color, ...query.requiredAttrs.occasion, ...query.requiredAttrs.fit];
  if (wants.length === 0) return 1;
  const top = ranked.slice(0, k);
  if (top.length === 0) return 0;
  const wantSet = new Set(wants);
  const hits = top.filter((r) => {
    const product = byId.get(r.id);
    if (!product) return false;
    return (
      wantSet.has(product.color) ||
      product.occasion.some((o) => wantSet.has(o)) ||
      (product.fit !== '' && wantSet.has(product.fit))
    );
  }).length;
  return hits / top.length;
}

/** Coverage@K: 1 when at least one relevant is retrieved, else 0. */
export function coverageAtK(ranked: RankedId[], relevantIds: string[], k: number): number {
  const top = new Set(ranked.slice(0, k).map((r) => r.id));
  return relevantIds.some((id) => top.has(id)) ? 1 : 0;
}

/**
 * Diversity@K: 1 - mean pairwise cosine over top-K doc vectors.
 * Catches "same 10 items" collapse.
 */
export function diversityAtK(ranked: RankedId[], vectors: Map<string, number[]>, k: number): number {
  const top = ranked.slice(0, k);
  if (top.length < 2) return 1;
  let sum = 0;
  let pairs = 0;
  for (let i = 0; i < top.length; i++) {
    for (let j = i + 1; j < top.length; j++) {
      const a = vectors.get((top[i] as RankedId).id);
      const b = vectors.get((top[j] as RankedId).id);
      if (!a || !b) continue;
      sum += cosineSimilarity(a, b);
      pairs++;
    }
  }
  if (pairs === 0) return 1;
  return 1 - sum / pairs;
}
