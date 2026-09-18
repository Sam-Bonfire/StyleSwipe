import { Effect } from 'effect';

import type { Product, PaginatedResult } from '../../../shared/domain/types';

import { ProductRepository, UserRepository } from '../../../shared/application/ports';
import { RepositoryError, StyleProfileNotFoundError } from '../../../shared/domain/errors';
import { cosineSimilarity } from '../../identity/domain/StyleDNA';
import { SwipeRepository } from '../application/DiscoveryPorts';

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

    // 4. Calculate relevance scores
    const scoredProducts = unswipedCandidates.map(product => {
        let score = 0;

        // Cosine Similarity on StyleDNA
        if (product.embedding && product.embedding.length === userVector.length) {
            const similarity = cosineSimilarity(userVector, product.embedding);
            score += similarity * 2; // Weight vector similarity heavily
        }

        // Price Affinity Scoring
        if (profile.budget && product.price >= profile.budget.min && product.price <= profile.budget.max) {
            score += 1.0;
        } else if (profile.budget) {
            score -= 0.5; // Penalty for being outside budget
        }

        // Brand/Category Affinities
        if (profile.vibes) {
            const brandMatch = profile.vibes.some(v => product.brand?.toLowerCase().includes(v.toLowerCase()));
            if (brandMatch) score += 0.5;

            const categoryMatch = profile.vibes.some(v => product.category?.toLowerCase().includes(v.toLowerCase()));
            if (categoryMatch) score += 0.5;
        }

        return { product, score };
    });

    // Sort by descending score
    scoredProducts.sort((a, b) => b.score - a.score);

    // 5. Diversity Re-ranking
    const reRanked: Product[] = [];
    const maxPerBrand = 2;
    const maxPerCategory = 3;
    const brandCounts: Record<string, number> = {};
    const categoryCounts: Record<string, number> = {};

    for (const item of scoredProducts) {
        const brand = item.product.brand || 'unknown';
        const category = item.product.category || 'unknown';

        const bCount = brandCounts[brand] || 0;
        const cCount = categoryCounts[category] || 0;

        // Apply diversity filters
        if (bCount < maxPerBrand && cCount < maxPerCategory) {
            reRanked.push(item.product);
            brandCounts[brand] = bCount + 1;
            categoryCounts[category] = cCount + 1;
        }

        if (reRanked.length >= limit) {
            break;
        }
    }

    // Fallback: if we filtered too much due to diversity, just fill it up with highest scored
    if (reRanked.length < limit) {
        for (const item of scoredProducts) {
            if (!reRanked.some(p => p.id === item.product.id)) {
                reRanked.push(item.product);
            }
            if (reRanked.length >= limit) break;
        }
    }

    return {
        page: reRanked.slice(0, limit),
        isDone: true, // For simplicity
        continueCursor: 'end',
    };
});
