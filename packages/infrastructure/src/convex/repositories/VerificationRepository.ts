import type { Verification, VerificationType } from '@app/core';

import { VerificationRepository, RepositoryError } from '@app/core';
import { Layer, Effect } from 'effect';
// import type { Id } from '@convex-dataModel';

import { api } from '@app/convex';
import { ConvexClient } from 'convex/browser';

/**
 * Convex implementation of VerificationRepository port
 */


const mapToEntity = (doc: Record<string, unknown>): Verification => {
    return {
  id: (doc._id as string) || '',
  identifier: (doc.identifier as string) || '',
  token: (doc.token as string) || (doc.value as string) || '',
  type: (doc.type as VerificationType) || 'phone_otp',
  expiresAt: (doc.expiresAt as number) || 0,
  createdAt: (doc.createdAt as number) || 0,
};
};


export const createVerificationRepositoryLayer = (client: ConvexClient) => Layer.succeed(
    VerificationRepository,
    VerificationRepository.of({

    findByIdentifier: (identifier: string) => Effect.tryPromise({
      try: async () => {
          const doc = await client.query(api.verifications.getByIdentifier, {
  identifier,
});
return doc ? mapToEntity(doc) : null;
      },
      catch: (e) => new RepositoryError(e instanceof Error ? e.message : String(e), e)
    }),

    findByToken: (token: string) => Effect.tryPromise({
      try: async () => {
          const doc = await client.query(api.verifications.getByToken, {
  value: token,
});
return doc ? mapToEntity(doc) : null;
      },
      catch: (e) => new RepositoryError(e instanceof Error ? e.message : String(e), e)
    }),

    create: (verification: Omit<Verification, 'id'>) => Effect.tryPromise({
      try: async () => {
          const id = await client.mutation(api.verifications.create, {
  identifier: verification.identifier,
  value: verification.token,
  expiresAt: verification.expiresAt,
  createdAt: verification.createdAt,
});
return { ...verification, id: id as string };
      },
      catch: (e) => new RepositoryError(e instanceof Error ? e.message : String(e), e)
    }),

    delete: (id: string) => Effect.tryPromise({
      try: async () => {
          await client.mutation(api.verifications.remove, {
  id,
});
      },
      catch: (e) => new RepositoryError(e instanceof Error ? e.message : String(e), e)
    }),

    deleteByIdentifier: (identifier: string) => Effect.tryPromise({
      try: async () => {
          await client.mutation(api.verifications.removeByIdentifier, {
  identifier,
});
      },
      catch: (e) => new RepositoryError(e instanceof Error ? e.message : String(e), e)
    }),

    deleteExpired: () => Effect.tryPromise({
      try: async () => {
          return await client.mutation(api.verifications.deleteExpired, {
  now: Date.now(),
});
      },
      catch: (e) => new RepositoryError(e instanceof Error ? e.message : String(e), e)
    }),

    })
);

