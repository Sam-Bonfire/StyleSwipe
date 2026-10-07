import { describe, expect, test } from 'vitest';

import { applyDisplacement, Vector384 } from '../../../../src/identity/domain/StyleDNA';

describe('StyleDNA - applyDisplacement', () => {
  // Create dummy vectors (size 384)
  // For simplicity, we can use smaller ones if the logic doesn't strictly check length,
  // but the type says Vector384. The function loops VECTOR_DIMENSIONS (384) times.
  // So we must satisfy that.
  const createVector = (val: number): Vector384 => Array(384).fill(val);

  const cosine = (a: Vector384, b: Vector384): number => {
    const dot = a.reduce((s, v, i) => s + v * (b[i] as number), 0);
    const na = Math.sqrt(a.reduce((s, v) => s + v * v, 0));
    const nb = Math.sqrt(b.reduce((s, v) => s + v * v, 0));
    return dot / (na * nb);
  };
  const norm = (v: Vector384): number => Math.sqrt(v.reduce((s, x) => s + x * x, 0));
  // Non-uniform vectors so direction (not just scale) is testable.
  const userVec = (): Vector384 => Array.from({ length: 384 }, (_, i) => 0.5 + (i % 8) * 0.01);
  const itemVec = (): Vector384 => Array.from({ length: 384 }, (_, i) => 1.0 - (i % 8) * 0.01);

  test('Right Swipe (Like) moves vector towards item', () => {
    const u = userVec();
    const item = itemVec();
    const before = cosine(u, item);
    const result = applyDisplacement(u, item, 'like');

    expect(norm(result)).toBeCloseTo(1, 4);
    expect(cosine(result, item)).toBeGreaterThan(before);
  });

  test('Left Swipe (Pass) pushes vector away from item', () => {
    const u = userVec();
    const item = itemVec();
    const before = cosine(u, item);
    const result = applyDisplacement(u, item, 'pass');

    expect(norm(result)).toBeCloseTo(1, 4);
    expect(cosine(result, item)).toBeLessThan(before);
  });

  test('Super Like moves vector significantly towards item', () => {
    const u = userVec();
    const item = itemVec();
    const like = applyDisplacement(u, item, 'like');
    const superLike = applyDisplacement(u, item, 'super');

    expect(norm(superLike)).toBeCloseTo(1, 4);
    expect(cosine(superLike, item)).toBeGreaterThan(cosine(like, item));
  });

  test('Handles arrays correctly', () => {
    const userVec = createVector(0);
    const itemVec = createVector(1);

    const result = applyDisplacement(userVec, itemVec, 'like');
    // Raw 0 + 0.1 * (1 - 0) = 0.1 per dim, then unit-norm => 1/sqrt(384)
    expect(result).toHaveLength(384);
    expect(result[0]).toBeCloseTo(1 / Math.sqrt(384), 6);
    expect(result[383]).toBeCloseTo(1 / Math.sqrt(384), 6);
  });
});
