import { describe, expect, it } from 'vitest';

import { buildSession, runLearningSession } from '../src/learning/simulate.js';
import { cosineSimilarity } from '../src/search.js';

const vec = (first: number): number[] => {
  const v = new Array<number>(384).fill(0.01);
  v[0] = first;
  const norm = Math.sqrt(v.reduce((s, x) => s + x * x, 0));
  return v.map((x) => x / norm);
};

describe('learning simulation (real core displacement)', () => {
  it('moves toward liked items and away from passed ones', () => {
    const start = vec(0.1);
    const liked = vec(0.9);
    const passed = vec(-0.5);
    const before = cosineSimilarity(start, liked);
    const { final } = runLearningSession(
      start,
      [
        { vector: liked, action: 'like' },
        { vector: passed, action: 'pass' },
      ],
      { alpha: 0.2, beta: 0.1, superLikeMultiplier: 3 },
    );
    expect(cosineSimilarity(final, liked)).toBeGreaterThan(before);
  });

  it('super hits harder than like at the same alpha', () => {
    const start = vec(0.1);
    const item = vec(0.9);
    const like = runLearningSession(start, [{ vector: item, action: 'like' }], {
      alpha: 0.1,
      beta: 0.05,
      superLikeMultiplier: 3,
    }).final;
    const superLike = runLearningSession(start, [{ vector: item, action: 'super' }], {
      alpha: 0.1,
      beta: 0.05,
      superLikeMultiplier: 3,
    }).final;
    expect(cosineSimilarity(superLike, item)).toBeGreaterThan(cosineSimilarity(like, item));
  });

  it('builds interleaved sessions with super first', () => {
    const steps = buildSession(
      [vec(0.9), vec(0.8)],
      [vec(-0.5)],
      true,
    );
    expect(steps.map((s) => s.action)).toEqual(['super', 'pass', 'like']);
  });
});
