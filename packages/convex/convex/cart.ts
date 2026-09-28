import { mergeGuestCarts } from '@app/core/commerce/application/ManageCart';
import { v } from 'convex/values';
import { Effect } from 'effect';

import { mutation, query } from './_generated/server';
import { makeCartRepository } from './layers';

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
    // Merge rules live in the core use case; this adapter only
    // translates Convex values to domain input and provides the repo.
    const guestItems = args.guestItems.map((g) => ({
      productId: g.productId as string,
      quantity: g.quantity,
      price: g.price,
      ...(g.attributes && typeof g.attributes === 'object' && !Array.isArray(g.attributes)
        ? { selectedAttributes: g.attributes as Record<string, string> }
        : {}),
    }));
    await Effect.runPromise(
      mergeGuestCarts(args.userId, guestItems).pipe(Effect.provide(makeCartRepository(ctx))),
    );
  },
});
