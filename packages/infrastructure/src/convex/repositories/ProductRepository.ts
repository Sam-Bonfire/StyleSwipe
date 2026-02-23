import type { Id } from '@app/convex';
import type { Product, ProductAttributes } from '@app/core';

import { api } from '@app/convex';
import { ProductRepository, RepositoryError } from '@app/core';
import { ConvexClient } from 'convex/browser';
import { Layer, Effect } from 'effect';

/**
 * Convex implementation of ProductRepository port
 * Includes vector similarity search for Discovery Mode
 */


const mapToEntity = (doc: Record<string, unknown>): Product => {
    return {
  id: (doc._id as string) || '',
  brand: (doc.brand as string) || '',
  title: (doc.title as string) || '',
  price: (doc.price as number) || 0,
  mrp: (doc.mrp as number) || 0,
  category: (doc.category as string) || '',
  images: (doc.images as string[]) || [],
  attributes: doc.attributes as ProductAttributes | undefined,
  embedding: doc.embedding as number[] | undefined,
  meta: doc.meta as Record<string, unknown> | undefined,
  createdAt: (doc.createdAt as number) || (doc._creationTime as number),
  updatedAt: (doc.updatedAt as number) || (doc._creationTime as number),
};
};


export const createProductRepositoryLayer = (client: ConvexClient) => Layer.succeed(
    ProductRepository,
    ProductRepository.of({

    findById: (id: string) => Effect.tryPromise({
      try: async () => {
          const doc = await client.query(api.products.getById, { id: id as Id<'products'> });
          return doc ? mapToEntity(doc) : null;
      },
      catch: (e) => new RepositoryError(e instanceof Error ? e.message : String(e), e)
    }),

    findByCategory: (category: string, limit = 50) => Effect.tryPromise({
      try: async () => {
          const docs = await client.query(api.products.getByCategory, {
  category,
  limit,
});
return docs.map((doc) => mapToEntity(doc));
      },
      catch: (e) => new RepositoryError(e instanceof Error ? e.message : String(e), e)
    }),

    findByCategoryAndPrice: (category: string, minPrice: number, maxPrice: number, limit = 50) => Effect.tryPromise({
      try: async () => {
          const docs = await client.query(api.products.getByCategoryAndPrice, {
  category,
  minPrice,
  maxPrice,
  limit,
});
return docs.map((doc) => mapToEntity(doc));
      },
      catch: (e) => new RepositoryError(e instanceof Error ? e.message : String(e), e)
    }),

    findByBrand: (brand: string, limit = 50) => Effect.tryPromise({
      try: async () => {
          const docs = await client.query(api.products.getByBrand, {
  brand,
  limit,
});
return docs.map((doc) => mapToEntity(doc));
      },
      catch: (e) => new RepositoryError(e instanceof Error ? e.message : String(e), e)
    }),

    searchByTitle: (query: string, filters?: { brand?: string; category?: string }) => Effect.tryPromise({
      try: async () => {
          const docs = await client.query(api.products.searchByTitle, {
  query,
  brand: filters?.brand,
  category: filters?.category,
});
return docs.map((doc) => mapToEntity(doc));
      },
      catch: (e) => new RepositoryError(e instanceof Error ? e.message : String(e), e)
    }),

    findSimilar: (embedding: number[], limit = 10, filters?: { category?: string; brand?: string }) => Effect.tryPromise({
      try: async () => {
          const docs = await client.action(api.products.findSimilar, {
  embedding,
  limit,
  category: filters?.category,
  brand: filters?.brand,
});
return docs.map((doc) => mapToEntity(doc));
      },
      catch: (e) => new RepositoryError(e instanceof Error ? e.message : String(e), e)
    }),

    create: (product: Omit<Product, 'id'>) => Effect.tryPromise({
      try: async () => {
          const id = await client.mutation(api.products.create, {
  brand: product.brand,
  title: product.title,
  price: product.price,
  mrp: product.mrp,
  category: product.category,
  images: product.images,
  attributes: product.attributes,
  embedding: product.embedding,
  meta: product.meta,
  updatedAt: product.updatedAt ?? Date.now(),
});
return { ...product, id: id as string };
      },
      catch: (e) => new RepositoryError(e instanceof Error ? e.message : String(e), e)
    }),

    update: (id: string, data: Partial<Omit<Product, 'id'>>) => Effect.tryPromise({
      try: async () => {
          await client.mutation(api.products.update, {
              id: id as Id<'products'>,
              ...data,
              updatedAt: Date.now(),
          });
          const doc = await client.query(api.products.getById, { id: id as Id<'products'> });
          if (!doc) throw new Error(`Product ${id} not found after update`);
          return mapToEntity(doc);
      },
      catch: (e) => new RepositoryError(e instanceof Error ? e.message : String(e), e)
    }),

    updateEmbedding: (id: string, embedding: number[]) => Effect.tryPromise({
      try: async () => {
          await client.mutation(api.products.updateEmbedding, {
              id: id as Id<'products'>,
              embedding,
          });
          const doc = await client.query(api.products.getById, { id: id as Id<'products'> });
          if (!doc) throw new Error(`Product ${id} not found after update`);
          return mapToEntity(doc);
      },
      catch: (e) => new RepositoryError(e instanceof Error ? e.message : String(e), e)
    }),

    delete: (id: string) => Effect.tryPromise({
      try: async () => {
          await client.mutation(api.products.remove, {
  id: id as Id<'products'>,
});
      },
      catch: (e) => new RepositoryError(e instanceof Error ? e.message : String(e), e)
    }),

    getLatest: (limit: number) => Effect.tryPromise({
      try: async () => {
          const docs = await client.query(api.products.getLatest, { limit });
return docs.map((doc) => mapToEntity(doc));
      },
      catch: (e) => new RepositoryError(e instanceof Error ? e.message : String(e), e)
    }),

    })
);

