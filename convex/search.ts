import { v } from "convex/values";

import { api } from "./_generated/api";
import { action, query } from "./_generated/server";

export const searchProducts = action({
    args: {
        vector: v.array(v.float64()),
        limit: v.optional(v.number()),
    },
    handler: async (ctx, args) => {
        const { vector, limit = 10 } = args;

        // Perform vector search
        const results = await ctx.vectorSearch("products", "by_embedding", {
            vector,
            limit,
        });

        // Fetch full product details
        const productIds = results.map((r) => r._id);
        const products = await ctx.runQuery(api.products.getProductsByIds, { ids: productIds });

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
            .query("products")
            .withSearchIndex("search_title", (q) => q.search("title", query))
            .take(limit);

        return results.map((p) => p.title);
    },
});
