import { Effect } from 'effect';

import type { AdminRepository } from '../../../shared/domain/ports';
import type { AdminStats, PaginationOpts, PaginatedResult, Product } from '../../../shared/domain/types';

// -----------------------------------------------------------------------------
// TAGGED ERRORS
// -----------------------------------------------------------------------------

export class AdminDashboardError extends Error {
    readonly _tag = 'AdminDashboardError' as const;
    constructor(message: string) {
        super(message);
        this.name = 'AdminDashboardError';
    }
}

// -----------------------------------------------------------------------------
// USE CASE: Manage Admin Dashboard
// -----------------------------------------------------------------------------

/**
 * Admin dashboard operations: stats, product browsing, re-scraping.
 */
export class ManageAdminDashboard {
    constructor(private readonly admin: AdminRepository) { }

    getStats(): Effect.Effect<AdminStats, AdminDashboardError> {
        return Effect.tryPromise({
            try: () => this.admin.getStats(),
            catch: () => new AdminDashboardError('Failed to fetch admin stats'),
        });
    }

    getScrapedProducts(
        paginationOpts: PaginationOpts,
    ): Effect.Effect<PaginatedResult<Product>, AdminDashboardError> {
        return Effect.tryPromise({
            try: () => this.admin.getScrapedProducts(paginationOpts),
            catch: () => new AdminDashboardError('Failed to fetch scraped products'),
        });
    }

    searchProducts(
        query: string,
        paginationOpts: PaginationOpts,
    ): Effect.Effect<PaginatedResult<Product>, AdminDashboardError> {
        return Effect.tryPromise({
            try: () => this.admin.searchProducts(query, paginationOpts),
            catch: () => new AdminDashboardError('Failed to search products'),
        });
    }

    retriggerScrape(
        productId: string,
    ): Effect.Effect<void, AdminDashboardError> {
        return Effect.tryPromise({
            try: () => this.admin.retriggerScrape(productId),
            catch: () => new AdminDashboardError('Failed to retrigger scrape'),
        });
    }
}
