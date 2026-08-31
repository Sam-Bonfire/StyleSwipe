import type { Id } from '@app/convex';
import type { Category } from '@app/core';

import { api } from '@app/convex';
import { CategoryRepository, RepositoryError } from '@app/core';
import { ConvexClient } from 'convex/browser';
import { Effect, Layer } from 'effect';

const mapToEntity = (doc: Record<string, unknown>): Category => {
  return {
    id: (doc._id as string) || (doc.id as string) || '',
    name: (doc.name as string) || '',
    slug: (doc.slug as string) || '',
    parentId: doc.parentId as string | undefined,
    level: doc.level as number | undefined,
    image: doc.image as string | undefined,
    attributes: doc.attributes as Record<string, unknown> | undefined,
    displayOrder: doc.displayOrder as number | undefined,
  };
};

export const createCategoryRepositoryLayer = (client: ConvexClient) =>
  Layer.succeed(
    CategoryRepository,
    CategoryRepository.of({
      findById: (id: string) =>
        Effect.tryPromise({
          try: async () => {
            const doc = await client.query(api.categories.getById, { id: id as Id<'categories'> });
            return doc ? mapToEntity(doc) : null;
          },
          catch: (e) => new RepositoryError(e instanceof Error ? e.message : String(e), e),
        }),

      findBySlug: (slug: string) =>
        Effect.tryPromise({
          try: async () => {
            const doc = await client.query(api.categories.getBySlug, { slug });
            return doc ? mapToEntity(doc) : null;
          },
          catch: (e) => new RepositoryError(e instanceof Error ? e.message : String(e), e),
        }),

      listTree: () =>
        Effect.tryPromise({
          try: async () => {
            const docs = await client.query(api.categories.listTree, {});
            return docs.map((doc) => mapToEntity(doc));
          },
          catch: (e) => new RepositoryError(e instanceof Error ? e.message : String(e), e),
        }),

      listRootCategories: () =>
        Effect.tryPromise({
          try: async () => {
            const docs = await client.query(api.categories.listRootCategories, {});
            return docs.map((doc) => mapToEntity(doc));
          },
          catch: (e) => new RepositoryError(e instanceof Error ? e.message : String(e), e),
        }),

      save: (category: Category) =>
        Effect.tryPromise({
          try: async () => {
            const id = await client.mutation(api.categories.save, {
              id: category.id && category.id !== '' ? (category.id as Id<'categories'>) : undefined,
              name: category.name,
              slug: category.slug,
              description: undefined,
              parentId: category.parentId ? (category.parentId as Id<'categories'>) : undefined,
              level: category.level ?? 0,
              image: category.image,
            });

            return { ...category, id: id as string };
          },
          catch: (e) => new RepositoryError(e instanceof Error ? e.message : String(e), e),
        }),

      delete: (id: string) =>
        Effect.tryPromise({
          try: async () => {
            await client.mutation(api.categories.remove, { id: id as Id<'categories'> });
          },
          catch: (e) => new RepositoryError(e instanceof Error ? e.message : String(e), e),
        }),
    }),
  );
