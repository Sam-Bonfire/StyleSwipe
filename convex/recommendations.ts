import { v } from "convex/values";

import { api } from "./_generated/api";
import { action } from "./_generated/server";

export const getVectorFeed = action({
    args: {
        limit: v.optional(v.number()),
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) {
            // Return public/trending products if not logged in
            return await ctx.runQuery(api.discovery.getDiscoveryFeed, { limit: args.limit });
        }

        // 1. Get User Profile & Vector
        // We need to query the internal user to get the vector.
        // Since actions can't access database directly, we must call a query.
        const user = await ctx.runQuery(api.users.getUserPrivate, {
            email: identity.email || ""
        });

        if (!user || !user.styleProfile?.preferenceVector) {
            // Fallback: No vector found, return standard discovery feed
            return await ctx.runQuery(api.discovery.getDiscoveryFeed, { limit: args.limit });
        }

        const { preferenceVector } = user.styleProfile;

        // 2. Get Swiped IDs to exclude
        const swipedIds = await ctx.runQuery(api.discovery.getUserSwipedIds, {
            userId: user._id
        });

        // 3. Vector Search
        // Construct filter based on user gender if specific
        let filter;
        if (user.styleProfile?.gender && user.styleProfile.gender !== "both") {
            const gender = user.styleProfile.gender;
            filter = (q: any) => q.eq("gender", gender);
        }

        const results = await ctx.vectorSearch("products", "by_embedding", {
            vector: preferenceVector,
            limit: Math.min(256, (args.limit || 10) + swipedIds.length),
            filter,
        });

        // 4. Filter & Hydrate
        // Filter out swiped items
        const filteredResults = results.filter(r => !swipedIds.includes(r._id));

        // We only have the Ids and scores. Need to fetch full docs.
        const productIds = filteredResults.slice(0, args.limit || 10).map(r => r._id);

        // Bulk fetch details
        const products = await ctx.runQuery(api.products.getProductsByIds, { ids: productIds });

        // Fallback: If vector search yields no results (e.g. no products have embeddings yet),
        // return the standard discovery feed (recent items)
        if (products.length === 0) {
            console.log("Vector search returned 0 items, falling back to discovery feed.");
            return await ctx.runQuery(api.discovery.getDiscoveryFeed, { limit: args.limit });
        }

        return products;
    },
});
