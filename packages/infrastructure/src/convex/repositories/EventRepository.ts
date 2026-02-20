import type { SampledEvent } from '@app/core';

import { EventRepository, RepositoryError } from '@app/core';
import { Layer, Effect } from 'effect';
// import type { Id } from '@convex-dataModel';

import { api } from '@app/convex';
import { ConvexClient } from 'convex/browser';

/**
 * Convex implementation of EventRepository port
 * Supports strategic sampling for analytics
 */


const mapToEntity = (doc: Record<string, unknown>): SampledEvent => {
    return {
  id: (doc._id as string) || '',
  type: (doc.type as string) || '',
  userId: doc.userId as string | undefined,
  productId: doc.productId as string | undefined,
  variant: doc.variant as string | undefined,
  isSampled: (doc.isSampled as boolean) || false,
  metadata: doc.metadata as Record<string, unknown> | undefined,
  timestamp: (doc.timestamp as number) || 0,
};
};


export const createEventRepositoryLayer = (client: ConvexClient) => Layer.succeed(
    EventRepository,
    EventRepository.of({

    create: (event: Omit<SampledEvent, 'id'>) => Effect.tryPromise({
      try: async () => {
          const id = await client.mutation(api.events.create, {
  type: event.type,
  userId: event.userId,
  productId: event.productId,
  variant: event.variant,
  isSampled: event.isSampled,
  metadata: event.metadata,
  timestamp: event.timestamp,
});
return { ...event, id: id as string };
      },
      catch: (e) => new RepositoryError(e instanceof Error ? e.message : String(e), e)
    }),

    findByUserAndType: (userId: string, type: string, limit = 100) => Effect.tryPromise({
      try: async () => {
          const docs = await client.query(api.events.getByUserAndType, {
  userId,
  type,
  limit,
});
return docs.map((doc: any) => mapToEntity(doc));
      },
      catch: (e) => new RepositoryError(e instanceof Error ? e.message : String(e), e)
    }),

    findByType: (type: string, limit = 100) => Effect.tryPromise({
      try: async () => {
          const docs = await client.query(api.events.getByType, {
  type,
  limit,
});
return docs.map((doc: any) => mapToEntity(doc));
      },
      catch: (e) => new RepositoryError(e instanceof Error ? e.message : String(e), e)
    }),

    findSampledByType: (type: string, limit = 100) => Effect.tryPromise({
      try: async () => {
          const docs = await client.query(api.events.getSampledByType, {
  type,
  limit,
});
return docs.map((doc: any) => mapToEntity(doc));
      },
      catch: (e) => new RepositoryError(e instanceof Error ? e.message : String(e), e)
    }),

    })
);

