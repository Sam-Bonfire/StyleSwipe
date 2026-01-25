import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

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
        console.log("Convex Identity:", identity);
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

