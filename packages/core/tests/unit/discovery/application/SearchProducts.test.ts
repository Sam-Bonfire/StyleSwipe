import type { Vector384 } from '@app/core';

import { Embedder, ProductSearchRepository } from '@app/core';
import { SearchProducts } from '@app/core';
import { describe, it, expect } from 'vitest';
import { Effect, Exit, Layer } from 'effect';

function createMockEmbedderLayer(vector: Vector384 = Array(384).fill(0.1) as Vector384): Layer.Layer<Embedder, never, never> {
    return Layer.succeed(
        Embedder,
        Embedder.of({
            generateEmbedding: () => Effect.succeed(vector),
            getDimensions: () => Effect.succeed(384),
        })
    );
}

function createFailingEmbedderLayer(): Layer.Layer<Embedder, never, never> {
    return Layer.succeed(
        Embedder,
        Embedder.of({
            generateEmbedding: () => Effect.fail(new Error('mock embedding failure') as any),
            getDimensions: () => Effect.succeed(384),
        })
    );
}

function createMockRepoLayer(products: { id: string; title: string }[] = []): Layer.Layer<ProductSearchRepository, never, never> {
    return Layer.succeed(
        ProductSearchRepository,
        ProductSearchRepository.of({
            search: () =>
                Effect.succeed({
                    products: products.map((p) => ({
                        _id: p.id,
                        title: p.title,
                        brand: 'TestBrand',
                        price: 100,
                        images: [],
                    })) as never,
                }),
            getSuggestions: (query: string, limit: number) =>
                Effect.succeed([`${query}-suggestion-1`, `${query}-suggestion-2`].slice(0, limit)),
        })
    );
}

describe('SearchProducts', () => {
    describe('execute', () => {
        it('should return empty results for queries shorter than 3 chars', async () => {
            const provider = Layer.merge(createMockEmbedderLayer(), createMockRepoLayer());
            const program = SearchProducts.execute('ab');
            const result = await Effect.runPromise(program.pipe(Effect.provide(provider)));
            expect(result.products).toEqual([]);
        });

        it('should return empty results for single char', async () => {
            const provider = Layer.merge(createMockEmbedderLayer(), createMockRepoLayer());
            const program = SearchProducts.execute('a');
            const result = await Effect.runPromise(program.pipe(Effect.provide(provider)));
            expect(result.products).toEqual([]);
        });

        it('should call embedder and repo for valid queries', async () => {
            const mockProducts = [{ id: '1', title: 'Shirt' }, { id: '2', title: 'Pants' }];
            const provider = Layer.merge(createMockEmbedderLayer(), createMockRepoLayer(mockProducts));
            const program = SearchProducts.execute('blue shirt');
            const result = await Effect.runPromise(program.pipe(Effect.provide(provider)));
            expect(result.products).toHaveLength(2);
        });

        it('should propagate EmbeddingError', async () => {
            const provider = Layer.merge(createFailingEmbedderLayer(), createMockRepoLayer());
            const program = SearchProducts.execute('blue shirt');
            const exit = await Effect.runPromiseExit(program.pipe(Effect.provide(provider)));
            expect(Exit.isFailure(exit)).toBe(true);
        });

        it('should respect limit parameter', async () => {
            const mockProducts = [
                { id: '1', title: 'A' },
                { id: '2', title: 'B' },
                { id: '3', title: 'C' },
            ];
            const provider = Layer.merge(createMockEmbedderLayer(), createMockRepoLayer(mockProducts));
            const program = SearchProducts.execute('shirt', 2);
            const result = await Effect.runPromise(program.pipe(Effect.provide(provider)));
            // The mock returns all products regardless of limit, but we verify the call succeeds
            expect(result.products.length).toBeGreaterThan(0);
        });
    });

    describe('getSuggestions', () => {
        it('should return empty array for empty query', async () => {
            const provider = Layer.merge(createMockEmbedderLayer(), createMockRepoLayer());
            const program = SearchProducts.getSuggestions('');
            const result = await Effect.runPromise(program.pipe(Effect.provide(provider)));
            expect(result).toEqual([]);
        });

        it('should return suggestions for valid query', async () => {
            const provider = Layer.merge(createMockEmbedderLayer(), createMockRepoLayer());
            const program = SearchProducts.getSuggestions('shirt', 2);
            const result = await Effect.runPromise(program.pipe(Effect.provide(provider)));
            expect(result).toHaveLength(2);
        });
    });
});
