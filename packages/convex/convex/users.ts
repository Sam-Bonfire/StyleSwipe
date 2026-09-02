import { v } from 'convex/values';

import { components } from './_generated/api';
import { mutation, query } from './_generated/server';

const DEFAULT_PAGINATION = { numItems: 100, cursor: null };

/**
 * Get the style profile for a specific user.
 * Internal helper for queries and mutations in this file.
 */
const getStyleProfileInternal = async (ctx: any, userId: string) => {
  return await ctx.db
    .query('style_profiles')
    .withIndex('by_user', (q: any) => q.eq('userId', userId))
    .first();
};

export const currentUser = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return null;
    }

    // Single optimized cross-component call for user data and all permissions
    const userData = await ctx.runQuery(components.auth.api.getCurrentUserWithPermissions, {
      subject: identity.subject,
      email: identity.email,
    });

    if (!userData) return null;

    const { isCoreMember, isCoreAdmin, ...user } = userData;

    const styleProfile = await getStyleProfileInternal(ctx, user._id || user.id);

    return {
      ...user,
      styleProfile: styleProfile || undefined,
      isCoreMember,
      isCoreAdmin,
    };
  },
});

export const getUserPrivate = query({
  args: {
    email: v.string(),
  },
  handler: async (ctx, args) => {
    const users = await ctx.runQuery(components.auth.api.findMany, {
      model: 'users',
      where: [{ field: 'email', operator: operatorMapping('eq'), value: args.email }],
      paginationOpts: DEFAULT_PAGINATION,
    });
    const user = users.page[0];

    if (!user) return null;

    const styleProfile = await getStyleProfileInternal(ctx, user.id || user._id);

    return {
      ...user,
      styleProfile: styleProfile || undefined,
    };
  },
});

/**
 * Get or create user record
 * FIX: Permission issue while user creation requiring authentication
 * Returning null if unauthenticated instead of throwing.
 */
export const getOrCreateUser = mutation({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return null;
    }

    // 1. Try Lookup by Subject (User ID)
    let users = await ctx.runQuery(components.auth.api.findMany, {
      model: 'users',
      where: [{ field: '_id', operator: operatorMapping('eq'), value: identity.subject }],
      paginationOpts: DEFAULT_PAGINATION,
    });
    let user = users.page[0];

    // 2. Fallback by Email
    if (!user && identity.email) {
      users = await ctx.runQuery(components.auth.api.findMany, {
        model: 'users',
        where: [{ field: 'email', operator: operatorMapping('eq'), value: identity.email }],
        paginationOpts: DEFAULT_PAGINATION,
      });
      user = users.page[0];
    }

    if (user) {
      const styleProfile = await getStyleProfileInternal(ctx, user.id || user._id);
      return { ...user, styleProfile: styleProfile || undefined };
    }

    // 3. Create User if not found
    const emailToUse = identity.email || `phone_${identity.subject}@styleswipe.app`;

    const userId = await ctx.runMutation(components.auth.api.create, {
      input: {
        model: 'users',
        data: {
          name: identity.name || 'User',
          email: emailToUse,
          emailVerified: (identity.emailVerified as boolean) || false,
          image: identity.pictureUrl,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        },
      },
    });

    return {
      _id: userId,
      id: userId,
      name: identity.name || 'User',
      email: emailToUse,
      styleProfile: undefined,
    };
  },
});

// Helper for operator types
function operatorMapping(op: string) {
  return op as any;
}

export const getById = query({
  args: { id: v.string() },
  handler: async (ctx, args) => {
    const users = await ctx.runQuery(components.auth.api.findMany, {
      model: 'users',
      where: [{ field: '_id', operator: operatorMapping('eq'), value: args.id }],
      paginationOpts: DEFAULT_PAGINATION,
    });
    const user = users.page[0];
    if (!user) return null;

    const styleProfile = await getStyleProfileInternal(ctx, user.id || user._id);
    return { ...user, styleProfile: styleProfile || undefined };
  },
});

export const getByEmail = query({
  args: { email: v.string() },
  handler: async (ctx, args) => {
    const users = await ctx.runQuery(components.auth.api.findMany, {
      model: 'users',
      where: [{ field: 'email', operator: operatorMapping('eq'), value: args.email }],
      paginationOpts: DEFAULT_PAGINATION,
    });
    const user = users.page[0];
    if (!user) return null;
    const styleProfile = await getStyleProfileInternal(ctx, user.id || user._id);
    return { ...user, styleProfile: styleProfile || undefined };
  },
});

export const getByPhone = query({
  args: { phone: v.string() },
  handler: async (ctx, args) => {
    const users = await ctx.runQuery(components.auth.api.findMany, {
      model: 'users',
      where: [{ field: 'phoneNumber', operator: operatorMapping('eq'), value: args.phone }],
      paginationOpts: DEFAULT_PAGINATION,
    });
    const user = users.page[0];
    if (!user) return null;
    const styleProfile = await getStyleProfileInternal(ctx, user.id || user._id);
    return { ...user, styleProfile: styleProfile || undefined };
  },
});

export const create = mutation({
  args: {
    name: v.string(),
    email: v.string(),
    emailVerified: v.boolean(),
    image: v.optional(v.string()),
    phoneNumber: v.optional(v.string()),
    styleProfile: v.optional(
      v.object({
        gender: v.union(v.literal('men'), v.literal('women'), v.literal('both')),
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
    ),
  },
  handler: async (ctx, args) => {
    const { styleProfile, ...userArgs } = args;

    const userId = await ctx.runMutation(components.auth.api.create, {
      input: {
        model: 'users',
        data: {
          ...userArgs,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        },
      },
    });

    if (styleProfile) {
      await ctx.db.insert('style_profiles', {
        userId: userId as string,
        ...styleProfile,
        lastUpdated: Date.now(),
      });
    }

    return userId;
  },
});

export const update = mutation({
  args: {
    id: v.string(),
    name: v.optional(v.string()),
    email: v.optional(v.string()),
    emailVerified: v.optional(v.boolean()),
    image: v.optional(v.string()),
    phoneNumber: v.optional(v.string()),
    styleProfile: v.optional(
      v.object({
        gender: v.union(v.literal('men'), v.literal('women'), v.literal('both')),
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
    ),
  },
  handler: async (ctx, args) => {
    const { id, styleProfile, ...updates } = args;

    if (Object.keys(updates).length > 0) {
      await ctx.runMutation(components.auth.api.updateOne, {
        input: {
          model: 'users',
          where: [{ field: '_id', operator: operatorMapping('eq'), value: id }],
          update: updates,
        },
      });
    }

    if (styleProfile) {
      const existing = await getStyleProfileInternal(ctx, id);
      if (existing) {
        await ctx.db.patch(existing._id, { ...styleProfile, lastUpdated: Date.now() });
      } else {
        await ctx.db.insert('style_profiles', {
          userId: id,
          ...styleProfile,
          lastUpdated: Date.now(),
        });
      }
    }
  },
});

export const updateStyleProfile = mutation({
  args: {
    styleProfile: v.object({
      gender: v.union(v.literal('men'), v.literal('women'), v.literal('both')),
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
      throw new Error('Unauthenticated');
    }

    const userId = identity.subject;

    const existingProfile = await getStyleProfileInternal(ctx, userId);

    if (existingProfile) {
      await ctx.db.patch(existingProfile._id, {
        ...args.styleProfile,
        lastUpdated: Date.now(),
      });
    } else {
      await ctx.db.insert('style_profiles', {
        userId: userId,
        ...args.styleProfile,
        lastUpdated: Date.now(),
      });
    }
  },
});

export const remove = mutation({
  args: { id: v.string() },
  handler: async (ctx, args) => {
    await ctx.runMutation(components.auth.api.deleteOne, {
      input: {
        model: 'users',
        where: [{ field: '_id', operator: operatorMapping('eq'), value: args.id }],
      },
    });

    const profile = await getStyleProfileInternal(ctx, args.id);
    if (profile) {
      await ctx.db.delete(profile._id);
    }
  },
});

// Registers or refreshes the push token for the authenticated user's device.
// Uses the join-table pattern (user_devices) so tokens live outside Better Auth's
// managed users table, avoiding schema conflicts with the auth component.
export const updatePushToken = mutation({
  args: {
    token: v.string(),
    platform: v.union(v.literal('IOS'), v.literal('ANDROID'), v.literal('WEB')),
    service: v.union(v.literal('APNS'), v.literal('FCM')),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error('Unauthenticated');
    }

    const userId = identity.subject;
    const now = Date.now();

    const existing = await ctx.db
      .query('user_devices')
      .withIndex('by_user', (q: any) => q.eq('userId', userId))
      .filter((q: any) => q.eq(q.field('token'), args.token))
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, {
        isActive: true,
        lastSeenAt: now,
      });
    } else {
      await ctx.db.insert('user_devices', {
        userId,
        token: args.token,
        platform: args.platform,
        service: args.service,
        isActive: true,
        lastSeenAt: now,
      });
    }
  },
});
