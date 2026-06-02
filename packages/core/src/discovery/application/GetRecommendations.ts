import { Effect } from 'effect';

import type { Product } from '../../../shared/domain/types';

import { RepositoryError } from '../../../shared/domain/errors';
import { RecommendationService } from '../application/DiscoveryPorts';

export class RecommendationError extends Error {
    readonly _tag = 'RecommendationError' as const;
    constructor(message: string) {
        super(message);
        this.name = 'RecommendationError';
    }
}

export const getVectorFeed = (
    userId: string,
    limit: number,
): Effect.Effect<Product[], RecommendationError | RepositoryError, RecommendationService> => Effect.gen(function* (_) {
    const recommendations = yield* _(RecommendationService);
    return yield* _(recommendations.getVectorFeed(userId, limit));
});

export const getCalibrationFeed = (
    userId: string,
    limit: number,
): Effect.Effect<Product[], RecommendationError | RepositoryError, RecommendationService> => Effect.gen(function* (_) {
    const recommendations = yield* _(RecommendationService);
    return yield* _(recommendations.getCalibrationFeed(userId, limit));
});
