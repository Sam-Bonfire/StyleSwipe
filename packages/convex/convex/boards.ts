import { v } from 'convex/values';

import { mutation, query } from './_generated/server';

/**
 * mutation to track when a user clicks "Purchase" on an external marketplace item.
 * 1. Creates/Updates the "Your orders" system board for the user.
 * 2. Logs a high-fidelity "purchase_click" event in the events table.
 * 3. Removes the purchased item from the user's cart.
 */
export const trackPurchaseClick = mutation({
  args: {
    userId: v.string(),
    productId: v.id('products'),
  },
  handler: async (ctx, args) => {
    const timestamp = Date.now();

    // 1. Logs high-fidelity structured event for analytics
    await ctx.db.insert('events', {
      type: 'purchase_click',
      userId: args.userId,
      productId: args.productId,
      isSampled: true, // Sample these events for deep click-through analysis
      timestamp,
      metadata: {
        platformRedirect: true,
      },
    });

    // 2. Add product to the default system board ("Your orders")
    const existingBoard = await ctx.db
      .query('boards')
      .withIndex('by_user_system', (q) => q.eq('userId', args.userId).eq('isSystem', true))
      .unique();

    let boardId = existingBoard?._id;
    if (existingBoard) {
      const existingItem = await ctx.db
        .query('board_items')
        .withIndex('by_board_product', (q) => q.eq('boardId', existingBoard._id).eq('productId', args.productId))
        .unique();
        
      if (existingItem) {
        await ctx.db.patch(existingItem._id, { addedAt: timestamp });
      } else {
        await ctx.db.insert('board_items', { boardId: existingBoard._id, productId: args.productId, addedAt: timestamp });
      }
      await ctx.db.patch(existingBoard._id, { updatedAt: timestamp });
    } else {
      // Create the default "Your orders" board
      boardId = await ctx.db.insert('boards', {
        userId: args.userId,
        name: 'Your orders',
        slug: 'your-orders',
        isSystem: true,
        createdAt: timestamp,
        updatedAt: timestamp,
      });
      await ctx.db.insert('board_items', { boardId, productId: args.productId, addedAt: timestamp });
    }

    // 3. Remove the item from the user's shopping cart
    const cart = await ctx.db
      .query('carts')
      .withIndex('by_user', (q) => q.eq('userId', args.userId))
      .unique();

    if (cart) {
      const remainingItems = cart.items.filter((item) => item.productId !== args.productId);
      await ctx.db.patch(cart._id, {
        items: remainingItems,
        updatedAt: timestamp,
      });
    }
  },
});

/**
 * query to fetch the "Your orders" system board and populate all product details.
 * Orders are returned in reverse chronological order based on purchase timestamp.
 */
export const getSystemBoard = query({
  args: {
    userId: v.string(),
  },
  handler: async (ctx, args) => {
    const board = await ctx.db
      .query('boards')
      .withIndex('by_user_system', (q) => q.eq('userId', args.userId).eq('isSystem', true))
      .unique();

    if (!board) {
      return {
        items: [],
      };
    }

    const boardItems = await ctx.db
      .query('board_items')
      .withIndex('by_board', (q) => q.eq('boardId', board._id))
      .collect();

    if (boardItems.length === 0) return { items: [] };

    // Sort items in reverse chronological order (most recently clicked first)
    const sortedItems = boardItems.sort((a, b) => b.addedAt - a.addedAt);

    // Resolve full product documents
    const productIds = sortedItems.map((item) => item.productId);

    // Batch query all products
    const productsDocs = await ctx.db
      .query('products')
      .filter((q) =>
        productIds.length === 1
          ? q.eq(q.field('_id'), productIds[0])
          : q.or(...productIds.map((id) => q.eq(q.field('_id'), id)))
      )
      .collect();

    // Map by ID for quick O(1) resolution
    const productsMap = new Map(productsDocs.map((p) => [p._id, p]));

    const populatedItems = sortedItems
      .map((item) => {
        const product = productsMap.get(item.productId);
        if (!product) return null;

        // Strip embedding fields to optimize response payloads (matches projectProduct pattern)
        const { meta, ...rest } = product;

        let cleanMeta = meta;
        if (meta && meta.rawAttributes !== undefined) {
          const { rawAttributes, ...otherMeta } = meta;
          cleanMeta = otherMeta;
        }

        return {
          productId: item.productId,
          addedAt: item.addedAt,
          product: {
            ...rest,
            ...(cleanMeta ? { meta: cleanMeta } : {}),
          },
        };
      })
      .filter(Boolean);

    return {
      _id: board._id,
      _creationTime: board._creationTime,
      userId: board.userId,
      name: board.name,
      slug: board.slug,
      isSystem: board.isSystem,
      items: populatedItems,
      createdAt: board.createdAt,
      updatedAt: board.updatedAt,
    };
  },
});

/**
 * query to fetch a generic board by ID and populate all product details.
 */
export const getBoardById = query({
  args: {
    id: v.id('boards'),
  },
  handler: async (ctx, args) => {
    const board = await ctx.db.get(args.id);

    if (!board) {
      return null;
    }

    const boardItems = await ctx.db
      .query('board_items')
      .withIndex('by_board', (q) => q.eq('boardId', board._id))
      .collect();

    if (boardItems.length === 0) {
      return {
        ...board,
        items: [],
      };
    }

    const sortedItems = boardItems.sort((a, b) => b.addedAt - a.addedAt);
    const productIds = sortedItems.map((item) => item.productId);

    const productsDocs = await ctx.db
      .query('products')
      .filter((q) =>
        productIds.length === 1
          ? q.eq(q.field('_id'), productIds[0])
          : q.or(...productIds.map((id) => q.eq(q.field('_id'), id)))
      )
      .collect();

    const productsMap = new Map(productsDocs.map((p) => [p._id, p]));

    const populatedItems = sortedItems
      .map((item) => {
        const product = productsMap.get(item.productId);
        if (!product) return null;

        const { meta, ...rest } = product;

        let cleanMeta = meta;
        if (meta && meta.rawAttributes !== undefined) {
          const { rawAttributes, ...otherMeta } = meta;
          cleanMeta = otherMeta;
        }

        return {
          productId: item.productId,
          addedAt: item.addedAt,
          product: {
            ...rest,
            ...(cleanMeta ? { meta: cleanMeta } : {}),
          },
        };
      })
      .filter(Boolean);

    return {
      _id: board._id,
      _creationTime: board._creationTime,
      userId: board.userId,
      name: board.name,
      slug: board.slug,
      isSystem: board.isSystem,
      items: populatedItems,
      createdAt: board.createdAt,
      updatedAt: board.updatedAt,
    };
  },
});

/**
 * mutation to remove an item from a generic board.
 */
export const removeBoardItem = mutation({
  args: {
    boardId: v.id('boards'),
    productId: v.id('products'),
  },
  handler: async (ctx, args) => {
    const existingItem = await ctx.db
      .query('board_items')
      .withIndex('by_board_product', (q) => q.eq('boardId', args.boardId).eq('productId', args.productId))
      .unique();

    if (existingItem) {
      await ctx.db.delete(existingItem._id);
      await ctx.db.patch(args.boardId, { updatedAt: Date.now() });
    }
  },
});

/**
 * mutation to toggle a product inside the user's Wishlist system board.
 * If the item is already present, it is removed; otherwise, it is added.
 */
export const toggleWishlist = mutation({
  args: {
    userId: v.string(),
    productId: v.id('products'),
  },
  handler: async (ctx, args) => {
    const timestamp = Date.now();
    const existingBoard = await ctx.db
      .query('boards')
      .withIndex('by_user_slug', (q) => q.eq('userId', args.userId).eq('slug', 'wishlist'))
      .unique();

    let boardId = existingBoard?._id;
    if (existingBoard) {
      const existingItem = await ctx.db
        .query('board_items')
        .withIndex('by_board_product', (q) => q.eq('boardId', existingBoard._id).eq('productId', args.productId))
        .unique();

      if (existingItem) {
        // Remove from wishlist
        await ctx.db.delete(existingItem._id);
        await ctx.db.patch(existingBoard._id, { updatedAt: timestamp });
        return { isWishlisted: false };
      } else {
        // Add to wishlist
        await ctx.db.insert('board_items', { boardId: existingBoard._id, productId: args.productId, addedAt: timestamp });
        await ctx.db.patch(existingBoard._id, { updatedAt: timestamp });
        return { isWishlisted: true };
      }
    } else {
      // Create new wishlist system board
      boardId = await ctx.db.insert('boards', {
        userId: args.userId,
        name: 'Wishlist',
        slug: 'wishlist',
        isSystem: true,
        createdAt: timestamp,
        updatedAt: timestamp,
      });
      await ctx.db.insert('board_items', { boardId, productId: args.productId, addedAt: timestamp });
      return { isWishlisted: true };
    }
  },
});

/**
 * query to fetch the user's populated Wishlist system board items in reverse chronological order.
 */
export const getWishlist = query({
  args: {
    userId: v.string(),
  },
  handler: async (ctx, args) => {
    const board = await ctx.db
      .query('boards')
      .withIndex('by_user_slug', (q) => q.eq('userId', args.userId).eq('slug', 'wishlist'))
      .unique();

    if (!board) {
      return {
        items: [],
      };
    }

    const boardItems = await ctx.db
      .query('board_items')
      .withIndex('by_board', (q) => q.eq('boardId', board._id))
      .collect();

    if (boardItems.length === 0) return { items: [] };

    // Sort items in reverse chronological order (most recently wishlisted first)
    const sortedItems = boardItems.sort((a, b) => b.addedAt - a.addedAt);

    // Resolve full product documents
    const productIds = sortedItems.map((item) => item.productId);

    // Batch query all products
    const productsDocs = await ctx.db
      .query('products')
      .filter((q) =>
        productIds.length === 1
          ? q.eq(q.field('_id'), productIds[0])
          : q.or(...productIds.map((id) => q.eq(q.field('_id'), id)))
      )
      .collect();

    // Map by ID for quick O(1) resolution
    const productsMap = new Map(productsDocs.map((p) => [p._id, p]));

    const populatedItems = sortedItems
      .map((item) => {
        const product = productsMap.get(item.productId);
        if (!product) return null;

        // Strip embedding fields to optimize response payloads (matches projectProduct pattern)
        const { meta, ...rest } = product;

        let cleanMeta = meta;
        if (meta && meta.rawAttributes !== undefined) {
          const { rawAttributes, ...otherMeta } = meta;
          cleanMeta = otherMeta;
        }

        return {
          productId: item.productId,
          addedAt: item.addedAt,
          product: {
            ...rest,
            ...(cleanMeta ? { meta: cleanMeta } : {}),
          },
        };
      })
      .filter(Boolean);

    return {
      _id: board._id,
      _creationTime: board._creationTime,
      userId: board.userId,
      name: board.name,
      slug: board.slug,
      isSystem: board.isSystem,
      items: populatedItems,
      createdAt: board.createdAt,
      updatedAt: board.updatedAt,
    };
  },
});
