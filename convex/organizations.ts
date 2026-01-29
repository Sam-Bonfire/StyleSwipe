
import { v } from "convex/values";
import { query, mutation } from "./_generated/server";

export const getById = query({
    args: { id: v.id("organizations") },
    handler: async (ctx, args) => {
        return await ctx.db.get(args.id);
    },
});

export const getBySlug = query({
    args: { slug: v.string() },
    handler: async (ctx, args) => {
        return await ctx.db
            .query("organizations")
            .withIndex("by_slug", (q) => q.eq("slug", args.slug))
            .first();
    },
});

export const create = mutation({
    args: {
        name: v.string(),
        slug: v.string(),
        logo: v.optional(v.string()),
        metadata: v.optional(
            v.object({
                type: v.optional(v.union(v.literal("influencer_agency"), v.literal("brand_partner"))),
                website: v.optional(v.string()),
                description: v.optional(v.string()),
            })
        ),
        createdAt: v.number(),
    },
    handler: async (ctx, args) => {
        return await ctx.db.insert("organizations", args);
    },
});

export const update = mutation({
    args: {
        id: v.id("organizations"),
        name: v.optional(v.string()),
        slug: v.optional(v.string()),
        logo: v.optional(v.string()),
        metadata: v.optional(
            v.object({
                type: v.optional(v.union(v.literal("influencer_agency"), v.literal("brand_partner"))),
                website: v.optional(v.string()),
                description: v.optional(v.string()),
            })
        )
    },
    handler: async (ctx, args) => {
        const { id, ...updates } = args;
        await ctx.db.patch(id, updates);
    },
});

export const remove = mutation({
    args: { id: v.id("organizations") },
    handler: async (ctx, args) => {
        await ctx.db.delete(args.id);
    },
});
