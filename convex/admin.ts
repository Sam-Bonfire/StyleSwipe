import { paginationOptsValidator } from 'convex/server';
import { v } from 'convex/values';

import { components } from './_generated/api';
import { query, mutation } from './_generated/server';

const DEFAULT_PAGINATION = { numItems: 100, cursor: null };

// =============================================================================
// ADMIN DASHBOARD QUERIES
// =============================================================================

export const getStats = query({
  args: {},
  handler: async (ctx) => {
    // Fetch recent users from Component
    const usersRes = await ctx.runQuery(components.auth.api.findMany, {
      model: 'users',
      sortBy: { field: 'createdAt', direction: 'desc' },
      limit: 5,
      paginationOpts: { numItems: 5, cursor: null },
    });
    const recentUsers = usersRes.page;

    const activeJobs = await ctx.db
      .query('scrape_jobs')
      .withIndex('by_status', (q) => q.eq('status', 'processing'))
      .collect();

    // Approximate total users (Component doesn't expose total count easily)
    const totalUsersRes = await ctx.runQuery(components.auth.api.findMany, {
      model: 'users',
      limit: 100, // Cap at 100 for now
      paginationOpts: DEFAULT_PAGINATION,
    });

    const totalUsers = totalUsersRes.page.length;

    return {
      totalUsers: totalUsers + (totalUsersRes.continueCursor ? '+' : ''),
      totalProducts: (await ctx.db.query('products').collect()).length,
      activeJobs: activeJobs.length,
      recentUsers,
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
    status: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    if (args.status) {
      return await ctx.db
        .query('scrape_jobs')
        .withIndex('by_status', (q) => q.eq('status', args.status as any))
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
