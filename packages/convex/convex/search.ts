import { v } from 'convex/values';

import type { Doc } from './_generated/dataModel';

import { api } from './_generated/api';
import { action, query } from './_generated/server';

export const searchProducts = action({
  args: {
    vector: v.array(v.float64()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args): Promise<{ products: (Doc<'products'> | null)[] }> => {
    const { vector, limit = 10 } = args;

    // Perform vector search
    const results = await ctx.vectorSearch('product_embeddings', 'by_embedding_v1', {
      vector,
      limit,
    });

    // Fetch full product details
    const productIds = await ctx.runQuery(api.helpers.getProductIdsFromEmbeddings, { ids: results.map((r) => r._id) });
    const products = await ctx.runQuery(api.helpers.getProductsByIds, { ids: productIds });

    return { products };
  },
});

export const getSuggestions = query({
  args: {
    query: v.string(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const { query, limit = 3 } = args;

    const results = await ctx.db
      .query('products')
      .withSearchIndex('search_title', (q) => q.search('title', query))
      .take(limit);

    return results.map((p) => p.title);
  },
});
