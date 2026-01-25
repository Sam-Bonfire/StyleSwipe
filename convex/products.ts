import { query } from "./_generated/server";
import { v } from "convex/values";

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
