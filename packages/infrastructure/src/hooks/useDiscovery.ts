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

export function useProcessSwipe() {
  const swipeMutation = useMutation(api.discovery.processSwipe);

  return async (input: ProcessSwipeInput) => {
    const program = processSwipe(input);

    const layer = Layer.succeed(
      SwipeRepository,
      SwipeRepository.of({
        recordSwipe: (userId, productId, action: SwipeAction) =>
          Effect.tryPromise({
            try: () => swipeMutation({ productId: productId as any, action }),
            catch: (e) => new RepositoryError(e instanceof Error ? e.message : String(e), e),
          }),
        getSwipesByUser: () => Effect.succeed([]),
      }),
    );

    return Effect.runPromise(program.pipe(Effect.provide(layer)));
  };
}
