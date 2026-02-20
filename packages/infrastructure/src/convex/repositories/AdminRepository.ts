import type { Id } from '@app/convex';
import type { Product, PaginationOpts, ProductAttributes } from '@app/core';

import { api } from '@app/convex';
import { AdminRepository, RepositoryError } from '@app/core';
import { ConvexClient } from 'convex/browser';
import { Layer, Effect } from 'effect';



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


export const createAdminRepositoryLayer = (client: ConvexClient) => Layer.succeed(
    AdminRepository,
    AdminRepository.of({

    getStats: () => Effect.tryPromise({
      try: async () => {
          return await client.query(api.admin.getStats, {});
      },
      catch: (e) => new RepositoryError(e instanceof Error ? e.message : String(e), e)
    }),

    getScrapedProducts: (paginationOpts: PaginationOpts) => Effect.tryPromise({
      try: async () => {
          const result = await client.query(api.admin.getScrapedProducts, { paginationOpts });
return {
    page: result.page.map((doc: Record<string, unknown>) => mapToEntity(doc)),
    isDone: result.isDone,
    continueCursor: result.continueCursor,
};
      },
      catch: (e) => new RepositoryError(e instanceof Error ? e.message : String(e), e)
    }),

    searchProducts: (query: string) => Effect.tryPromise({
      try: async () => {
          const result = await client.query(api.admin.searchProducts, { query });
// searchProducts returns a flat array, wrap in PaginatedResult
const products = (result as Record<string, unknown>[]).map((doc) => mapToEntity(doc));
return {
    page: products,
    isDone: true,
    continueCursor: '',
};
      },
      catch: (e) => new RepositoryError(e instanceof Error ? e.message : String(e), e)
    }),

    retriggerScrape: (productId: string) => Effect.tryPromise({
      try: async () => {
          await client.mutation(api.admin.retriggerScrape, {
    productId: productId as Id<'products'>,
});
      },
      catch: (e) => new RepositoryError(e instanceof Error ? e.message : String(e), e)
    }),

    })
);

