
import { v } from "convex/values";
import { mutation } from "./_generated/server";

export const syncBatch = mutation({
    args: {
        swipes: v.array(
            v.object({
                productId: v.id("products"),
                action: v.union(v.literal("like"), v.literal("pass"), v.literal("super")),
                timestamp: v.number(),
            })
        ),
        summary: v.optional(
            v.object({
                period: v.string(),
                granularity: v.string(),
                summary: v.any(),
                centroidShift: v.array(v.float64()),
                hash: v.string(),
                createdAt: v.number(),
            })
        ),
        vectorUpdate: v.optional(
            v.object({
                v1: v.optional(v.array(v.float64())),
                v2: v.optional(v.array(v.float64())),
                activeDNA: v.optional(v.string()),
            })
        ),
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) {
            throw new Error("Unauthenticated call to syncBatch");
        }

        // In Convex with BetterAuth/custom, we usually store the mapping or use `ctx.auth` correctly.
        // For this implementation, let's assume we fetch the user by token identity.
        const user = await ctx.db
            .query("users")
            .withIndex("by_email", (q) => q.eq("email", identity.email!)) // Fallback if subject isn't the ID
            .first();

        if (!user) {
            throw new Error("User not found");
        }

        const realUserId = user._id;

        // 1. Insert Raw Swipes
        if (args.swipes.length > 0) {
            for (const swipe of args.swipes) {
                await ctx.db.insert("swipes", {
                    userId: realUserId,
                    productId: swipe.productId,
                    action: swipe.action,
                    timestamp: swipe.timestamp,
                });
            }
        }

        // 2. Insert Summary
        if (args.summary) {
            // Idempotency check could go here using the hash
            const existing = await ctx.db
                .query("weeklySummaries")
                .withIndex("by_user_period", (q) => q.eq("userId", realUserId).eq("period", args.summary!.period))
                .first();

            if (!existing) {
                await ctx.db.insert("weeklySummaries", {
                    userId: realUserId,
                    ...args.summary,
                });
            }
        }

        // 3. Update User Vector DNA
        if (args.vectorUpdate) {
            const currentProfile = user.styleProfile || {
                gender: "both", // defaults if missing
                vibes: [],
                sizes: {},
                budget: { min: 0, max: 1000 },
            };

            let newDna = currentProfile.dna || {};

            if (args.vectorUpdate.v1) {
                newDna = { ...newDna, v1: args.vectorUpdate.v1 };
            }
            if (args.vectorUpdate.v2) {
                newDna = { ...newDna, v2: args.vectorUpdate.v2 };
            }

            await ctx.db.patch(realUserId, {
                styleProfile: {
                    ...currentProfile,
                    dna: newDna,
                    activeDNA: args.vectorUpdate.activeDNA || currentProfile.activeDNA || "v1",
                    lastUpdated: Date.now(),
                }
            });
        }

        return { success: true, processedSwipes: args.swipes.length };
    },
});
