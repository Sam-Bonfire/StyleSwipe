import { describe, expect, it } from 'vitest';

import { loadCorpus, loadJudgments } from '../src/corpus.js';
import { bruteForceTopK, cosineSimilarity, normalize } from '../src/search.js';

describe('search math', () => {
  it('handles degenerate vectors', () => {
    expect(normalize([0, 0, 0])).toEqual([0, 0, 0]);
    expect(cosineSimilarity([1, 0], [0, 0])).toBe(0);
    expect(cosineSimilarity([1, 0], [1, 0])).toBeCloseTo(1, 5);
  });

  it('ranks by cosine desc', () => {
    const ranked = bruteForceTopK(
      [1, 0],
      [
        { id: 'b', vector: [0, 1] },
        { id: 'a', vector: [1, 0] },
      ],
      2,
    );
    expect(ranked.map((r) => r.id)).toEqual(['a', 'b']);
    expect(ranked[0]?.rank).toBe(1);
  });
});

describe('corpus loading', () => {
  it('loads the fixture corpus', () => {
    const products = loadCorpus('data/corpus.fixture.jsonl');
    expect(products).toHaveLength(12);
  });

  it('drops thin queries and reports them', () => {
    const { queries, dropped } = loadJudgments('data/judgments.fixture.json', 3);
    expect(queries.length).toBeGreaterThan(0);
    expect(dropped).toEqual([]);
    const strict = loadJudgments('data/judgments.fixture.json', 99);
    expect(strict.queries).toEqual([]);
    expect(strict.dropped).toHaveLength(4);
  });
});
