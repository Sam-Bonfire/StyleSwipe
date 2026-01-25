import { action } from "./_generated/server";
import { v } from "convex/values";
import { api } from "./_generated/api";

export const getVectorFeed = action({
    args: {
        limit: v.optional(v.number()),
        partnerId: v.optional(v.id("users")), // New: Partner ID
        influenceRatio: v.optional(v.number()), // New: 0.0 to 1.0
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) {
            return [];
        }

        // 1. Get User Profile & Vector
        const user = await ctx.runQuery(api.users.getUserPrivate, {
            email: identity.email || ""
        });

        if (!user || !user.styleProfile?.preferenceVector) {
            return [];
        }

        let searchVector = user.styleProfile.preferenceVector;

        // 2. Vector Blending (Influence Logic)
        if (args.partnerId && args.influenceRatio !== undefined && args.influenceRatio > 0) {
            // Fetch partner vector. We can reuse getUserPrivate if we had email, but we have ID.
            // We need a helper to get user by ID. For now, let's assume we can fetch it via a new query or reuse existing pattern.
            // Since we don't have a specific `getUserById` query exposed in `users.ts` yet (only by email), let's create one or query directly?
            // Actions can't query DB directly. We need `api.users.getUserById`.
            // Let's assume we will add it.
            const partner = await ctx.runQuery(api.users.getUserById, { userId: args.partnerId });

            if (partner?.styleProfile?.preferenceVector) {
                const ratio = Math.min(Math.max(args.influenceRatio, 0), 1);
                const userRatio = 1 - ratio;
                const partnerVec = partner.styleProfile.preferenceVector;

                // Simple linear interpolation
                searchVector = searchVector.map((val, i) => val * userRatio + partnerVec[i] * ratio);
            }
        }

        const { preferenceVector } = user.styleProfile; // We actually use searchVector now

        // 3. Get Swiped IDs to exclude
        const swipedIds = await ctx.runQuery(api.discovery.getUserSwipedIds, {
            userId: user._id
        });

        // 4. Vector Search
        // Construct filter based on user gender if specific
        let filter;
        if (user.styleProfile?.gender && user.styleProfile.gender !== "both") {
            const gender = user.styleProfile.gender;
            filter = (q: any) => q.eq("gender", gender);
        }

        const results = await ctx.vectorSearch("products", "by_embedding", {
            vector: searchVector, // Use blended vector
            limit: (args.limit || 10) + swipedIds.length,
            filter,
        });

        // 4. Filter & Hydrate
        // Filter out swiped items
        const filteredResults = results.filter(r => !swipedIds.includes(r._id));

        // We only have the Ids and scores. Need to fetch full docs.
        const productIds = filteredResults.slice(0, args.limit || 10).map(r => r._id);

        // Bulk fetch details
        const products = await ctx.runQuery(api.products.getProductsByIds, { ids: productIds });

        return products;
    },
});
