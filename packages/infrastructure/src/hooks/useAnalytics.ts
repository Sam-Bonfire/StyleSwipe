import { api } from '@app/convex';
import { EventRepository, RepositoryError } from '@app/core';
import { useMutation } from 'convex/react';
import { Effect, Layer } from 'effect';

export function useAnalytics() {
  const trackEventMutation = useMutation(api.events.track);

  const trackEvent = async (type: string, metadata?: any) => {
    // 1. Create the repository layer connecting the port to Convex
    const layer = Layer.succeed(
      EventRepository,
      EventRepository.of({
        create: (event) =>
          Effect.tryPromise({
            try: async () => {
              const id = await trackEventMutation({
                type: event.type,
                userId: event.userId,
                productId: event.productId as any,
                variant: event.variant,
                isSampled: event.isSampled,
                metadata: event.metadata,
                timestamp: event.timestamp,
              });
              return { ...event, id };
            },
            catch: (e) => new RepositoryError(e instanceof Error ? e.message : String(e), e),
          }),
        findByUserAndType: () => Effect.succeed([]),
        findByType: () => Effect.succeed([]),
        findSampledByType: () => Effect.succeed([]),
      }),
    );

    // 2. Simple program to execute the creation
    const program = Effect.gen(function* (_) {
      const repo = yield* _(EventRepository);
      return yield* _(repo.create({
        type,
        isSampled: true,
        metadata,
        timestamp: Date.now(),
      }));
    });

    try {
      await Effect.runPromise(program.pipe(Effect.provide(layer)));
      console.log(`[Analytics] Tracked ${type}`);
    } catch (e) {
      console.warn(`[Analytics] Failed to track ${type}`, e);
    }
  };

  return { trackEvent };
}
