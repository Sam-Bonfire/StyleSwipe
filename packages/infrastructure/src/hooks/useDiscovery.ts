import type { Id } from '@app/convex';

import { api } from '@app/convex';
import { SwipeRepository, RepositoryError, type SwipeAction } from '@app/core';
import { ProcessSwipe } from '@app/core';
const { processSwipe } = ProcessSwipe;
type ProcessSwipeInput = ProcessSwipe.ProcessSwipeInput;
import { useQuery, useMutation, useAction } from 'convex/react';
import { Effect, Layer } from 'effect';

export function useRecentlyViewed(limit: number = 10) {
  return useQuery(api.discovery.getRecentlyViewed, { limit });
}

export function useRecordProductView() {
  return useMutation(api.discovery.recordProductView);
}

export function useVectorFeed() {
  return useAction(api.recommendations.getVectorFeed);
}

export function useCalibrationFeed(limit: number = 10) {
  return useQuery(api.discovery.getCalibrationFeed, { limit });
}

export function useUserSwipedIds(userId: string | undefined) {
  return useQuery(api.discovery.getUserSwipedIds, userId ? { userId } : 'skip');
}

export function usePartnerLikes(partnerId: string | undefined) {
  return useQuery(api.discovery.getPartnerLikes, partnerId ? { partnerId } : 'skip');
}

export function useProcessSwipe() {
  const swipeMutation = useMutation(api.discovery.processSwipe);

  return async (input: ProcessSwipeInput) => {
    const program = processSwipe(input);

    const layer = Layer.succeed(
      SwipeRepository,
      SwipeRepository.of({
        recordSwipe: (userId, productId, action: SwipeAction, timestamp, newPreferenceVector, partnerId) =>
          Effect.tryPromise({
            try: async () => {
              const res = await swipeMutation({ productId: productId as Id<'products'>, action, newPreferenceVector, partnerId });
              return { isMutualMatch: res?.isMutualMatch };
            },
            catch: (e) => new RepositoryError(e instanceof Error ? e.message : String(e), e),
          }),
        getSwipesByUser: () => Effect.succeed([]),
      }),
    );

    return Effect.runPromise(program.pipe(Effect.provide(layer)));
  };
}
