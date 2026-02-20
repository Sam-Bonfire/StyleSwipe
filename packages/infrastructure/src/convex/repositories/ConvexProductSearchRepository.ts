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
              products: result.products.map((p: any) => ({
                  id: p._id,
                  title: p.title,
                  brand: p.brand,
                  price: p.price,
                  mrp: p.mrp ?? p.price,
                  images: p.images,
                  description: p.description,
                  category: p.category,
              })) as any, // Typecast to satisfy complex domain model differences for now
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

