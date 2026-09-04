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

export const clear = mutation({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query('carts')
      .withIndex('by_user', (q) => q.eq('userId', args.userId))
      .unique();

    if (existing) {
      await ctx.db.patch(existing._id, {
        items: [],
        updatedAt: Date.now(),
      });
    }
  },
});

export const mergeGuestCart = mutation({
  args: {
    userId: v.string(),
    guestItems: v.array(
      v.object({
        productId: v.id('products'),
        quantity: v.number(),
        price: v.number(),
        attributes: v.optional(v.any()),
      })
    ),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query('carts')
      .withIndex('by_user', (q) => q.eq('userId', args.userId))
      .unique();

    const now = Date.now();
    const merged = new Map<string, { productId: typeof args.guestItems[0]['productId']; quantity: number; price: number; attributes?: unknown }>();

    if (existing) {
      for (const it of existing.items) {
        merged.set(it.productId as string, { productId: it.productId, quantity: it.quantity, price: it.price, attributes: it.attributes });
      }
    }
    for (const g of args.guestItems) {
      const key = g.productId as string;
      const prev = merged.get(key);
      if (prev) {
        merged.set(key, { productId: g.productId, quantity: prev.quantity + g.quantity, price: g.price, attributes: g.attributes ?? prev.attributes });
      } else {
        merged.set(key, { productId: g.productId, quantity: g.quantity, price: g.price, attributes: g.attributes });
      }
    }
    const items = Array.from(merged.values());
    if (existing) {
      await ctx.db.patch(existing._id, { items, updatedAt: now });
    } else {
      await ctx.db.insert('carts', { userId: args.userId, items, updatedAt: now });
    }
  },
});
