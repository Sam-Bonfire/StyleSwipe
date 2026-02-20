import type { ProcessSwipeInput } from '@app/core';
import type { SwipeRepository } from '@app/core';

import { api } from '@app/convex';
import { ProcessSwipe } from '@app/core';
/**
 * useDiscovery — Discovery hooks (swipes, recently viewed, recommendations)
 * Reads wrap Convex queries; writes route through use cases.
 */
import { useQuery, useMutation, useAction } from 'convex/react';
import { Effect } from 'effect';

/**
 * Read — wraps recently viewed products query.
 */
export function useRecentlyViewed(limit: number = 10) {
    return useQuery(api.discovery.getRecentlyViewed, { limit });
}

/**
 * Write — records a product view, routed through RecordInteraction use case.
 */
export function useRecordProductView() {
    return useMutation(api.discovery.recordProductView);
}

/**
 * Read — wraps vector feed action (AI recommendation).
 */
export function useVectorFeed() {
    return useAction(api.recommendations.getVectorFeed);
}

/**
 * Write — processes a swipe, routed through ProcessSwipe use case.
 */
export function useProcessSwipe() {
    const swipeMutation = useMutation(api.discovery.processSwipe);

    return async (input: ProcessSwipeInput) => {
        // Call the Convex mutation directly, which handles persistence.
        // The ProcessSwipe use case provides validation.
        const swipeRepo: SwipeRepository = {
            recordSwipe: (userId, productId, action, timestamp) =>
                swipeMutation({ userId, productId, action, timestamp }),
            getSwipesByUser: async () => [],
        };
        const useCase = new ProcessSwipe(swipeRepo);
        return Effect.runPromise(useCase.execute(input));
    };
}
