import { Effect } from 'effect';

import type { AdminStats, PaginationOpts, PaginatedResult, Product } from '../../../shared/domain/types';

import { AdminRepository } from '../../../shared/application/ports';
import { RepositoryError } from '../../../shared/domain/errors';

export class AdminDashboardError extends Error {
    readonly _tag = 'AdminDashboardError' as const;
    constructor(message: string) {
        super(message);
        this.name = 'AdminDashboardError';
    }
}

export const getStats = (): Effect.Effect<AdminStats, AdminDashboardError | RepositoryError, AdminRepository> =>
    Effect.gen(function* (_) {
        const admin = yield* _(AdminRepository);
        return yield* _(admin.getStats());
    });

export const getScrapedProducts = (
    paginationOpts: PaginationOpts,
): Effect.Effect<PaginatedResult<Product>, AdminDashboardError | RepositoryError, AdminRepository> =>
    Effect.gen(function* (_) {
        const admin = yield* _(AdminRepository);
        return yield* _(admin.getScrapedProducts(paginationOpts));
    });

export const searchProducts = (
    query: string,
    paginationOpts: PaginationOpts,
): Effect.Effect<PaginatedResult<Product>, AdminDashboardError | RepositoryError, AdminRepository> =>
    Effect.gen(function* (_) {
        const admin = yield* _(AdminRepository);
        return yield* _(admin.searchProducts(query, paginationOpts));
    });

export const retriggerScrape = (
    productId: string,
): Effect.Effect<void, AdminDashboardError | RepositoryError, AdminRepository> =>
    Effect.gen(function* (_) {
        const admin = yield* _(AdminRepository);
        yield* _(admin.retriggerScrape(productId));
    });
