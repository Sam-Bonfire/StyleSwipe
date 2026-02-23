import type { Organization } from '@app/core';

import { OrganizationRepository, RepositoryError } from '@app/core';
import { Layer, Effect } from 'effect';
// import type { Id } from '@convex-dataModel';

import { api } from '@app/convex';
import { ConvexClient } from 'convex/browser';

/**
 * Convex implementation of OrganizationRepository port
 */


const mapToEntity = (doc: Record<string, unknown>): Organization => {
    return {
  id: (doc._id as string) || '',
  name: (doc.name as string) || '',
  slug: (doc.slug as string) || '',
  logo: doc.logo as string | undefined,
  metadata: typeof doc.metadata === 'string' ? JSON.parse(doc.metadata) : (doc.metadata as any),
  createdAt: (doc.createdAt as number) || 0,
};
};


export const createOrganizationRepositoryLayer = (client: ConvexClient) => Layer.succeed(
    OrganizationRepository,
    OrganizationRepository.of({

    findById: (id: string) => Effect.tryPromise({
      try: async () => {
          const doc = await client.query(api.organizations.getById, { id } as any);
          return doc ? mapToEntity(doc) : null;
      },
      catch: (e) => new RepositoryError(e instanceof Error ? e.message : String(e), e)
    }),

    findBySlug: (slug: string) => Effect.tryPromise({
      try: async () => {
          const doc = await client.query(api.organizations.getBySlug, { slug });
return doc ? mapToEntity(doc) : null;
      },
      catch: (e) => new RepositoryError(e instanceof Error ? e.message : String(e), e)
    }),

    create: (org: Omit<Organization, 'id'>) => Effect.tryPromise({
      try: async () => {
          const id = await client.mutation(api.organizations.create, {
  name: org.name,
  slug: org.slug,
  logo: org.logo,
  metadata: org.metadata,
  createdAt: org.createdAt,
} as any);
return { ...org, id: id as string };
      },
      catch: (e) => new RepositoryError(e instanceof Error ? e.message : String(e), e)
    }),

    update: (id: string, data: Partial<Omit<Organization, 'id'>>) => Effect.tryPromise({
      try: async () => {
          await client.mutation(api.organizations.update, {
              id,
              ...data,
          } as any);
          const doc = await client.query(api.organizations.getById, { id } as any);
          if (!doc) throw new Error(`Organization ${id} not found after update`);
          return mapToEntity(doc);
      },
      catch: (e) => new RepositoryError(e instanceof Error ? e.message : String(e), e)
    }),

    delete: (id: string) => Effect.tryPromise({
      try: async () => {
          await client.mutation(api.organizations.remove, {
  id,
} as any);
      },
      catch: (e) => new RepositoryError(e instanceof Error ? e.message : String(e), e)
    }),

    })
);

