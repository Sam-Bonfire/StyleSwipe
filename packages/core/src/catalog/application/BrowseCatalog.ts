import { Effect } from 'effect';

import type { Product } from '../../../shared/domain/types';

import { ProductRepository } from '../../../shared/application/ports';
import { RepositoryError } from '../../../shared/domain/errors';

export class CatalogError extends Error {
    readonly _tag = 'CatalogError' as const;
    constructor(message: string) {
        super(message);
        this.name = 'CatalogError';
    }
}

export const getLatest = (limit: number): Effect.Effect<Product[], CatalogError | RepositoryError, ProductRepository> =>
    Effect.gen(function* (_) {
        const products = yield* _(ProductRepository);
        return yield* _(products.getLatest(limit));
    });

export const getByCategory = (
    category: string,
    limit?: number,
): Effect.Effect<Product[], CatalogError | RepositoryError, ProductRepository> =>
    Effect.gen(function* (_) {
        const products = yield* _(ProductRepository);
        return yield* _(products.findByCategory(category, limit));
    });

export const getById = (id: string): Effect.Effect<Product | null, CatalogError | RepositoryError, ProductRepository> =>
    Effect.gen(function* (_) {
        const products = yield* _(ProductRepository);
        return yield* _(products.findById(id));
    });
