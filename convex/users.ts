import { v } from "convex/values";
import { query, mutation } from "./_generated/server";

export const getUserPrivate = query({
    args: {
        email: v.string(),
    },
    handler: async (ctx, args) => {
        return await ctx.db
            .query("users")
            .withIndex("by_email", (q) => q.eq("email", args.email))
            .first();
    },
});

export const currentUser = query({
    args: {},
    handler: async (ctx) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity || !identity.email) {
            return null;
        }

        return await ctx.db
            .query("users")
            .withIndex("by_email", (q) => q.eq("email", identity.email!))
            .first();
    },
});

export const updateStyleProfile = mutation({
    args: {
        styleProfile: v.object({
            gender: v.union(v.literal("men"), v.literal("women"), v.literal("both")),
            vibes: v.array(v.string()),
            sizes: v.object({
                top: v.optional(v.string()),
                bottom: v.optional(v.string()),
                shoe: v.optional(v.string()),
            }),
            budget: v.object({
                min: v.number(),
                max: v.number(),
            }),
            preferenceVector: v.optional(v.array(v.float64())),
        }),
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) {
            throw new Error("Unauthenticated");
        }

        const user = await ctx.db
            .query("users")
            .withIndex("by_email", (q) => q.eq("email", identity.email!))
            .unique();

        if (!user) {
            throw new Error("User not found");
        }

        await ctx.db.patch(user._id, {
            styleProfile: args.styleProfile,
        });
    },
});

/**
 * Creates a user record in the users table if one doesn't exist.
 * Must be called after successful authentication to sync Better Auth users.
 */
export const getOrCreateUser = mutation({
    args: {},
    handler: async (ctx) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity || !identity.email) {
            throw new Error("Unauthenticated");
        }

        // Check if user already exists
        const existingUser = await ctx.db
            .query("users")
            .withIndex("by_email", (q) => q.eq("email", identity.email!))
            .first();

        if (existingUser) {
            return existingUser;
        }

        // Create new user from identity
        const userId = await ctx.db.insert("users", {
            name: identity.name || "User",
            email: identity.email,
            emailVerified: identity.emailVerified as boolean || false,
            image: identity.pictureUrl,
        });

        return await ctx.db.get(userId);
    },
});

export const debugUserProfile = query({
    args: {},
    handler: async (ctx) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) return null;
        return await ctx.db
            .query("users")
            .withIndex("by_email", (q) => q.eq("email", identity.email!))
            .first();
    },
});

export const getById = query({
    args: { id: v.id("users") },
    handler: async (ctx, args) => {
        return await ctx.db.get(args.id);
    },
});

export const getByEmail = query({
    args: { email: v.string() },
    handler: async (ctx, args) => {
        return await ctx.db
            .query("users")
            .withIndex("by_email", (q) => q.eq("email", args.email))
            .first();
    },
});

export const getByPhone = query({
    args: { phone: v.string() },
    handler: async (ctx, args) => {
        return await ctx.db
            .query("users")
            .withIndex("by_phone", (q) => q.eq("phone", args.phone))
            .first();
    },
});

export const create = mutation({
    args: {
        name: v.string(),
        email: v.string(),
        emailVerified: v.boolean(),
        image: v.optional(v.string()),
        phone: v.optional(v.string()),
        activeOrgId: v.optional(v.id("organizations")),
        styleProfile: v.optional(
            v.object({
                gender: v.union(v.literal("men"), v.literal("women"), v.literal("both")),
                vibes: v.array(v.string()),
                sizes: v.object({
                    top: v.optional(v.string()),
                    bottom: v.optional(v.string()),
                    shoe: v.optional(v.string()),
                }),
                budget: v.object({
                    min: v.number(),
                    max: v.number(),
                }),
                preferenceVector: v.optional(v.array(v.float64())),
            })
        ),
    },
    handler: async (ctx, args) => {
        return await ctx.db.insert("users", args);
    },
});

export const update = mutation({
    args: {
        id: v.id("users"),
        name: v.optional(v.string()),
        email: v.optional(v.string()),
        emailVerified: v.optional(v.boolean()),
        image: v.optional(v.string()),
        phone: v.optional(v.string()),
        activeOrgId: v.optional(v.id("organizations")),
        styleProfile: v.optional(
            v.object({
                gender: v.union(v.literal("men"), v.literal("women"), v.literal("both")),
                vibes: v.array(v.string()),
                sizes: v.object({
                    top: v.optional(v.string()),
                    bottom: v.optional(v.string()),
                    shoe: v.optional(v.string()),
                }),
                budget: v.object({
                    min: v.number(),
                    max: v.number(),
                }),
                preferenceVector: v.optional(v.array(v.float64())),
            })
        ),
    },
    handler: async (ctx, args) => {
        const { id, ...updates } = args;
        await ctx.db.patch(id, updates);
    },
});

export const remove = mutation({
    args: { id: v.id("users") },
    handler: async (ctx, args) => {
        await ctx.db.delete(args.id);
    },
});
