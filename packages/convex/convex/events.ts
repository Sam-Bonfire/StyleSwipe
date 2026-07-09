import { v } from 'convex/values';

import { query, mutation } from './_generated/server';

export const create = mutation({
  args: {
    type: v.string(),
    userId: v.optional(v.string()),
    productId: v.optional(v.id('products')),
    variant: v.optional(v.string()),
    isSampled: v.boolean(),
    metadata: v.optional(v.any()), // Loose object
    timestamp: v.number(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert('events', args);
  },
});

export const track = create; // Alias

export const getByType = query({
  args: { type: v.string(), limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    return await ctx.db
      .query('events')
      .withIndex('by_type', (q) => q.eq('type', args.type))
      .order('desc')
      .take(args.limit ?? 100);
  },
});

export const getByUserAndType = query({
  args: { userId: v.string(), type: v.string(), limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    return await ctx.db
      .query('events')
      .withIndex('by_user_type', (q) => q.eq('userId', args.userId).eq('type', args.type))
      .order('desc')
      .take(args.limit ?? 100);
  },
});

export const getSampledByType = query({
  args: { type: v.string(), limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    return await ctx.db
      .query('events')
      .withIndex('by_type', (q) => q.eq('type', args.type))
      .filter((q) => q.eq(q.field('isSampled'), true))
      .order('desc')
      .take(args.limit ?? 100);
  },
});

export const getFunnelMetrics = query({
  args: {
    timeRange: v.union(v.literal('7_days'), v.literal('30_days'), v.literal('all_time')),
    variant: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    let threshold = 0;
    const now = Date.now();
    if (args.timeRange === '7_days') threshold = now - 7 * 24 * 60 * 60 * 1000;
    else if (args.timeRange === '30_days') threshold = now - 30 * 24 * 60 * 60 * 1000;

    const filterWithVariant = (q: any) => {
      if (args.variant) {
        return q.and(
          q.gte(q.field('timestamp'), threshold),
          q.eq(q.field('variant'), args.variant)
        );
      }
      return q.gte(q.field('timestamp'), threshold);
    };

    const startedEvents = await ctx.db
      .query('events')
      .withIndex('by_type', (q) => q.eq('type', 'onboarding_started'))
      .filter(filterWithVariant)
      .collect();

    const stepEvents = await ctx.db
      .query('events')
      .withIndex('by_type', (q) => q.eq('type', 'onboarding_step_completed'))
      .filter(filterWithVariant)
      .collect();

    const completedEvents = await ctx.db
      .query('events')
      .withIndex('by_type', (q) => q.eq('type', 'onboarding_completed'))
      .filter(filterWithVariant)
      .collect();

    const stepsCount: Record<number, number> = {};
    for (const ev of stepEvents) {
      if (ev.metadata && typeof ev.metadata.step === 'number') {
        const s = ev.metadata.step;
        stepsCount[s] = (stepsCount[s] || 0) + 1;
      }
    }

    return {
      started: startedEvents.length,
      steps: stepsCount,
      completed: completedEvents.length,
    };
  },
});

export const getMacroFunnelMetrics = query({
  args: {
    timeRange: v.union(v.literal('7_days'), v.literal('30_days'), v.literal('all_time')),
    variant: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    let threshold = 0;
    const now = Date.now();
    if (args.timeRange === '7_days') threshold = now - 7 * 24 * 60 * 60 * 1000;
    else if (args.timeRange === '30_days') threshold = now - 30 * 24 * 60 * 60 * 1000;

    const filterWithVariant = (q: any) => {
      if (args.variant) {
        return q.and(
          q.gte(q.field('timestamp'), threshold),
          q.eq(q.field('variant'), args.variant)
        );
      }
      return q.gte(q.field('timestamp'), threshold);
    };

    const countEvent = async (type: string) => {
      const events = await ctx.db
        .query('events')
        .withIndex('by_type', (q) => q.eq('type', type))
        .filter(filterWithVariant)
        .collect();
      return events.length;
    };

    const onboardingCompleted = await countEvent('onboarding_completed');
    const productViewed = await countEvent('product_viewed');
    const productSwiped = await countEvent('product_swiped');
    const addedToCart = await countEvent('added_to_cart');
    const checkoutInitiated = await countEvent('checkout_initiated');

    return {
      onboardingCompleted,
      productViewed,
      productSwiped,
      addedToCart,
      checkoutInitiated,
    };
  },
});

export const getAvailableVariants = query({
  args: {},
  handler: async (ctx) => {
    // Convex doesn't have a distinct query, so we fetch the most recent events and collect unique variants
    const recentEvents = await ctx.db.query('events').order('desc').take(1000);
    const variants = new Set<string>();
    for (const ev of recentEvents) {
      if (ev.variant) {
        variants.add(ev.variant);
      }
    }
    return Array.from(variants);
  }
});
