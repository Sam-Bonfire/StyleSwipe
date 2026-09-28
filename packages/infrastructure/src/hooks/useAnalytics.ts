import type { Id } from '@app/convex';

import { api } from '@app/convex';
import { EventRepository, RepositoryError } from '@app/core';
import { useMutation, useQuery } from 'convex/react';
import { Effect, Layer } from 'effect';
import React from 'react';

export function useAnalytics() {
  const trackEventMutation = useMutation(api.events.track);

  // Stable across renders: screens hold this in effect/callback deps,
  // and a fresh closure every render retriggers debounced searches.
  const trackEvent = React.useCallback(
    async (
      type: string,
      metadata?: Record<string, unknown>,
      options?: { variant?: string; productId?: string }
    ) => {
    const layer = Layer.succeed(
      EventRepository,
      EventRepository.of({
        create: (event) =>
          Effect.tryPromise({
            try: async () => {
              const id = await trackEventMutation({
                type: event.type,
                userId: event.userId,
                productId: event.productId as Id<'products'> | undefined,
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

    const program = Effect.gen(function* (_) {
      const repo = yield* _(EventRepository);
      return yield* _(repo.create({
        type,
        isSampled: true,
        metadata,
        variant: options?.variant,
        productId: options?.productId,
        timestamp: Date.now(),
      }));
    });

    try {
      await Effect.runPromise(program.pipe(Effect.provide(layer)));
      console.log(`[Analytics] Tracked ${type}`);
    } catch (e) {
      console.warn(`[Analytics] Failed to track ${type}`, e);
    }
  },
  [trackEventMutation]);

  return { trackEvent };
}

export function useAvailableVariants() {
  return useQuery(api.events.getAvailableVariants);
}

export function useFunnelMetrics(timeRange: '7_days' | '30_days' | 'all_time', variant: string) {
  return useQuery(api.events.getFunnelMetrics, { timeRange, variant });
}

export function useMacroFunnelMetrics(timeRange: '7_days' | '30_days' | 'all_time', variant: string) {
  return useQuery(api.events.getMacroFunnelMetrics, { timeRange, variant });
}
