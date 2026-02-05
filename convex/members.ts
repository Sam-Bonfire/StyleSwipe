
import { v } from "convex/values";
import { query, mutation } from "./_generated/server";

export const getById = query({
    args: { id: v.id("members") },
    handler: async (ctx, args) => {
        return await ctx.db.get(args.id);
    },
});

export const removeByOrg = mutation({
    args: { orgId: v.id("organizations") },
    handler: async (ctx, args) => {
        const members = await ctx.db
            .query("members")
            .withIndex("by_org", (q) => q.eq("orgId", args.orgId))
            .collect();
        for (const member of members) {
            await ctx.db.delete(member._id);
        }
    },
});

export const create = mutation({
    args: {
        orgId: v.id("organizations"),
        userId: v.id("users"),
        role: v.union(
            v.literal("admin"),
            v.literal("member"),
            v.literal("influencer"),
            v.literal("brand_manager")
        ),
        joinedAt: v.number(),
    },
    handler: async (ctx, args) => {
        return await ctx.db.insert("members", args);
    },
});

export const getByOrg = query({
    args: { orgId: v.id("organizations") },
    handler: async (ctx, args) => {
        return await ctx.db
            .query("members")
            .withIndex("by_org", (q) => q.eq("orgId", args.orgId))
            .collect();
    },
});

export const getByUser = query({
    args: { userId: v.id("users") },
    handler: async (ctx, args) => {
        return await ctx.db
            .query("members")
            .withIndex("by_user", (q) => q.eq("userId", args.userId))
            .collect();
    },
});

export const getByOrgAndUser = query({
    args: { orgId: v.id("organizations"), userId: v.id("users") },
    handler: async (ctx, args) => {
        return await ctx.db
            .query("members")
            .withIndex("by_org_user", (q) => q.eq("orgId", args.orgId).eq("userId", args.userId))
            .first();
    },
});

export const updateRole = mutation({
    args: {
        id: v.id("members"),
        role: v.union(
            v.literal("admin"),
            v.literal("member"),
            v.literal("influencer"),
            v.literal("brand_manager")
        ),
    },
    handler: async (ctx, args) => {
        await ctx.db.patch(args.id, { role: args.role });
    },
});

export const remove = mutation({
    args: { id: v.id("members") },
    handler: async (ctx, args) => {
        await ctx.db.delete(args.id);
    },
});
