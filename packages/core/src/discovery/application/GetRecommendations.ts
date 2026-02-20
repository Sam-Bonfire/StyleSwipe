import { Effect } from 'effect';

import type { Product } from '../../../shared/domain/types';
import type { RecommendationService } from '../domain/DiscoveryPorts';

// -----------------------------------------------------------------------------
// TAGGED ERRORS
// -----------------------------------------------------------------------------

export class RecommendationError extends Error {
    readonly _tag = 'RecommendationError' as const;
    constructor(message: string) {
        super(message);
        this.name = 'RecommendationError';
    }
}

// -----------------------------------------------------------------------------
// USE CASE: Get Recommendations
// -----------------------------------------------------------------------------

/**
 * Retrieves AI-powered product recommendations for a user.
 */
export class GetRecommendations {
    constructor(
        private readonly recommendations: RecommendationService,
    ) { }

    getVectorFeed(
        userId: string,
        limit: number,
    ): Effect.Effect<Product[], RecommendationError> {
        return Effect.tryPromise({
            try: () => this.recommendations.getVectorFeed(userId, limit),
            catch: () => new RecommendationError('Failed to get vector feed'),
        });
    }
}
