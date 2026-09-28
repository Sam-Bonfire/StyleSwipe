import { processSwipe as processSwipeUseCase } from '@app/core/discovery/application/ProcessSwipe';
import { v } from 'convex/values';
import { Effect } from 'effect';

import { components } from './_generated/api';
import { Id } from './_generated/dataModel';
import { MutationCtx, QueryCtx, mutation, query } from './_generated/server';
import { makeSwipeRepository } from './layers';

/** Swipe action validator — defined here in infrastructure, not in core */
const SwipeActionSchema = v.union(v.literal('like'), v.literal('pass'), v.literal('super'));

const DEFAULT_PAGINATION = { numItems: 100, cursor: null };

// Helper to get style profile
const getStyleProfile = async (ctx: QueryCtx | MutationCtx, userId: string) => {
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
    partnerId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error('Unauthenticated call to processSwipe');
    }

    const userId = identity.subject;
    const { productId, action, partnerId } = args;

    // Inputs the server owns: current preference vector + product embedding.
    // Deduplication, mutual-match, displacement, and profile persistence
    // all live in the core use case; this adapter only provides the repo.
    const profile = await getStyleProfile(ctx, userId);
    const embeddingDoc = await ctx.db
      .query('product_embeddings')
      .withIndex('by_productId', (q) => q.eq('productId', productId))
      .first();
    const productEmbedding = embeddingDoc?.embeddingVersions?.v1 as number[] | undefined;

    const result = await Effect.runPromise(
      processSwipeUseCase({
        userId,
        productId: productId as string,
        action,
        timestamp: Date.now(),
        userPreferenceVector: profile?.preferenceVector as number[] | undefined,
        productEmbedding,
        partnerId,
      }).pipe(Effect.provide(makeSwipeRepository(ctx))),
    );

    return {
      status: result.duplicate ? ('duplicate' as const) : ('success' as const),
      swipeId: result.swipeId,
      isMutualMatch: result.isMutualMatch ?? false,
    };
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

export const getPartnerLikes = query({
  args: {
    partnerId: v.string(),
  },
  handler: async (ctx, args) => {
    const swipes = await ctx.db
      .query('swipes')
      .withIndex('by_user', (q) => q.eq('userId', args.partnerId))
      .filter((q) => q.or(q.eq(q.field('action'), 'like'), q.eq(q.field('action'), 'super')))
      .collect();
    return swipes.map((s) => s.productId);
  },
});

export const getCalibrationFeed = query({
  args: {
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return await ctx.db.query('products').order('desc').take(args.limit || 20);
    }
    const userId = identity.subject;
    const profile = await getStyleProfile(ctx, userId);
    
    // Fetch swipes to exclude
    const swipes = await ctx.db
      .query('swipes')
      .withIndex('by_user', (q) => q.eq('userId', userId))
      .collect();
    const swipedProductIds = new Set(swipes.map((s) => s.productId));

    // Diverse calibration fetch
    // Note: A true production calibration would fetch randomly across categories.
    // For this MVP, we fetch recent items and filter by the user's gender preference to build the initial batch.
    const productQuery = ctx.db.query('products').order('desc');
    const allProducts = await productQuery.take(100);
    
    let feed = allProducts.filter((p) => !swipedProductIds.has(p._id));
    if (profile?.gender && profile.gender !== 'both') {
      feed = feed.filter(p => p.gender === profile.gender || p.gender === 'unisex');
    }
    
    return feed.slice(0, args.limit || 10);
  }
});
