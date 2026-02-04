import { v } from 'convex/values';

import { mutation, query } from './_generated/server';

export const getCart = query({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    const cart = await ctx.db
      .query('carts')
      .withIndex('by_user', (q) => q.eq('userId', args.userId))
      .unique();
    return cart;
  },
});

export const saveCart = mutation({
  args: {
    userId: v.string(),
    items: v.array(
      v.object({
        productId: v.id('products'),
        quantity: v.number(),
        price: v.number(),
        attributes: v.optional(v.any()),
      }),
    ),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query('carts')
      .withIndex('by_user', (q) => q.eq('userId', args.userId))
      .unique();

    if (existing) {
      await ctx.db.patch(existing._id, {
        items: args.items,
        updatedAt: Date.now(),
      });
    } else {
      await ctx.db.insert('carts', {
        userId: args.userId,
        items: args.items,
        updatedAt: Date.now(),
      });
    }
  },
});
