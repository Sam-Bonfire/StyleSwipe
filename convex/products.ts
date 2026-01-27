import { v } from "convex/values";

import { query } from "./_generated/server";

export const getProductsByIds = query({
    args: {
        ids: v.array(v.id("products")),
    },
    handler: async (ctx, args) => {
        const products: any[] = [];
        for (const id of args.ids) {
            const product = await ctx.db.get(id);
            if (product) products.push(product);
        }
        return products;
    },
});

export const getLatest = query({
    args: {
        limit: v.optional(v.number()),
    },
    handler: async (ctx, args) => {
        const limit = args.limit ?? 10;
        return await ctx.db
            .query("products")
            .order("desc") // CreatedAt is implicit in ID, but better to use _creationTime if available
            // Convex documents have _creationTime built-in.
            // .order("desc") sorts by creation time automatically for table scans?
            // Actually, ctx.db.query("products").order("desc") sorts by _creationTime descending.
            .take(limit);
    },
});
