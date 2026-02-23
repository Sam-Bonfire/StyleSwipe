import type { Session } from '@app/core';

import { SessionRepository, RepositoryError } from '@app/core';
import { Layer, Effect } from 'effect';
// import type { Id } from '@convex-dataModel';

import { api } from '@app/convex';
import { ConvexClient } from 'convex/browser';

/**
 * Convex implementation of SessionRepository port
 */


const mapToEntity = (doc: Record<string, unknown>): Session => {
    return {
  id: (doc._id as string) || '',
  userId: (doc.userId as string) || '',
  token: (doc.token as string) || '',
  expiresAt: (doc.expiresAt as number) || 0,
  userAgent: doc.userAgent as string | undefined,
  ipAddress: doc.ipAddress as string | undefined,
  createdAt: (doc.createdAt as number) || 0,
};
};


export const createSessionRepositoryLayer = (client: ConvexClient) => Layer.succeed(
    SessionRepository,
    SessionRepository.of({

    findById: (id: string) => Effect.tryPromise({
      try: async () => {
          const doc = await client.query(api.sessions.getById, {
  id,
});
return doc ? mapToEntity(doc) : null;
      },
      catch: (e) => new RepositoryError(e instanceof Error ? e.message : String(e), e)
    }),

    findByToken: (token: string) => Effect.tryPromise({
      try: async () => {
          const doc = await client.query(api.sessions.getByToken, { token });
return doc ? mapToEntity(doc) : null;
      },
      catch: (e) => new RepositoryError(e instanceof Error ? e.message : String(e), e)
    }),

    findByUserId: (userId: string) => Effect.tryPromise({
      try: async () => {
          const docs = await client.query(api.sessions.getByUserId, {
  userId,
});
return docs.map((doc: any) => mapToEntity(doc));
      },
      catch: (e) => new RepositoryError(e instanceof Error ? e.message : String(e), e)
    }),

    create: (session: Omit<Session, 'id'>) => Effect.tryPromise({
      try: async () => {
          const id = await client.mutation(api.sessions.create, {
  userId: session.userId,
  token: session.token,
  expiresAt: session.expiresAt,
  userAgent: session.userAgent,
  ipAddress: session.ipAddress,
  createdAt: session.createdAt,
});
return { ...session, id: id as string };
      },
      catch: (e) => new RepositoryError(e instanceof Error ? e.message : String(e), e)
    }),

    delete: (id: string) => Effect.tryPromise({
      try: async () => {
          await client.mutation(api.sessions.remove, {
  id,
});
      },
      catch: (e) => new RepositoryError(e instanceof Error ? e.message : String(e), e)
    }),

    deleteByUserId: (userId: string) => Effect.tryPromise({
      try: async () => {
          await client.mutation(api.sessions.removeByUserId, {
  userId,
});
      },
      catch: (e) => new RepositoryError(e instanceof Error ? e.message : String(e), e)
    }),

    deleteExpired: () => Effect.tryPromise({
      try: async () => {
          return await client.mutation(api.sessions.deleteExpired, {
  now: Date.now(),
});
      },
      catch: (e) => new RepositoryError(e instanceof Error ? e.message : String(e), e)
    }),

    })
);

