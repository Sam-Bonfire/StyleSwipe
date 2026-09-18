import type { FilterBuilder, GenericTableInfo } from 'convex/server';

import { v } from 'convex/values';

import { mutation, query } from './_generated/server';

function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 48) || 'board';
}

async function ensureUniqueSlug(
  ctx: { db: { query: (table: string) => { withIndex: (name: string, fn: (q: { eq: (field: string, value: unknown) => unknown }) => unknown) => { unique: () => Promise<{ slug: string } | null> } } } },
  userId: string,
  baseSlug: string,
): Promise<string> {
  let slug = baseSlug;
  let suffix = 1;
   
  while (true) {
     
    const existing = await ctx.db
      .query('boards')
      // @ts-expect-error convex typing
      .withIndex('by_user_slug', (q) => q.eq('userId', userId).eq('slug', slug))
      .unique();
    if (!existing) return slug;
    suffix += 1;
    slug = `${baseSlug}-${suffix}`;
    if (suffix > 99) return `${baseSlug}-${Date.now()}`;
  }
}

type BoardProductsDb = {
  db: {
    get: (id: string) => Promise<Record<string, unknown> | null>;
    query: (table: string) => {
      filter: (
        predicate: (q: FilterBuilder<GenericTableInfo>) => unknown,
      ) => { collect: () => Promise<Array<Record<string, unknown> & { _id: string }>> };
    };
  };
};

async function populateBoardProducts(
  ctx: BoardProductsDb,
  board: { _id: string; _creationTime?: number; userId: string; name: string; slug: string; isSystem?: boolean; createdAt: number; updatedAt: number },
  boardItems: Array<{ productId: string; addedAt: number }>,
): Promise<{
  _id: string;
  _creationTime?: number;
  userId: string;
  name: string;
  slug: string;
  isSystem?: boolean;
  items: Array<{ productId: string; addedAt: number; product: Record<string, unknown> }>;
  createdAt: number;
  updatedAt: number;
}> {
  if (boardItems.length === 0) {
    return { ...board, items: [] };
  }
  const sortedItems = [...boardItems].sort((a, b) => b.addedAt - a.addedAt);
  const productIds = sortedItems.map((item) => item.productId);
  const productsDocs: Array<Record<string, unknown> & { _id: string }> = await ctx.db
    .query('products')
    .filter((q) =>
      productIds.length === 1
        ? q.eq(q.field('_id'), productIds[0])
        : q.or(...productIds.map((id: string) => q.eq(q.field('_id'), id))),
    )
    .collect();

  const productsMap = new Map<string, Record<string, unknown>>(productsDocs.map((p) => [p._id as string, p]));
  const populatedItems = sortedItems
    .map((item) => {
      const product = productsMap.get(item.productId);
      if (!product) return null;
      const { meta, ...rest } = product as Record<string, unknown> & { meta?: Record<string, unknown> };
      let cleanMeta = meta as Record<string, unknown> | undefined;
      if (meta && (meta as Record<string, unknown>).rawAttributes !== undefined) {
        const { rawAttributes: _raw, ...otherMeta } = meta as Record<string, unknown>;
        void _raw;
        cleanMeta = otherMeta;
      }
      return {
        productId: item.productId,
        addedAt: item.addedAt,
        product: {
          ...(rest as Record<string, unknown>),
          ...(cleanMeta ? { meta: cleanMeta } : {}),
        },
      };
    })
    .filter((x): x is { productId: string; addedAt: number; product: Record<string, unknown> } => x !== null);

  return { ...board, items: populatedItems };
}

/**
 * mutation to track when a user taps "Shop on Merchant" for an external product.
 * 1. Logs a high-fidelity "merchant_redirect" event in the events table.
 * 2. Creates/Updates the "Merchant visits" system board for the user.
 */
export const trackMerchantRedirect = mutation({
  args: {
    userId: v.string(),
    productId: v.id('products'),
  },
  handler: async (ctx, args) => {
    const timestamp = Date.now();

    // 1. Logs high-fidelity structured event for analytics
    await ctx.db.insert('events', {
      type: 'merchant_redirect',
      userId: args.userId,
      productId: args.productId,
      isSampled: true, // Sample these events for deep click-through analysis
      timestamp,
      metadata: {
        platformRedirect: true,
      },
    });

    // 2. Add product to the default system board ("Merchant visits")
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
      // Create the default "Merchant visits" board
      boardId = await ctx.db.insert('boards', {
        userId: args.userId,
        name: 'Merchant visits',
        slug: 'merchant-visits',
        isSystem: true,
        createdAt: timestamp,
        updatedAt: timestamp,
      });
      await ctx.db.insert('board_items', { boardId, productId: args.productId, addedAt: timestamp });
    }
  },
});

/**
 * query to fetch the "Merchant visits" system board and populate all product details.
 * Items are returned in reverse chronological order based on redirect timestamp.
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

// =============================================================================
// USER BOARDS (6.1) - Collections
// =============================================================================

export const listUserBoards = query({
  args: { userId: v.string(), includeSystem: v.optional(v.boolean()) },
  handler: async (ctx, args) => {
    const boardsDocs = await ctx.db
      .query('boards')
      .withIndex('by_user', (q) => q.eq('userId', args.userId))
      .collect();

    const filtered = boardsDocs.filter((b) => !b.deletedAt && (args.includeSystem ? true : !b.isSystem));
    const sorted = filtered.sort((a, b) => b.updatedAt - a.updatedAt);

    const counts = await Promise.all(
      sorted.map(async (b) => {
        const items = await ctx.db
          .query('board_items')
          .withIndex('by_board', (q) => q.eq('boardId', b._id))
          .collect();
        const activeItems = items.filter((it) => !it.deletedAt);
        return { board: b, itemCount: activeItems.length };
      }),
    );

    const withPreview = await Promise.all(
      counts.map(async (entry) => {
        if (entry.itemCount === 0) return { ...entry.board, itemCount: 0, previewImage: null as string | null };
        const items = await ctx.db
          .query('board_items')
          .withIndex('by_board', (q) => q.eq('boardId', entry.board._id))
          .collect();
        const sortedItems = items.filter((it) => !it.deletedAt).sort((a, b) => b.addedAt - a.addedAt);
        const firstProductId = sortedItems[0]?.productId;
        if (!firstProductId) return { ...entry.board, itemCount: entry.itemCount, previewImage: null as string | null };
        const product = await ctx.db.get(firstProductId);
        const previewImage = (product as { images?: string[] } | null)?.images?.[0] ?? null;
        return { ...entry.board, itemCount: entry.itemCount, previewImage };
      }),
    );

    return withPreview;
  },
});

export const getBoard = query({
  args: { boardId: v.id('boards'), userId: v.optional(v.string()) },
  handler: async (ctx, args) => {
    const board = await ctx.db.get(args.boardId);
    if (!board || board.deletedAt) return null;
    const boardItems = await ctx.db
      .query('board_items')
      .withIndex('by_board', (q) => q.eq('boardId', board._id))
      .collect();
    const activeItems = boardItems.filter((it) => !it.deletedAt);
    return populateBoardProducts(
      ctx as unknown as BoardProductsDb,
      board as { _id: string; _creationTime?: number; userId: string; name: string; slug: string; isSystem?: boolean; createdAt: number; updatedAt: number },
      activeItems as Array<{ productId: string; addedAt: number }>,
    );
  },
});

export const getBoards = query({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    const boardsDocs = await ctx.db
      .query('boards')
      .withIndex('by_user', (q) => q.eq('userId', args.userId))
      .collect();
    return boardsDocs.filter((b) => !b.deletedAt).sort((a, b) => b.updatedAt - a.updatedAt);
  },
});

export const createBoard = mutation({
  args: { userId: v.string(), name: v.string(), slug: v.optional(v.string()) },
  handler: async (ctx, args) => {
    const name = args.name.trim();
    if (name.length < 1 || name.length > 48) throw new Error('Board name must be 1-48 characters');
    const baseSlug = slugify(args.slug ?? name);
    const slug = await ensureUniqueSlug(ctx as unknown as { db: { query: (t: string) => { withIndex: (n: string, fn: (q: { eq: (f: string, v: unknown) => unknown }) => unknown) => { unique: () => Promise<{ slug: string } | null> } } } }, args.userId, baseSlug);
    const timestamp = Date.now();
    const boardId = await ctx.db.insert('boards', {
      userId: args.userId,
      name,
      slug,
      isSystem: false,
      createdAt: timestamp,
      updatedAt: timestamp,
    });
    return { boardId, slug };
  },
});

export const renameBoard = mutation({
  args: { boardId: v.id('boards'), userId: v.string(), name: v.string(), slug: v.optional(v.string()) },
  handler: async (ctx, args) => {
    const board = await ctx.db.get(args.boardId);
    if (!board || board.deletedAt) throw new Error('Board not found');
    if (board.userId !== args.userId) throw new Error('Unauthorized');
    if (board.isSystem) throw new Error('Cannot rename system board');
    const name = args.name.trim();
    if (name.length < 1 || name.length > 48) throw new Error('Board name must be 1-48 characters');
    let newSlug: string | undefined;
    if (args.slug !== undefined) {
      const base = slugify(args.slug);
      newSlug = await ensureUniqueSlug(ctx as unknown as { db: { query: (t: string) => { withIndex: (n: string, fn: (q: { eq: (f: string, v: unknown) => unknown }) => unknown) => { unique: () => Promise<{ slug: string } | null> } } } }, args.userId, base);
    } else if (name !== board.name) {
      const base = slugify(name);
      if (base !== board.slug) {
        newSlug = await ensureUniqueSlug(ctx as unknown as { db: { query: (t: string) => { withIndex: (n: string, fn: (q: { eq: (f: string, v: unknown) => unknown }) => unknown) => { unique: () => Promise<{ slug: string } | null> } } } }, args.userId, base);
      }
    }
    await ctx.db.patch(args.boardId, {
      name,
      ...(newSlug ? { slug: newSlug } : {}),
      updatedAt: Date.now(),
    });
    return { slug: newSlug ?? board.slug };
  },
});

export const deleteBoard = mutation({
  args: { boardId: v.id('boards'), userId: v.string() },
  handler: async (ctx, args) => {
    const board = await ctx.db.get(args.boardId);
    if (!board || board.deletedAt) throw new Error('Board not found');
    if (board.userId !== args.userId) throw new Error('Unauthorized');
    if (board.isSystem) throw new Error('Cannot delete system board');
    const items = await ctx.db.query('board_items').withIndex('by_board', (q) => q.eq('boardId', args.boardId)).collect();
    for (const item of items) {
      await ctx.db.delete(item._id);
    }
    await ctx.db.patch(args.boardId, { deletedAt: Date.now(), updatedAt: Date.now() });
  },
});

export const addBoardItem = mutation({
  args: { boardId: v.id('boards'), productId: v.id('products') },
  handler: async (ctx, args) => {
    const board = await ctx.db.get(args.boardId);
    if (!board || board.deletedAt) throw new Error('Board not found');
    const existing = await ctx.db
      .query('board_items')
      .withIndex('by_board_product', (q) => q.eq('boardId', args.boardId).eq('productId', args.productId))
      .unique();
    if (existing && !existing.deletedAt) return { alreadyExists: true };
    const timestamp = Date.now();
    if (existing && existing.deletedAt) {
      await ctx.db.patch(existing._id, { addedAt: timestamp, deletedAt: undefined });
    } else {
      await ctx.db.insert('board_items', { boardId: args.boardId, productId: args.productId, addedAt: timestamp });
    }
    await ctx.db.patch(args.boardId, { updatedAt: timestamp });
    return { alreadyExists: false };
  },
});

export const moveBoardItem = mutation({
  args: {
    sourceBoardId: v.id('boards'),
    targetBoardId: v.id('boards'),
    productId: v.id('products'),
  },
  handler: async (ctx, args) => {
    if (args.sourceBoardId === args.targetBoardId) throw new Error('Source and target must differ');
    const sourceBoard = await ctx.db.get(args.sourceBoardId);
    const targetBoard = await ctx.db.get(args.targetBoardId);
    if (!sourceBoard || sourceBoard.deletedAt) throw new Error('Source board not found');
    if (!targetBoard || targetBoard.deletedAt) throw new Error('Target board not found');
    if (sourceBoard.userId !== targetBoard.userId) throw new Error('Boards must belong to same user');

    const sourceItem = await ctx.db
      .query('board_items')
      .withIndex('by_board_product', (q) => q.eq('boardId', args.sourceBoardId).eq('productId', args.productId))
      .unique();
    if (!sourceItem || sourceItem.deletedAt) throw new Error('Item not found in source board');

    const targetExisting = await ctx.db
      .query('board_items')
      .withIndex('by_board_product', (q) => q.eq('boardId', args.targetBoardId).eq('productId', args.productId))
      .unique();
    const timestamp = Date.now();
    if (!targetExisting) {
      await ctx.db.insert('board_items', { boardId: args.targetBoardId, productId: args.productId, addedAt: timestamp });
    } else if (targetExisting.deletedAt) {
      await ctx.db.patch(targetExisting._id, { addedAt: timestamp, deletedAt: undefined });
    } else {
      await ctx.db.patch(targetExisting._id, { addedAt: timestamp });
    }
    await ctx.db.delete(sourceItem._id);
    await ctx.db.patch(args.sourceBoardId, { updatedAt: timestamp });
    await ctx.db.patch(args.targetBoardId, { updatedAt: timestamp });
    return { moved: true };
  },
});
