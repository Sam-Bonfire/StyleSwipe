import { ProductSearchRepository, SearchResult, SearchError, Vector384 } from '@app/core';
import { api } from '@convex-api';
import { ConvexReactClient } from 'convex/react';
import { Effect } from 'effect';

export class ConvexProductAdapter implements ProductSearchRepository {
  constructor(private convex: ConvexReactClient) {}

  search(vector: Vector384, limit: number): Effect.Effect<SearchResult, SearchError> {
    return Effect.tryPromise({
      try: async () => {
        const result = await this.convex.action(api.search.searchProducts, { vector, limit });
        // Map Convex result to Domain result
        return {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          products: result.products.map((p: any) => ({
            id: p._id,
            title: p.title,
            brand: p.brand,
            price: p.price,
            mrp: p.mrp ?? p.price,
            images: p.images,
            description: p.description,
            category: p.category,
          })),
        };
      },
      catch: (error) => new SearchError(String(error)),
    });
  }

  getSuggestions(query: string, limit: number): Effect.Effect<string[], SearchError> {
    return Effect.tryPromise({
      try: async () => {
        const result = await this.convex.query(api.search.getSuggestions, { query, limit });
        return result;
      },
      catch: (error) => new SearchError(String(error)),
    });
  }
}
