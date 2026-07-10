import { v } from 'convex/values';

import { query, mutation, action } from './_generated/server';
import { api } from './_generated/api';

function projectProduct(p: any) {
  if (!p) return p;
  const { embedding, embeddingVersions, meta, ...rest } = p;
  let cleanMeta = meta;
  if (meta && meta.rawAttributes !== undefined) {
    const { rawAttributes, ...otherMeta } = meta;
    cleanMeta = otherMeta;
  }
  return {
    ...rest,
    ...(cleanMeta ? { meta: cleanMeta } : {}),
  };
}

export const getById = query({
  args: { id: v.id('products') },
  handler: async (ctx, args) => {
    return projectProduct(await ctx.db.get(args.id));
  },
});

export const get = getById;

export const getByCategory = query({
  args: { category: v.string(), limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const products = await ctx.db
      .query('products')
      .withIndex('by_category', (q) => q.eq('category', args.category))
      .take(args.limit ?? 50);
    return products.map(projectProduct);
  },
});

export const getByCategoryAndPrice = query({
  args: {
    category: v.string(),
    minPrice: v.number(),
    maxPrice: v.number(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const products = await ctx.db
      .query('products')
      .withIndex('by_category_price', (q) =>
        q.eq('category', args.category).gte('price', args.minPrice).lte('price', args.maxPrice),
      )
      .take(args.limit ?? 50);
    return products.map(projectProduct);
  },
});

export const getByBrand = query({
  args: { brand: v.string(), limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const products = await ctx.db
      .query('products')
      .withIndex('by_brand', (q) => q.eq('brand', args.brand))
      .take(args.limit ?? 50);
    return products.map(projectProduct);
  },
});

export const searchByTitle = query({
  args: {
    query: v.string(),
    brand: v.optional(v.string()),
    category: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    let q = ctx.db
      .query('products')
      .withSearchIndex('search_title', (q) => q.search('title', args.query));

    if (args.brand) {
      q = q.filter((q) => q.eq(q.field('brand'), args.brand));
    }
    if (args.category) {
      q = q.filter((q) => q.eq(q.field('category'), args.category));
    }

    const products = await q.take(10);
    return products.map(projectProduct);
  },
});

export const findSimilar = action({
  args: {
    embedding: v.array(v.float64()),
    limit: v.optional(v.number()),
    brand: v.optional(v.string()),
    category: v.optional(v.string()),
  },
  handler: async (ctx, args): Promise<any> => {
    const { embedding, limit = 10 } = args;

    // Perform vector search
    // Conditionally apply filter only if needed
    const searchOptions: any = {
      vector: embedding,
      limit,
    };

    if (args.brand || args.category) {
      searchOptions.filter = (q: any) => {
        const filters: any[] = [];
        if (args.brand) filters.push(q.eq('brand', args.brand));
        if (args.category) filters.push(q.eq('category', args.category));

        if (filters.length === 1) return filters[0];
        return filters.reduce((acc, curr) => q.and(acc, curr));
      };
    }

    const results = await ctx.vectorSearch('product_embeddings', 'by_embedding_v1', searchOptions);

    // Fetch full product details
    const productIds = await ctx.runQuery(api.helpers.getProductIdsFromEmbeddings, { ids: results.map((r) => r._id as any) });
    const products = await ctx.runQuery(api.helpers.getProductsByIds, { ids: productIds });

    return products;
  },
});

export const create = mutation({
  args: {
    brand: v.string(),
    title: v.string(),
    price: v.number(),
    mrp: v.number(),
    category: v.string(),
    images: v.array(v.string()),
    attributes: v.optional(
      v.object({
        color: v.optional(v.string()),
        size: v.optional(v.array(v.string())),
        material: v.optional(v.string()),
        fit: v.optional(v.string()),
        occasion: v.optional(v.array(v.string())),
        care: v.optional(v.string()),
        origin: v.optional(v.string()),
        style: v.optional(v.string()),
        sleeve: v.optional(v.string()),
        neck: v.optional(v.string()),
        season: v.optional(v.string()),
        collection: v.optional(v.string()),
      }),
    ),

    meta: v.optional(v.any()), // Loose object
    // createdAt removed
    updatedAt: v.number(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert('products', args);
  },
});

export const update = mutation({
  args: {
    id: v.id('products'),
    brand: v.optional(v.string()),
    title: v.optional(v.string()),
    price: v.optional(v.number()),
    mrp: v.optional(v.number()),
    category: v.optional(v.string()),
    images: v.optional(v.array(v.string())),
    attributes: v.optional(v.any()), // Simplified for patch

    meta: v.optional(v.any()),
    updatedAt: v.number(),
  },
  handler: async (ctx, args) => {
    const { id, ...updates } = args;
    await ctx.db.patch(id, updates);
  },
});

export const updateEmbedding = mutation({
  args: {
    id: v.id('products'),
    embedding: v.array(v.float64()),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db.query('product_embeddings').withIndex('by_productId', q => q.eq('productId', args.id)).first();
    if (existing) {
      await ctx.db.patch(existing._id, { embeddingVersions: { v1: args.embedding }, updatedAt: Date.now() });
    }
  },
});

export const remove = mutation({
  args: { id: v.id('products') },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
  },
});

// Removed getProductsByIds from here to avoid circular dependency
// Use api.helpers.getProductsByIds instead

export const getLatest = query({
  args: {
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 10;
    const products = await ctx.db.query('products').order('desc').take(limit);
    return products.map(projectProduct);
  },
});
