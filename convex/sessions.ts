
import { v } from "convex/values";
import { query, mutation } from "./_generated/server";

export const getById = query({
    args: { id: v.id("sessions") },
    handler: async (ctx, args) => {
        return await ctx.db.get(args.id);
    },
});

export const getByToken = query({
    args: { token: v.string() },
    handler: async (ctx, args) => {
        return await ctx.db
            .query("sessions")
            .withIndex("by_token", (q) => q.eq("token", args.token))
            .first();
    },
});

export const getByUserId = query({
    args: { userId: v.id("users") },
    handler: async (ctx, args) => {
        return await ctx.db
            .query("sessions")
            .withIndex("by_user", (q) => q.eq("userId", args.userId))
            .collect();
    },
});

export const create = mutation({
    args: {
        userId: v.id("users"),
        token: v.string(),
        expiresAt: v.number(),
        userAgent: v.optional(v.string()),
        ipAddress: v.optional(v.string()),
        createdAt: v.number(),
    },
    handler: async (ctx, args) => {
        return await ctx.db.insert("sessions", args);
    },
});

export const remove = mutation({
    args: { id: v.id("sessions") },
    handler: async (ctx, args) => {
        await ctx.db.delete(args.id);
    },
});

export const removeByUserId = mutation({
    args: { userId: v.id("users") },
    handler: async (ctx, args) => {
        const sessions = await ctx.db
            .query("sessions")
            .withIndex("by_user", (q) => q.eq("userId", args.userId))
            .collect();

        for (const session of sessions) {
            await ctx.db.delete(session._id);
        }
    },
});

export const deleteExpired = mutation({
    args: { now: v.number() },
    handler: async (ctx, args) => {
        // Optimization: In real app, use index or cron.
        // For strict schema, we might need an index on expiresAt? 
        // Schema has indexes by user and token. Scan might be slow.
        // Assuming small scale or relying on filter.
        const expired = await ctx.db
            .query("sessions")
            .filter((q) => q.lt(q.field("expiresAt"), args.now))
            .collect();

        for (const doc of expired) {
            await ctx.db.delete(doc._id);
        }
        return expired.length;
    },
});
