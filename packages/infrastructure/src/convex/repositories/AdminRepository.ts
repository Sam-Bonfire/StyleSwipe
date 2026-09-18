import type { Id } from '@app/convex';
import type { Product, PaginationOpts, ProductAttributes } from '@app/core';

import { api } from '@app/convex';
import { AdminRepository, RepositoryError } from '@app/core';
import { ConvexClient } from 'convex/browser';
import { Layer, Effect } from 'effect';



const mapToEntity = (doc: Record<string, unknown>): Product => {
    const price = (doc.price as number) || 0;
    const mrp = (doc.mrp as number) || price;
    const originalMrp = (doc.originalMrp as number) || mrp;
    const discountPercentage = typeof doc.discountPercentage === 'number'
        ? (doc.discountPercentage as number)
        : (originalMrp > 0 ? Math.max(0, Math.min(100, Math.round(((originalMrp - price) / originalMrp) * 100))) : 0);
    const images = (doc.images as string[]) || [];
    const rawEmbedding = doc.embedding as number[] | undefined;
    const embedding = Array.isArray(rawEmbedding) && rawEmbedding.length === 384 ? rawEmbedding : new Array(384).fill(0);

    return {
        id: (doc._id as string) || (doc.id as string) || '',
        brand: (doc.brand as string) || '',
        title: (doc.title as string) || '',
        description: doc.description as string | undefined,
        price,
        mrp,
        originalMrp,
        originalPrice: (doc.originalPrice as number) || price,
        discountPercentage,
        gender: (doc.gender as 'men' | 'women' | 'unisex') || 'unisex',
        sizes: (doc.sizes as string[]) || ['Free Size'],
        colors: (doc.colors as string[]) || ['Default'],
        category: (doc.category as string) || '',
        images: images.length > 0 ? images : ['https://placeholder.com/image.png'],
        attributes: doc.attributes as ProductAttributes | undefined,
        embedding,
        affiliateUrl: (doc.affiliateUrl as string) || 'https://styleswipe.app',
        inStock: doc.inStock !== false,
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

