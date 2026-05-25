import type { Id } from '@app/convex';
import type { FeatureFlag, Environment, FeatureFlagRule } from '@app/core';

import { api } from '@app/convex';
import { FeatureFlagRepository, RepositoryError } from '@app/core';
import { ConvexClient } from 'convex/browser';
import { Layer, Effect } from 'effect';

/**
 * Convex implementation of FeatureFlagRepository port
 */


const mapToEntity = (doc: Record<string, unknown>): FeatureFlag => {
    return {
  id: (doc._id as string) || '',
  name: (doc.name as string) || '',
  description: doc.description as string | undefined,
  isEnabled: (doc.isEnabled as boolean) || false,
  environment: (doc.environment as Environment) || 'dev',
  rules: doc.rules as FeatureFlagRule[] | undefined,
  updatedAt: (doc.updatedAt as number) || 0,
};
};


export const createFeatureFlagRepositoryLayer = (client: ConvexClient) => Layer.succeed(
    FeatureFlagRepository,
    FeatureFlagRepository.of({

    findById: (id: string) => Effect.tryPromise({
      try: async () => {
          const doc = await client.query(api.featureFlags.getById, { id: id as Id<'feature_flags'> });
          return doc ? mapToEntity(doc) : null;
      },
      catch: (e) => new RepositoryError(e instanceof Error ? e.message : String(e), e)
    }),

    findByName: (environment: Environment, name: string) => Effect.tryPromise({
      try: async () => {
          const doc = await client.query(api.featureFlags.getByEnvName, {
  environment,
  name,
});
return doc ? mapToEntity(doc) : null;
      },
      catch: (e) => new RepositoryError(e instanceof Error ? e.message : String(e), e)
    }),

    findByEnvironment: (environment: Environment) => Effect.tryPromise({
      try: async () => {
          const docs = await client.query(api.featureFlags.getByEnvironment, {
  environment,
});
return docs.map((doc) => mapToEntity(doc));
      },
      catch: (e) => new RepositoryError(e instanceof Error ? e.message : String(e), e)
    }),

    create: (flag: Omit<FeatureFlag, 'id'>) => Effect.tryPromise({
      try: async () => {
          const id = await client.mutation(api.featureFlags.create, {
  name: flag.name,
  description: flag.description,
  isEnabled: flag.isEnabled,
  environment: flag.environment,
  rules: flag.rules,
  updatedAt: flag.updatedAt,
});
return { ...flag, id: id as string };
      },
      catch: (e) => new RepositoryError(e instanceof Error ? e.message : String(e), e)
    }),

    update: (id: string, data: Partial<Omit<FeatureFlag, 'id'>>) => Effect.tryPromise({
      try: async () => {
          await client.mutation(api.featureFlags.update, {
              id: id as Id<'feature_flags'>,
              ...data,
              updatedAt: Date.now(),
          });
          const doc = await client.query(api.featureFlags.getById, { id: id as Id<'feature_flags'> });
          if (!doc) throw new Error(`FeatureFlag ${id} not found after update`);
          return mapToEntity(doc);
      },
      catch: (e) => new RepositoryError(e instanceof Error ? e.message : String(e), e)
    }),

    delete: (id: string) => Effect.tryPromise({
      try: async () => {
          await client.mutation(api.featureFlags.remove, {
  id: id as Id<'feature_flags'>,
});
      },
      catch: (e) => new RepositoryError(e instanceof Error ? e.message : String(e), e)
    }),

    })
);

