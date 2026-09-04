import { v } from 'convex/values';
import { mutation, query } from './_generated/server';

export const listByProduct = query({
  args: {
    productId: v.id('products'),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 50;
    const rows = await ctx.db
      .query('reviews')
      .withIndex('by_product', (q) => q.eq('productId', args.productId))
      .order('desc')
      .take(limit);
    // newest first already, but ensure sort by createdAt desc
    rows.sort((a, b) => b.createdAt - a.createdAt);
    return rows;
  },
});

export const getBreakdown = query({
  args: { productId: v.id('products') },
  handler: async (ctx, args) => {
    const rows = await ctx.db
      .query('reviews')
      .withIndex('by_product', (q) => q.eq('productId', args.productId))
      .collect();
    if (rows.length === 0) {
      return { average: 0, count: 0, distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 } };
    }
    const distribution: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    let sum = 0;
    for (const r of rows) {
      sum += r.rating;
      distribution[r.rating] = (distribution[r.rating] ?? 0) + 1;
    }
    return { average: sum / rows.length, count: rows.length, distribution };
  },
});

export const addReview = mutation({
  args: {
    productId: v.id('products'),
    rating: v.number(),
    text: v.string(),
    images: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error('Unauthenticated');
    const userId = identity.subject;

    if (args.rating < 1 || args.rating > 5) throw new Error('Rating must be 1..5');
    if (args.text.trim().length < 3) throw new Error('Review text too short');
    if (args.text.length > 2000) throw new Error('Review text too long');

    const product = await ctx.db.get(args.productId);
    if (!product) throw new Error('Product not found');

    const reviewId = await ctx.db.insert('reviews', {
      productId: args.productId,
      userId,
      rating: Math.round(args.rating),
      text: args.text.trim(),
      images: args.images,
      helpful: 0,
      createdAt: Date.now(),
    });

    // Update denormalized rating/reviewCount on product for fast browsing
    const all = await ctx.db
      .query('reviews')
      .withIndex('by_product', (q) => q.eq('productId', args.productId))
      .collect();
    const avg = all.reduce((s, r) => s + r.rating, 0) / all.length;
    await ctx.db.patch(args.productId, {
      rating: Math.round(avg * 10) / 10,
      reviewCount: all.length,
      updatedAt: Date.now(),
    });

    return reviewId;
  },
});

export const markHelpful = mutation({
  args: { reviewId: v.id('reviews') },
  handler: async (ctx, args) => {
    const review = await ctx.db.get(args.reviewId);
    if (!review) throw new Error('Review not found');
    await ctx.db.patch(args.reviewId, { helpful: (review.helpful ?? 0) + 1 });
    return { helpful: (review.helpful ?? 0) + 1 };
  },
});
