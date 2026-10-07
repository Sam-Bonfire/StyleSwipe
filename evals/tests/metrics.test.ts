import { describe, expect, it } from 'vitest';

import type { EvalProduct, PersonaQuery, RankedId } from '../src/types.js';

import { attrHitAtK, coverageAtK, diversityAtK, ndcgAtK, recallAtK } from '../src/metrics.js';

const ranked: RankedId[] = [
  { id: 'a', score: 0.9, rank: 1 },
  { id: 'b', score: 0.8, rank: 2 },
  { id: 'c', score: 0.7, rank: 3 },
];

function product(id: string, color: string, occasion: string[]): EvalProduct {
  return {
    id,
    title: id,
    brand: 'x',
    description: '',
    category: 'shirts',
    gender: 'men',
    priceTier: 'mid',
    attributes: {},
    color,
    fit: 'slim',
    occasion,
  };
}

describe('metrics', () => {
  it('computes recall@K', () => {
    expect(recallAtK(ranked, ['a', 'b', 'z'], 2)).toBeCloseTo(2 / 3, 5);
    expect(recallAtK(ranked, ['z'], 3)).toBe(0);
  });

  it('computes nDCG@K with perfect ranking = 1', () => {
    expect(ndcgAtK(ranked, ['a', 'b', 'c'], 3)).toBeCloseTo(1, 5);
    expect(ndcgAtK(ranked, ['z'], 3)).toBe(0);
  });

  it('computes attr-hit from product attributes', () => {
    const byId = new Map([
      ['a', product('a', 'black', ['casual'])],
      ['b', product('b', 'white', ['formal'])],
      ['c', product('c', 'black', ['party'])],
    ]);
    const query: PersonaQuery = {
      id: 'q',
      text: 'dark casual',
      relevantIds: ['a'],
      requiredAttrs: { color: ['black'], occasion: ['casual'], fit: [] },
    };
    expect(attrHitAtK(ranked, byId, query, 2)).toBeCloseTo(0.5, 5);
  });

  it('computes coverage and diversity bounds', () => {
    expect(coverageAtK(ranked, ['z'], 3)).toBe(0);
    expect(coverageAtK(ranked, ['c'], 3)).toBe(1);
    const vectors = new Map([
      ['a', [1, 0]],
      ['b', [0, 1]],
      ['c', [1, 0]],
    ]);
    const diversity = diversityAtK(ranked, vectors, 3);
    expect(diversity).toBeGreaterThan(0);
    expect(diversity).toBeLessThanOrEqual(1);
  });
});
