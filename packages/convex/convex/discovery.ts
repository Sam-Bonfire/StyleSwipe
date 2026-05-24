import { v } from 'convex/values';

import { components } from './_generated/api';
import { Id } from './_generated/dataModel';
import { MutationCtx, mutation, query } from './_generated/server';

/** Swipe action validator — defined here in infrastructure, not in core */
const SwipeActionSchema = v.union(v.literal('like'), v.literal('pass'), v.literal('super'));

const DEFAULT_PAGINATION = { numItems: 100, cursor: null };

// Helper to get style profile
const getStyleProfile = async (ctx: MutationCtx, userId: string) => {
  return await ctx.db
    .query('style_profiles')
    .withIndex('by_user', (q) => q.eq('userId', userId))
    .first();
};

export const recordProductView = mutation({
  args: {
    productId: v.id('products'),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return;

    await ctx.db.insert('events', {
      type: 'view_product',
      userId: identity.subject,
      productId: args.productId,
      isSampled: true,
      timestamp: Date.now(),
    });
  },
});

export const getRecentlyViewed = query({
  args: {
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];

    // 1. First by ID
    let usersRes = await ctx.runQuery(components.auth.api.findMany, {
      model: 'users',
      where: [{ field: '_id', operator: 'eq', value: identity.subject }],
      paginationOpts: DEFAULT_PAGINATION,
    });
    let user = usersRes.page[0];

    // 2. Fallback by Email
    if (!user && identity.email) {
      usersRes = await ctx.runQuery(components.auth.api.findMany, {
        model: 'users',
        where: [{ field: 'email', operator: 'eq', value: identity.email }],
        paginationOpts: DEFAULT_PAGINATION,
      });
      user = usersRes.page[0];
    }

    if (!user) return [];

    const limit = args.limit ?? 10;

    // Fetch recent view events
    const views = await ctx.db
      .query('events')
      .withIndex('by_user_type', (q) =>
        q.eq('userId', user.id || user._id).eq('type', 'view_product'),
      )
      .order('desc')
      .take(limit * 3);

    const uniqueProductIds = new Set<string>();
    const orderedIds: Id<'products'>[] = [];

    for (const view of views) {
      if (view.productId && !uniqueProductIds.has(view.productId)) {
        uniqueProductIds.add(view.productId);
        orderedIds.push(view.productId);
        if (orderedIds.length >= limit) break;
      }
    }

    if (orderedIds.length === 0) return [];

    const products = await Promise.all(orderedIds.map((id) => ctx.db.get(id)));

    return products.filter((p) => p !== null);
  },
});

export const getDiscoveryFeed = query({
  args: {
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return await ctx.db
        .query('products')
        .order('desc')
        .take(args.limit || 20);
    }

    // 1. By ID
    let usersRes = await ctx.runQuery(components.auth.api.findMany, {
      model: 'users',
      where: [{ field: '_id', operator: 'eq', value: identity.subject }],
      paginationOpts: DEFAULT_PAGINATION,
    });
    let user = usersRes.page[0];

    // 2. By Email
    if (!user && identity.email) {
      usersRes = await ctx.runQuery(components.auth.api.findMany, {
        model: 'users',
        where: [{ field: 'email', operator: 'eq', value: identity.email }],
        paginationOpts: DEFAULT_PAGINATION,
      });
      user = usersRes.page[0];
    }

    if (!user) return [];

    const swipes = await ctx.db
      .query('swipes')
      .withIndex('by_user', (q) => q.eq('userId', user.id || user._id))
      .collect();

    const swipedProductIds = new Set(swipes.map((s) => s.productId));

    const products = await ctx.db.query('products').order('desc').take(50);

    const feed = products.filter((p) => !swipedProductIds.has(p._id)).slice(0, args.limit || 20);

    return feed;
  },
});

export const processSwipe = mutation({
  args: {
    productId: v.id('products'),
    action: SwipeActionSchema,
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error('Unauthenticated call to processSwipe');
    }

    const userId = identity.subject;

    const { productId, action } = args;

    const existingSwipe = await ctx.db
      .query('swipes')
      .withIndex('by_user_product', (q) => q.eq('userId', userId).eq('productId', productId))
      .first();

    if (existingSwipe) {
      return { status: 'duplicate', swipeId: existingSwipe._id };
    }

    const swipeId = await ctx.db.insert('swipes', {
      userId: userId,
      productId,
      action,
      timestamp: Date.now(),
    });

    // ---------------------------------------------------------
    // REAL-TIME VECTOR LEARNING
    // ---------------------------------------------------------
    if (action === 'like' || action === 'super') {
      const product = await ctx.db.get(productId);
      if (product && product.embedding) {
        const LEARNING_RATE = action === 'super' ? 0.2 : 0.1;

        const currentProfileDoc = await getStyleProfile(ctx, userId);
        const currentProfile = currentProfileDoc || {
          gender: 'both' as const,
          vibes: [],
          sizes: {},
          budget: { min: 0, max: 20000 },
        };

        const currentVector = currentProfileDoc?.preferenceVector;

        if (!currentVector) {
          const newProfile = {
            ...currentProfile,
            preferenceVector: product.embedding,
          };

          if (currentProfileDoc) {
            await ctx.db.patch(currentProfileDoc._id, {
              preferenceVector: product.embedding,
              lastUpdated: Date.now(),
            });
          } else {
            await ctx.db.insert('style_profiles', {
              userId: userId,
              ...newProfile,
              lastUpdated: Date.now(),
            });
          }
        } else {
          const newVector = currentVector.map((val: number, i: number) => {
            const targetVal = product.embedding![i];
            return val + LEARNING_RATE * (targetVal - val);
          });

          await ctx.db.patch(currentProfileDoc._id, {
            preferenceVector: newVector,
            lastUpdated: Date.now(),
          });
        }
      }
    }

    return { status: 'success', swipeId };
  },
});

export const getUserSwipedIds = query({
  args: {
    userId: v.string(), // Matches Component ID string
  },
  handler: async (ctx, args) => {
    const swipes = await ctx.db
      .query('swipes')
      .withIndex('by_user', (q) => q.eq('userId', args.userId))
      .collect();
    return swipes.map((s) => s.productId);
  },
});
