import { Effect } from 'effect';

import type { Product } from '../../../shared/domain/types';

import { RepositoryError } from '../../../shared/domain/errors';
import { RecentlyViewedRepository } from '../application/DiscoveryPorts';

export class InteractionError extends Error {
    readonly _tag = 'InteractionError' as const;
    constructor(message: string) {
        super(message);
        this.name = 'InteractionError';
    }
}

export const recordProductView = (
    userId: string,
    productId: string,
): Effect.Effect<void, InteractionError | RepositoryError, RecentlyViewedRepository> => Effect.gen(function* (_) {
    const repo = yield* _(RecentlyViewedRepository);
    yield* _(repo.recordProductView(userId, productId));
});

export const getRecentlyViewed = (
    userId: string,
    limit: number,
): Effect.Effect<Product[], InteractionError | RepositoryError, RecentlyViewedRepository> => Effect.gen(function* (_) {
    const repo = yield* _(RecentlyViewedRepository);
    return yield* _(repo.getRecentlyViewed(userId, limit));
});
