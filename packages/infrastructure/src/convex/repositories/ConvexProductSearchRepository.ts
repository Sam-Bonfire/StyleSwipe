import { api } from '@app/convex';
import { ProductSearchRepository, RepositoryError, type Vector384 } from '@app/core';
import { ConvexReactClient } from 'convex/react';
import { Layer, Effect } from 'effect';




export const createProductSearchRepositoryLayer = (client: ConvexReactClient) => Layer.succeed(
    ProductSearchRepository,
    ProductSearchRepository.of({

    search: (vector: Vector384, limit: number) => Effect.tryPromise({
      try: async () => {
          const result = await client.action(api.search.searchProducts, { vector, limit });
          return {
              products: result.products.map((p: Record<string, unknown>) => ({
                  id: p._id as string,
                  title: p.title as string,
                  brand: p.brand as string,
                  price: p.price as number,
                  mrp: (p.mrp as number | undefined) ?? (p.price as number),
                  images: p.images as string[],
                  category: p.category as string,
              })),
          };
      },
      catch: (e) => new RepositoryError(e instanceof Error ? e.message : String(e), e)
    }),

    getSuggestions: (query: string, limit: number) => Effect.tryPromise({
      try: async () => {
          const result = await client.query(api.search.getSuggestions, { query, limit });
          return result;
      },
      catch: (e) => new RepositoryError(e instanceof Error ? e.message : String(e), e)
    }),

    })
);

