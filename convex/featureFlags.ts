
import { v } from "convex/values";
import { query, mutation } from "./_generated/server";

export const getById = query({
    args: { id: v.id("featureFlags") },
    handler: async (ctx, args) => {
        return await ctx.db.get(args.id);
    },
});

export const getByEnvName = query({
    args: {
        name: v.string(),
        environment: v.union(v.literal("dev"), v.literal("staging"), v.literal("prod")),
    },
    handler: async (ctx, args) => {
        return await ctx.db
            .query("featureFlags")
            .withIndex("by_env_name", (q) => q.eq("environment", args.environment).eq("name", args.name))
            .first();
    },
});

export const getByEnvironment = query({
    args: {
        environment: v.union(v.literal("dev"), v.literal("staging"), v.literal("prod")),
    },
    handler: async (ctx, args) => {
        return await ctx.db
            .query("featureFlags")
            .withIndex("by_env_name", (q) => q.eq("environment", args.environment))
            .collect();
    },
});

export const create = mutation({
    args: {
        name: v.string(),
        environment: v.union(v.literal("dev"), v.literal("staging"), v.literal("prod")),
        isEnabled: v.boolean(),
        description: v.optional(v.string()),
        rules: v.optional(
            v.array(
                v.object({
                    type: v.union(
                        v.literal("user_id"),
                        v.literal("role"),
                        v.literal("percentage"),
                        v.literal("org_id")
                    ),
                    value: v.string(),
                })
            )
        ),
        updatedAt: v.number(),
    },
    handler: async (ctx, args) => {
        return await ctx.db.insert("featureFlags", args);
    },
});

export const update = mutation({
    args: {
        id: v.id("featureFlags"),
        name: v.optional(v.string()),
        environment: v.optional(v.union(v.literal("dev"), v.literal("staging"), v.literal("prod"))),
        isEnabled: v.optional(v.boolean()),
        description: v.optional(v.string()),
        rules: v.optional(
            v.array(
                v.object({
                    type: v.union(
                        v.literal("user_id"),
                        v.literal("role"),
                        v.literal("percentage"),
                        v.literal("org_id")
                    ),
                    value: v.string(),
                })
            )
        ),
        updatedAt: v.number(),
    },
    handler: async (ctx, args) => {
        const { id, ...updates } = args;
        await ctx.db.patch(id, updates);
    },
});

export const remove = mutation({
    args: { id: v.id("featureFlags") },
    handler: async (ctx, args) => {
        await ctx.db.delete(args.id);
    },
});
