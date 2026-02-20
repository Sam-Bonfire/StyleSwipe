import { Effect } from 'effect';

import type { Product } from '../../../shared/domain/types';
import type { RecentlyViewedRepository } from '../domain/DiscoveryPorts';

// -----------------------------------------------------------------------------
// TAGGED ERRORS
// -----------------------------------------------------------------------------

export class InteractionError extends Error {
    readonly _tag = 'InteractionError' as const;
    constructor(message: string) {
        super(message);
        this.name = 'InteractionError';
    }
}

// -----------------------------------------------------------------------------
// USE CASE: Record Interaction
// -----------------------------------------------------------------------------

/**
 * Records user interactions (product views) and retrieves recently viewed.
 */
export class RecordInteraction {
    constructor(
        private readonly recentlyViewed: RecentlyViewedRepository,
    ) { }

    recordProductView(
        userId: string,
        productId: string,
    ): Effect.Effect<void, InteractionError> {
        return Effect.tryPromise({
            try: () => this.recentlyViewed.recordProductView(userId, productId),
            catch: () => new InteractionError('Failed to record product view'),
        });
    }

    getRecentlyViewed(
        userId: string,
        limit: number,
    ): Effect.Effect<Product[], InteractionError> {
        return Effect.tryPromise({
            try: () => this.recentlyViewed.getRecentlyViewed(userId, limit),
            catch: () => new InteractionError('Failed to get recently viewed products'),
        });
    }
}
