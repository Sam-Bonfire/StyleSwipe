import { Effect } from 'effect';

import type { Product, PaginatedResult } from '../../../shared/domain/types';

import { ProductRepository, UserRepository } from '../../../shared/application/ports';
import { RepositoryError, StyleProfileNotFoundError } from '../../../shared/domain/errors';
import { SwipeRepository } from '../application/DiscoveryPorts';
import { diversifyAndLimit, scoreCandidate } from '../domain/RecommendationScore';

export class RecommendationError extends Error {
    readonly _tag = 'RecommendationError' as const;
    constructor(message: string) {
        super(message);
        this.name = 'RecommendationError';
    }
}

export const getRecommendations = (
    userId: string,
    limit: number,
    
): Effect.Effect<
    PaginatedResult<Product>,
    RecommendationError | RepositoryError | StyleProfileNotFoundError,
    UserRepository | ProductRepository | SwipeRepository
> => Effect.gen(function* (_) {
    const userRepository = yield* _(UserRepository);
    const productRepository = yield* _(ProductRepository);
    const swipeRepository = yield* _(SwipeRepository);

    // 1. Load user StyleProfile and StyleDNA
    const user = yield* _(userRepository.findById(userId));
    if (!user || !user.styleProfile) {
        return yield* _(Effect.fail(new StyleProfileNotFoundError(`Style profile not found for user ${userId}`)));
    }
    const profile = user.styleProfile;
    const userVector = profile.preferenceVector;

    if (!userVector || userVector.length === 0) {
        return yield* _(Effect.fail(new RecommendationError('User does not have a preference vector initialized.')));
    }

    // 2. Fetch candidate products
    // Use getLatest to generate candidates (in real implementation, would query vector DB)
    const candidates = yield* _(productRepository.getLatest(200));

    // 3. Fetch user's swipes to filter out already-swiped products
    const swipes = yield* _(swipeRepository.getSwipesByUser(userId, 1000));
    const swipedProductIds = new Set(swipes.map(s => s.productId));

    const unswipedCandidates = candidates.filter(p => !swipedProductIds.has(p.id));

    // 4. Score, diversify, and limit (rules live in the domain service)
    const scoredProducts = unswipedCandidates.map((product) => ({
      product,
      score: scoreCandidate(userVector, profile, product),
    }));

    const reRanked = diversifyAndLimit(scoredProducts, limit);

    return {
        page: reRanked,
        isDone: true, // For simplicity
        continueCursor: 'end',
    };
});
