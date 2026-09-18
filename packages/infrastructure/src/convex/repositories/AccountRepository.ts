import type { Account } from '@app/core';

import { AccountRepository, RepositoryError } from '@app/core';
import { Layer, Effect } from 'effect';
// import type { Id } from '@convex-dataModel';

import { api } from '@app/convex';
import { ConvexClient } from 'convex/browser';

/**
 * Convex implementation of AccountRepository port
 */


const mapToEntity = (doc: Record<string, unknown>): Account => {
    return {
  id: (doc._id as string) || '',
  userId: (doc.userId as string) || '',
  providerId: (doc.providerId as string) || '',
  providerAccountId: (doc.accountId as string) || '',
  accessToken: doc.accessToken as string | undefined,
  refreshToken: doc.refreshToken as string | undefined,
  accessTokenExpiresAt: doc.accessTokenExpiresAt as number | undefined,
  scope: doc.scope as string | undefined,
};
};


export const createAccountRepositoryLayer = (client: ConvexClient) => Layer.succeed(
    AccountRepository,
    AccountRepository.of({

    findById: (id: string) => Effect.tryPromise({
      try: async () => {
          const doc = await client.query(api.accounts.getById, { id });
          return doc ? mapToEntity(doc) : null;
      },
      catch: (e) => new RepositoryError(e instanceof Error ? e.message : String(e), e)
    }),

    findByProvider: (providerId: string, providerAccountId: string) => Effect.tryPromise({
      try: async () => {
          const doc = await client.query(api.accounts.getByProvider, {
  providerId,
  accountId: providerAccountId,
});
return doc ? mapToEntity(doc) : null;
      },
      catch: (e) => new RepositoryError(e instanceof Error ? e.message : String(e), e)
    }),

    findByUserId: (userId: string) => Effect.tryPromise({
      try: async () => {
          const docs = await client.query(api.accounts.getByUserId, {
  userId,
});
return docs.map((doc: Record<string, unknown>) => mapToEntity(doc));
      },
      catch: (e) => new RepositoryError(e instanceof Error ? e.message : String(e), e)
    }),

    create: (account: Omit<Account, 'id'>) => Effect.tryPromise({
      try: async () => {
          const id = await client.mutation(api.accounts.create, {
  userId: account.userId,
  providerId: account.providerId,
  accountId: account.providerAccountId,
  accessToken: account.accessToken,
  refreshToken: account.refreshToken,
  accessTokenExpiresAt: account.accessTokenExpiresAt,
  scope: account.scope,
});
return { ...account, id: id as string };
      },
      catch: (e) => new RepositoryError(e instanceof Error ? e.message : String(e), e)
    }),

    update: (id: string, data: Partial<Omit<Account, 'id'>>) => Effect.tryPromise({
      try: async () => {
          await client.mutation(api.accounts.update, {
              id,
              ...data,
              accountId: data.providerAccountId,
          });
          const doc = await client.query(api.accounts.getById, { id });
          if (!doc) throw new Error(`Account ${id} not found after update`);
          return mapToEntity(doc);
      },
      catch: (e) => new RepositoryError(e instanceof Error ? e.message : String(e), e)
    }),

    delete: (id: string) => Effect.tryPromise({
      try: async () => {
          await client.mutation(api.accounts.remove, {
  id,
});
      },
      catch: (e) => new RepositoryError(e instanceof Error ? e.message : String(e), e)
    }),

    deleteByUserId: (userId: string) => Effect.tryPromise({
      try: async () => {
          await client.mutation(api.accounts.removeByUserId, {
  userId,
});
      },
      catch: (e) => new RepositoryError(e instanceof Error ? e.message : String(e), e)
    }),

    })
);

