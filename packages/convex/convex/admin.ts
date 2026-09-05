import { paginationOptsValidator } from 'convex/server';
import { v } from 'convex/values';

import { components } from './_generated/api';
import { query, mutation } from './_generated/server';
import { requireCoreAdmin } from './permissions';

// =============================================================================
// ADMIN DASHBOARD QUERIES
// =============================================================================

export const getStats = query({
  args: {},
  handler: async (ctx) => {
    await requireCoreAdmin(ctx);

    // Fast queries with limits to avoid timeout
    const [activeJobs, products, usersRes] = await Promise.all([
      ctx.db
        .query('scrape_jobs')
        .withIndex('by_status', (q) => q.eq('status', 'processing'))
        .take(100),
      ctx.db.query('products').take(1001),
      ctx.runQuery(components.auth.api.findMany, {
        model: 'users',
        where: [],
        paginationOpts: { numItems: 5, cursor: null },
      }),
    ]);

    return {
      totalUsers: usersRes.page.length,
      totalProducts: products.length,
      activeJobs: activeJobs.length,
      recentUsers: usersRes.page,
    };
  },
});

export const getScrapedProducts = query({
  args: {
    paginationOpts: paginationOptsValidator,
    filters: v.optional(
      v.object({
        brand: v.optional(v.string()),
        category: v.optional(v.string()),
      }),
    ),
  },
  handler: async (ctx, args) => {
    await requireCoreAdmin(ctx);
    if (args.filters?.brand) {
      return await ctx.db
        .query('products')
        .withIndex('by_brand', (q) => q.eq('brand', args.filters!.brand!))
        .paginate(args.paginationOpts);
    }

    if (args.filters?.category) {
      return await ctx.db
        .query('products')
        .withIndex('by_category', (q) => q.eq('category', args.filters!.category!))
        .paginate(args.paginationOpts);
    }

    return await ctx.db
      .query('products')
      // .withIndex("by_created") // Index removed
      .order('desc')
      .paginate(args.paginationOpts);
  },
});

export const getScrapingJobs = query({
  args: {
    paginationOpts: paginationOptsValidator,
    status: v.optional(
      v.union(v.literal('pending'), v.literal('processing'), v.literal('completed'), v.literal('failed')),
    ),
  },
  handler: async (ctx, args) => {
    await requireCoreAdmin(ctx);
    const status = args.status;
    if (status) {
      return await ctx.db
        .query('scrape_jobs')
        .withIndex('by_status', (q) => q.eq('status', status))
        .paginate(args.paginationOpts);
    }

    return await ctx.db
      .query('scrape_jobs')
      .withIndex('by_created')
      .order('desc')
      .paginate(args.paginationOpts);
  },
});

// =============================================================================
// ADMIN MUTATIONS
// =============================================================================

export const retriggerScrape = mutation({
  args: { productId: v.id('products') },
  handler: async (ctx, args) => {
    await requireCoreAdmin(ctx);
    const product = await ctx.db.get(args.productId);
    if (!product) throw new Error('Product not found');

    // Logic to schedule a scrape
    // For now, we'll just create a new scrape job
    await ctx.db.insert('scrape_jobs', {
      type: 'single',
      query: product.meta?.url || '', // Assuming URL is backed up in meta
      status: 'pending',
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    return { success: true };
  },
});

export const searchProducts = query({
  args: { query: v.string() },
  handler: async (ctx, args) => {
    await requireCoreAdmin(ctx);

    const searchLower = args.query.toLowerCase();

    // Search by brand first (indexed)
    const brandResults = await ctx.db
      .query('products')
      .withIndex('by_brand')
      .filter((q) => q.or(
        q.eq(q.field('brand'), searchLower),
        q.gte(q.field('brand'), searchLower)
      ))
      .take(50);

    // Search all products for title match (fallback)
    const allProducts = await ctx.db
      .query('products')
      .take(200);

    const titleResults = allProducts.filter(p =>
      p.title?.toLowerCase().includes(searchLower) ||
      p.brand?.toLowerCase().includes(searchLower)
    );

    // Combine and deduplicate
    const seen = new Set<string>();
    const combined = [...brandResults, ...titleResults].filter(p => {
      if (seen.has(p._id)) return false;
      seen.add(p._id);
      return true;
    });

    return combined.slice(0, 50);
  },
});
