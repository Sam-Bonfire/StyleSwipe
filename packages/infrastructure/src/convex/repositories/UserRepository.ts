import type { User, StyleProfile } from '@app/core';

import { UserRepository, RepositoryError } from '@app/core';
import { Layer, Effect } from 'effect';
// import type { Id } from '@convex-dataModel';

import { api } from '@app/convex';
import { ConvexClient } from 'convex/browser';

/**
 * Convex implementation of UserRepository port
 */


const mapToEntity = (doc: Record<string, unknown>): User => {
    return {
  id: (doc._id as string) || '',
  name: (doc.name as string) || '',
  email: (doc.email as string) || '',
  emailVerified: (doc.emailVerified as boolean) || false,
  image: doc.image as string | undefined,
  phone: (doc.phoneNumber as string) || '',
  activeOrgId: doc.activeOrgId as string | undefined,
  styleProfile: doc.styleProfile as StyleProfile | undefined,
};
};


export const createUserRepositoryLayer = (client: ConvexClient) => Layer.succeed(
    UserRepository,
    UserRepository.of({

    findById: (id: string) => Effect.tryPromise({
      try: async () => {
          const doc = await client.query(api.users.getById, { id });
          return doc ? mapToEntity(doc) : null;
      },
      catch: (e) => new RepositoryError(e instanceof Error ? e.message : String(e), e)
    }),

    findByEmail: (email: string) => Effect.tryPromise({
      try: async () => {
          const doc = await client.query(api.users.getByEmail, { email });
return doc ? mapToEntity(doc) : null;
      },
      catch: (e) => new RepositoryError(e instanceof Error ? e.message : String(e), e)
    }),

    findByPhone: (phone: string) => Effect.tryPromise({
      try: async () => {
          const doc = await client.query(api.users.getByPhone, { phone });
return doc ? mapToEntity(doc) : null;
      },
      catch: (e) => new RepositoryError(e instanceof Error ? e.message : String(e), e)
    }),

    create: (user: Omit<User, 'id'>) => Effect.tryPromise({
      try: async () => {
          const id = await client.mutation(api.users.create, {
  name: user.name,
  email: user.email,
  emailVerified: user.emailVerified,
  image: user.image,
  phoneNumber: user.phone,
  activeOrgId: user.activeOrgId,
  styleProfile: user.styleProfile,
});
return { ...user, id: id as string };
      },
      catch: (e) => new RepositoryError(e instanceof Error ? e.message : String(e), e)
    }),

    update: (id: string, data: Partial<Omit<User, 'id'>>) => Effect.tryPromise({
      try: async () => {
          await client.mutation(api.users.update, {
              id,
              ...data,
              phoneNumber: data.phone,
              activeOrgId: data.activeOrgId,
          });
          const doc = await client.query(api.users.getById, { id });
          if (!doc) throw new Error(`User ${id} not found after update`);
          return mapToEntity(doc);
      },
      catch: (e) => new RepositoryError(e instanceof Error ? e.message : String(e), e)
    }),

    updateStyleProfile: (id: string, profile: StyleProfile) => Effect.tryPromise({
      try: async () => {
          await client.mutation(api.users.update, {
              id,
              styleProfile: profile,
          });
          const doc = await client.query(api.users.getById, { id });
          if (!doc) throw new Error(`User ${id} not found after update`);
          return mapToEntity(doc);
      },
      catch: (e) => new RepositoryError(e instanceof Error ? e.message : String(e), e)
    }),

    delete: (id: string) => Effect.tryPromise({
      try: async () => {
          await client.mutation(api.users.remove, {
  id,
});
      },
      catch: (e) => new RepositoryError(e instanceof Error ? e.message : String(e), e)
    }),

    })
);

