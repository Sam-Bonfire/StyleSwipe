import { v } from 'convex/values';

import { components } from './_generated/api';
import { mutation } from './_generated/server';
import { getAuth } from './auth';

const DEFAULT_PAGINATION = { numItems: 100, cursor: null };

// Helper to get style profile
const getStyleProfile = async (ctx: any, userId: string) => {
  return await ctx.db
    .query('styleProfiles')
    .withIndex('by_user', (q: any) => q.eq('userId', userId))
    .first();
};

export const syncBatch = mutation({
  args: {
    swipes: v.array(
      v.object({
        productId: v.id('products'),
        action: v.union(v.literal('like'), v.literal('pass'), v.literal('super')),
        timestamp: v.number(),
      }),
    ),
    summary: v.optional(
      v.object({
        period: v.string(),
        granularity: v.string(),
        summary: v.any(),
        centroidShift: v.array(v.float64()),
        hash: v.string(),
        createdAt: v.number(),
      }),
    ),
    vectorUpdate: v.optional(
      v.object({
        v1: v.optional(v.array(v.float64())),
        v2: v.optional(v.array(v.float64())),
        activeDNA: v.optional(v.string()),
      }),
    ),
    authToken: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    let identity = await ctx.auth.getUserIdentity();

    // Fallback: Manual Auth for Background Worker
    if (!identity && args.authToken) {
      const auth = getAuth(ctx);
      // Better Auth session check
      const session = await auth.api.getSession({
        headers: new Headers({ Authorization: `Bearer ${args.authToken}` }),
      });
      if (session?.user) {
        identity = {
          subject: session.user.id,
          email: session.user.email,
          issuer: 'better-auth',
          tokenIdentifier: session.user.id,
        };
      }
    }

    if (!identity) {
      throw new Error('Unauthenticated call to syncBatch');
    }

    // Try getting user from Component
    let user = null;

    // Optimistic lookup by ID
    const usersByIdRes = await ctx.runQuery(components.auth.api.findMany, {
      model: 'users',
      where: [{ field: 'id', operator: 'eq', value: identity.subject }],
      paginationOpts: DEFAULT_PAGINATION,
    });
    user = usersByIdRes.page[0];

    if (!user && identity.email) {
      // Fallback by email
      const usersByEmailRes = await ctx.runQuery(components.auth.api.findMany, {
        model: 'users',
        where: [{ field: 'email', operator: 'eq', value: identity.email }],
        paginationOpts: DEFAULT_PAGINATION,
      });
      user = usersByEmailRes.page[0];
    }

    if (!user) {
      throw new Error('User not found');
    }

    const realUserId = (user as any).id || (user as any)._id;

    // 1. Insert Raw Swipes
    if (args.swipes.length > 0) {
      for (const swipe of args.swipes) {
        await ctx.db.insert('swipes', {
          userId: realUserId,
          productId: swipe.productId,
          action: swipe.action,
          timestamp: swipe.timestamp,
        });
      }
    }

    // 2. Insert Summary
    if (args.summary) {
      const existing = await ctx.db
        .query('weeklySummaries')
        .withIndex('by_user_period', (q) =>
          q.eq('userId', realUserId).eq('period', args.summary!.period),
        )
        .first();

      if (!existing) {
        await ctx.db.insert('weeklySummaries', {
          userId: realUserId,
          ...args.summary,
        });
      }
    }

    // 3. Update User Vector DNA in StyleProfiles
    if (args.vectorUpdate) {
      const currentProfileDoc = await getStyleProfile(ctx, realUserId);

      const currentProfile = currentProfileDoc || {
        gender: 'both',
        vibes: [],
        sizes: {},
        budget: { min: 0, max: 1000 },
      };

      let newDna = currentProfile.dna || {};

      if (args.vectorUpdate.v1) {
        newDna = { ...newDna, v1: args.vectorUpdate.v1 };
      }
      if (args.vectorUpdate.v2) {
        newDna = { ...newDna, v2: args.vectorUpdate.v2 };
      }

      const updates = {
        dna: newDna,
        activeDNA: args.vectorUpdate.activeDNA || currentProfile.activeDNA || 'v1',
        lastUpdated: Date.now(),
      };

      if (currentProfileDoc) {
        await ctx.db.patch(currentProfileDoc._id, updates);
      } else {
        await ctx.db.insert('styleProfiles', {
          userId: realUserId,
          ...currentProfile,
          ...updates,
        });
      }
    }

    return { success: true, processedSwipes: args.swipes.length };
  },
});
