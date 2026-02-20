import { Effect } from 'effect';

import type { ProductRepository } from '../../../shared/domain/ports';
import type { Product } from '../../../shared/domain/types';

// -----------------------------------------------------------------------------
// TAGGED ERRORS
// -----------------------------------------------------------------------------

export class CatalogError extends Error {
    readonly _tag = 'CatalogError' as const;
    constructor(message: string) {
        super(message);
        this.name = 'CatalogError';
    }
}

// -----------------------------------------------------------------------------
// USE CASE: Browse Catalog
// -----------------------------------------------------------------------------

/**
 * Read use case for browsing the product catalog.
 * Abstracts queries so screens don't call Convex directly.
 */
export class BrowseCatalog {
    constructor(private readonly products: ProductRepository) { }

    getLatest(limit: number): Effect.Effect<Product[], CatalogError> {
        return Effect.tryPromise({
            try: () => this.products.getLatest(limit),
            catch: () => new CatalogError('Failed to fetch latest products'),
        });
    }

    getByCategory(
        category: string,
        limit?: number,
    ): Effect.Effect<Product[], CatalogError> {
        return Effect.tryPromise({
            try: () => this.products.findByCategory(category, limit),
            catch: () => new CatalogError(`Failed to fetch products for category: ${category}`),
        });
    }

    getById(id: string): Effect.Effect<Product | null, CatalogError> {
        return Effect.tryPromise({
            try: () => this.products.findById(id),
            catch: () => new CatalogError(`Failed to fetch product: ${id}`),
        });
    }
}
