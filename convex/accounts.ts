
import { v } from "convex/values";
import { query, mutation } from "./_generated/server";

export const getById = query({
    args: { id: v.id("accounts") },
    handler: async (ctx, args) => {
        return await ctx.db.get(args.id);
    },
});

export const getByProvider = query({
    args: { providerId: v.string(), providerAccountId: v.string() },
    handler: async (ctx, args) => {
        return await ctx.db
            .query("accounts")
            .withIndex("by_provider", (q) =>
                q.eq("providerId", args.providerId).eq("providerAccountId", args.providerAccountId)
            )
            .first();
    },
});

export const getByUserId = query({
    args: { userId: v.id("users") },
    handler: async (ctx, args) => {
        return await ctx.db
            .query("accounts")
            .withIndex("by_user", (q) => q.eq("userId", args.userId))
            .collect();
    },
});

export const create = mutation({
    args: {
        userId: v.id("users"),
        providerId: v.string(),
        providerAccountId: v.string(),
        accessToken: v.optional(v.string()),
        refreshToken: v.optional(v.string()),
        accessTokenExpiresAt: v.optional(v.number()),
        scope: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        return await ctx.db.insert("accounts", args);
    },
});

export const update = mutation({
    args: {
        id: v.id("accounts"),
        userId: v.optional(v.id("users")),
        providerId: v.optional(v.string()),
        providerAccountId: v.optional(v.string()),
        accessToken: v.optional(v.string()),
        refreshToken: v.optional(v.string()),
        accessTokenExpiresAt: v.optional(v.number()),
        scope: v.optional(v.string()),
        updatedAt: v.optional(v.number()), // Repo passes it even if schema ignores it?
    },
    handler: async (ctx, args) => {
        const { id, updatedAt, ...updates } = args;
        await ctx.db.patch(id, updates);
    },
});

export const remove = mutation({
    args: { id: v.id("accounts") },
    handler: async (ctx, args) => {
        await ctx.db.delete(args.id);
    },
});

export const removeByUserId = mutation({
    args: { userId: v.id("users") },
    handler: async (ctx, args) => {
        const accounts = await ctx.db
            .query("accounts")
            .withIndex("by_user", (q) => q.eq("userId", args.userId))
            .collect();
        for (const account of accounts) {
            await ctx.db.delete(account._id);
        }
    },
});
