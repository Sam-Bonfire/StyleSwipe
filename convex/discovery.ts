import { query } from "./_generated/server";
import { mutation } from "./_generated/server";
import { v } from "convex/values";
import { SwipeActionSchema } from "@app/core/src/discovery/use-cases/ProcessSwipe";

export const getDiscoveryFeed = query({
    args: {
        limit: v.optional(v.number()),
    },
    handler: async (ctx, args) => {
        // Basic feed: return products not yet swiped by user.
        // For MVP, just return all products.
        // In real app: Vector search or anti-join with swipes.

        // 1. Get user
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) {
            // Return public feed or empty
            return await ctx.db.query("products").take(args.limit || 10);
        }

        // 2. Get user swipes to exclude (naive implementation)
        // Optimization: logic should be in a separate action or efficient query
        const user = await ctx.db
            .query("users")
            .withIndex("by_email", q => q.eq("email", identity.email || ""))
            .first();

        if (!user) return [];

        const swipes = await ctx.db
            .query("swipes")
            .withIndex("by_user", q => q.eq("userId", user._id))
            .collect();

        const swipedProductIds = new Set(swipes.map(s => s.productId));

        // 3. Fetch products
        const products = await ctx.db.query("products").take(50); // Fetch more to filter

        // 4. Filter
        const feed = products
            .filter(p => !swipedProductIds.has(p._id))
            .slice(0, args.limit || 10);

        return feed;
    }
});

export const processSwipe = mutation({
    args: {
        productId: v.id("products"),
        action: SwipeActionSchema,
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) {
            throw new Error("Unauthenticated call to processSwipe");
        }

        // In a real app, we would resolve the userId from identity.subject to our internal user ID
        // For now, we assume identity.subject maps or we query the user table.
        // Let's look up the user by the identity token or similar mechanism if needed.
        // Assuming identity.subject is the phone or email, let's look up by email or phone.
        // Optimization: For this MVP, we will query the user by email/phone/sub.

        // Note: In schema we have unique indexes on phone/email.
        // Let's try to find user by email first (common case)
        let user = await ctx.db
            .query("users")
            .withIndex("by_email", (q) => q.eq("email", identity.email || ""))
            .first();

        // Fallback or detailed auth check omitted for brevity, assuming user exists for active session.
        if (!user) {
            // Try identifying via other claims or throw
            throw new Error("User not found");
        }

        const { productId, action } = args;

        // Check availability
        const existingSwipe = await ctx.db
            .query("swipes")
            .withIndex("by_user_product", (q) =>
                q.eq("userId", user._id).eq("productId", productId)
            )
            .first();

        if (existingSwipe) {
            // Idempotency: if same action, ignore. If different, maybe update? 
            // Tinder usually doesn't let you change mind easily. Let's block duplicate swipes.
            return { status: "duplicate", swipeId: existingSwipe._id };
        }

        const swipeId = await ctx.db.insert("swipes", {
            userId: user._id,
            productId,
            action,
            timestamp: Date.now(),
        });

        return { status: "success", swipeId };
    },
});

export const getUserSwipedIds = query({
    args: {
        userId: v.id("users"),
    },
    handler: async (ctx, args) => {
        const swipes = await ctx.db
            .query("swipes")
            .withIndex("by_user", (q) => q.eq("userId", args.userId))
            .collect();
        return swipes.map(s => s.productId);
    },
});
