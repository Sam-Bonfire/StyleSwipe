
import { v } from "convex/values";
import { query, mutation } from "./_generated/server";

export const getByIdentifier = query({
    args: { identifier: v.string() },
    handler: async (ctx, args) => {
        return await ctx.db
            .query("verifications")
            .withIndex("by_identifier", (q) => q.eq("identifier", args.identifier))
            .first();
    },
});

export const getByToken = query({
    args: { token: v.string() },
    handler: async (ctx, args) => {
        return await ctx.db
            .query("verifications")
            .withIndex("by_token", (q) => q.eq("token", args.token))
            .first();
    },
});

export const create = mutation({
    args: {
        identifier: v.string(),
        token: v.string(),
        type: v.union(v.literal("phone_otp"), v.literal("email_otp"), v.literal("magic_link")),
        expiresAt: v.number(),
        createdAt: v.number(),
    },
    handler: async (ctx, args) => {
        return await ctx.db.insert("verifications", args);
    },
});

export const remove = mutation({
    args: { id: v.id("verifications") },
    handler: async (ctx, args) => {
        await ctx.db.delete(args.id);
    },
});

export const removeByIdentifier = mutation({
    args: { identifier: v.string() },
    handler: async (ctx, args) => {
        const verifications = await ctx.db
            .query("verifications")
            .withIndex("by_identifier", (q) => q.eq("identifier", args.identifier))
            .collect();

        for (const verification of verifications) {
            await ctx.db.delete(verification._id);
        }
    },
});

export const deleteExpired = mutation({
    args: { now: v.number() },
    handler: async (ctx, args) => {
        const expired = await ctx.db
            .query("verifications")
            .filter((q) => q.lt(q.field("expiresAt"), args.now))
            .collect();

        for (const doc of expired) {
            await ctx.db.delete(doc._id);
        }
        return expired.length;
    },
});
