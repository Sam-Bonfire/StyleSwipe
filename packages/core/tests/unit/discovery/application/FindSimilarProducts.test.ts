import { Effect, Layer } from 'effect';
import { describe, expect, it } from 'vitest';

import { SimilarProductStore } from '../../../../src/discovery/application/DiscoveryPorts';
import { findSimilarProductIds } from '../../../../src/discovery/application/FindSimilarProducts';

const views = [
  { id: 'p1', brand: 'A', category: 'Kurtas' },
  { id: 'p2', brand: 'B', category: 'Kurtas' },
  { id: 'p3', brand: 'A', category: 'Shoes' },
];

const layer = Layer.succeed(
  SimilarProductStore,
  SimilarProductStore.of({
    getEmbedding: (id) => Effect.succeed(id === 'p0' ? [0.1, 0.2] : null),
    searchSimilar: () => Effect.succeed(['p1', 'p2', 'p3']),
    getViews: (ids) => Effect.succeed(ids.flatMap((id) => views.filter((v) => v.id === id))),
    getViewsByCategory: (category, limit) =>
      Effect.succeed(views.filter((v) => v.category === category).slice(0, limit)),
  }),
);

const run = (input: Parameters<typeof findSimilarProductIds>[0]) =>
  Effect.runPromise(findSimilarProductIds(input).pipe(Effect.provide(layer)));

describe('findSimilarProductIds', () => {
  it('excludes self, applies brand filter, and slices to limit', async () => {
    expect(await run({ productId: 'p1', embedding: [0.1, 0.2], limit: 10 })).toEqual(['p2', 'p3']);
    expect(await run({ embedding: [0.1, 0.2], brand: 'A', limit: 10 })).toEqual(['p1', 'p3']);
    expect(await run({ embedding: [0.1, 0.2], limit: 1 })).toEqual(['p1']);
  });

  it('falls back to category listing without an embedding', async () => {
    expect(await run({ productId: 'p2', limit: 10 })).toEqual(['p1']);
  });

  it('returns empty without embedding or product', async () => {
    expect(await run({ productId: 'missing', limit: 10 })).toEqual([]);
    expect(await run({})).toEqual([]);
  });
});
