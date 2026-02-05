import { SwipeActionSchema } from "@app/core/src/discovery/use-cases/ProcessSwipe";
import { v } from "convex/values";

import { mutation, query } from "./_generated/server";

export const recordProductView = mutation({
    args: {
        productId: v.id("products"),
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) return; // Only track logged in users for now

        const user = await ctx.db
            .query("users")
            .withIndex("by_email", (q) => q.eq("email", identity.email!))
            .first();

        if (!user) return;

        // Log the view event
        await ctx.db.insert("events", {
            type: "view_product",
            userId: user._id,
            productId: args.productId,
            isSampled: true, // Always keep view history for functional requirements
            timestamp: Date.now(),
        });
    },
});

export const getRecentlyViewed = query({
    args: {
        limit: v.optional(v.number()),
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) return [];

        const user = await ctx.db
            .query("users")
            .withIndex("by_email", (q) => q.eq("email", identity.email!))
            .first();

        if (!user) return [];

        const limit = args.limit ?? 10;

        // Fetch recent view events
        const views = await ctx.db
            .query("events")
            .withIndex("by_user_type", (q) =>
                q.eq("userId", user._id).eq("type", "view_product")
            )
            .order("desc") // Most recent first
            .take(limit * 3); // Take more to account for duplicates

        // Deduplicate product IDs
        const uniqueProductIds = new Set<string>();
        const orderedIds: any[] = [];

        for (const view of views) {
            if (view.productId && !uniqueProductIds.has(view.productId)) {
                uniqueProductIds.add(view.productId);
                orderedIds.push(view.productId);
                if (orderedIds.length >= limit) break;
            }
        }

        if (orderedIds.length === 0) return [];

        // Fetch product details
        // Note: We can't use getAll with array of IDs in a query easily without helper or mapping.
        // We can use Promise.all with ctx.db.get
        const products = await Promise.all(
            orderedIds.map((id) => ctx.db.get(id))
        );

        return products.filter((p) => p !== null);
    },
});

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
            // Return public feed (Top 20 Recent)
            return await ctx.db
                .query("products")
                // .withIndex("by_created") // Removed custom index
                .order("desc")
                .take(args.limit || 20);
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

        // 3. Fetch recent products (Fallback Logic)
        // User Request: "Top 20 most recent additions"
        const products = await ctx.db
            .query("products")
            // .withIndex("by_created") // Removed custom index
            .order("desc")
            .take(50); // Fetch more to filter out swipes

        // 4. Filter
        const feed = products
            .filter(p => !swipedProductIds.has(p._id))
            .slice(0, args.limit || 20); // Default to 20 as requested

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
        const user = await ctx.db
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

        // ---------------------------------------------------------
        // REAL-TIME VECTOR LEARNING
        // ---------------------------------------------------------
        if (action === "like" || action === "super") {
            const product = await ctx.db.get(productId);
            if (product && product.embedding) {
                const LEARNING_RATE = action === "super" ? 0.2 : 0.1; // Super like has more weight

                const currentProfile = user.styleProfile;
                const currentVector = currentProfile?.preferenceVector;

                const defaultProfile = {
                    gender: "both" as const,
                    vibes: [],
                    sizes: {},
                    budget: { min: 0, max: 20000 },
                };

                if (!currentVector) {
                    await ctx.db.patch(user._id, {
                        styleProfile: {
                            ...defaultProfile,
                            ...currentProfile,
                            preferenceVector: product.embedding
                        }
                    });
                    console.log(`Cold start: Initialized user vector from ${product.title}`);
                } else {
                    const newVector = currentVector.map((val: number, i: number) => {
                        const targetVal = product.embedding![i];
                        return val + LEARNING_RATE * (targetVal - val);
                    });

                    await ctx.db.patch(user._id, {
                        styleProfile: {
                            ...defaultProfile,
                            ...currentProfile,
                            preferenceVector: newVector
                        }
                    });
                    console.log(`Updated user vector based on ${action}. First 3 dims: ${newVector.slice(0, 3).map((v: number) => v.toFixed(4)).join(", ")}`);
                }
            }
        }

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

export const debugSwipes = query({
    args: {},
    handler: async (ctx) => {
        return await ctx.db.query("swipes").order("desc").take(10);
    },
});
