import type { Id } from '@app/convex';
import type { PartnerSync, PartnerSyncStatus } from '@app/core';

import { api } from '@app/convex';
import { PartnerSyncRepository, RepositoryError } from '@app/core';
import { ConvexClient } from 'convex/browser';
import { Layer, Effect } from 'effect';

/**
 * Convex implementation of PartnerSyncRepository port
 */


const mapToEntity = (doc: Record<string, unknown>): PartnerSync => {
    return {
  id: (doc._id as string) || '',
  initiatorId: (doc.initiatorId as string) || '',
  partnerId: doc.partnerId as string | undefined,
  inviteCode: (doc.inviteCode as string) || '',
  status: (doc.status as PartnerSyncStatus) || 'pending',
  expiresAt: (doc.expiresAt as number) || 0,
  influenceRatio: (doc.influenceRatio as number) || 0.5,
  createdAt: (doc.createdAt as number) || 0,
};
};


export const createPartnerSyncRepositoryLayer = (client: ConvexClient) => Layer.succeed(
    PartnerSyncRepository,
    PartnerSyncRepository.of({

    findById: (id: string) => Effect.tryPromise({
      try: async () => {
          const doc = await client.query(api.partnerSync.getById, { id: id as Id<'partner_sync'> });
          return doc ? mapToEntity(doc) : null;
      },
      catch: (e) => new RepositoryError(e instanceof Error ? e.message : String(e), e)
    }),

    findByInviteCode: (inviteCode: string) => Effect.tryPromise({
      try: async () => {
          const doc = await client.query(api.partnerSync.getByInviteCode, {
  inviteCode,
});
return doc ? mapToEntity(doc) : null;
      },
      catch: (e) => new RepositoryError(e instanceof Error ? e.message : String(e), e)
    }),

    findByInitiator: (initiatorId: string) => Effect.tryPromise({
      try: async () => {
          const docs = await client.query(api.partnerSync.getByInitiator, {
  initiatorId,
});
return (docs as any[]).map((doc: any) => mapToEntity(doc));
      },
      catch: (e) => new RepositoryError(e instanceof Error ? e.message : String(e), e)
    }),

    findByPartner: (partnerId: string) => Effect.tryPromise({
      try: async () => {
          const docs = await client.query(api.partnerSync.getByPartner, {
  partnerId,
});
return (docs as any[]).map((doc: any) => mapToEntity(doc));
      },
      catch: (e) => new RepositoryError(e instanceof Error ? e.message : String(e), e)
    }),

    findActiveByUser: (userId: string) => Effect.tryPromise({
      try: async () => {
          const docs = await client.query(api.partnerSync.getActiveByUser, {
  userId,
});
return (docs as any[]).map((doc: any) => mapToEntity(doc));
      },
      catch: (e) => new RepositoryError(e instanceof Error ? e.message : String(e), e)
    }),

    create: (sync: Omit<PartnerSync, 'id'>) => Effect.tryPromise({
      try: async () => {
          const id = await client.mutation(api.partnerSync.create, {
  initiatorId: sync.initiatorId,
  partnerId: sync.partnerId,
  inviteCode: sync.inviteCode,
  status: sync.status,
  expiresAt: sync.expiresAt,
  influenceRatio: sync.influenceRatio,
  createdAt: sync.createdAt,
} as any);
return { ...sync, id: id as string };
      },
      catch: (e) => new RepositoryError(e instanceof Error ? e.message : String(e), e)
    }),

    update: (id: string, data: Partial<Omit<PartnerSync, 'id'>>) => Effect.tryPromise({
      try: async () => {
          await client.mutation(api.partnerSync.update, {
              id: id as Id<'partner_sync'>,
              ...data,
              initiatorId: data.initiatorId,
              partnerId: data.partnerId,
          } as any);
          const doc = await client.query(api.partnerSync.getById, { id: id as Id<'partner_sync'> });
          if (!doc) throw new Error(`PartnerSync ${id} not found after update`);
          return mapToEntity(doc);
      },
      catch: (e) => new RepositoryError(e instanceof Error ? e.message : String(e), e)
    }),

    updateStatus: (id: string, status: PartnerSyncStatus) => Effect.tryPromise({
      try: async () => {
          await client.mutation(api.partnerSync.updateStatus, {
              id: id as Id<'partner_sync'>,
              status,
          } as any);
          const doc = await client.query(api.partnerSync.getById, { id: id as Id<'partner_sync'> });
          if (!doc) throw new Error(`PartnerSync ${id} not found after update`);
          return mapToEntity(doc);
      },
      catch: (e) => new RepositoryError(e instanceof Error ? e.message : String(e), e)
    }),

    delete: (id: string) => Effect.tryPromise({
      try: async () => {
          await client.mutation(api.partnerSync.remove, {
  id: id as Id<'partner_sync'>,
} as any);
      },
      catch: (e) => new RepositoryError(e instanceof Error ? e.message : String(e), e)
    }),

    deleteExpired: () => Effect.tryPromise({
      try: async () => {
          return await client.mutation(api.partnerSync.deleteExpired, {
  now: Date.now(),
} as any);
      },
      catch: (e) => new RepositoryError(e instanceof Error ? e.message : String(e), e)
    }),

    })
);

