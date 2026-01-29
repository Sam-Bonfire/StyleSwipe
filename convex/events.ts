
import { v } from "convex/values";
import { query, mutation } from "./_generated/server";

export const create = mutation({
    args: {
        type: v.string(),
        userId: v.optional(v.id("users")),
        productId: v.optional(v.id("products")),
        variant: v.optional(v.string()),
        isSampled: v.boolean(),
        metadata: v.optional(v.any()), // Loose object
        timestamp: v.number(),
    },
    handler: async (ctx, args) => {
        return await ctx.db.insert("events", args);
    },
});

export const track = create; // Alias

export const getByType = query({
    args: { type: v.string(), limit: v.optional(v.number()) },
    handler: async (ctx, args) => {
        return await ctx.db
            .query("events")
            .withIndex("by_type", (q) => q.eq("type", args.type))
            .order("desc")
            .take(args.limit ?? 100);
    },
});

export const getByUserAndType = query({
    args: { userId: v.id("users"), type: v.string(), limit: v.optional(v.number()) },
    handler: async (ctx, args) => {
        return await ctx.db
            .query("events")
            .withIndex("by_user_type", (q) => q.eq("userId", args.userId).eq("type", args.type))
            .order("desc")
            .take(args.limit ?? 100);
    },
});

export const getSampledByType = query({
    args: { type: v.string(), limit: v.optional(v.number()) },
    handler: async (ctx, args) => {
        // Sampled usually means isSampled=true.
        // Index `by_type` is (type). `by_user_type` is (userId, type).
        // No index for (type, isSampled)?
        // We can filter.
        return await ctx.db
            .query("events")
            .withIndex("by_type", (q) => q.eq("type", args.type))
            .filter((q) => q.eq(q.field("isSampled"), true))
            .order("desc")
            .take(args.limit ?? 100);
    },
});
