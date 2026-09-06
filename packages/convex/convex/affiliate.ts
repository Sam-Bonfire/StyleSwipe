import { v } from 'convex/values';

import { mutation, query } from './_generated/server';

const networkValidator = v.union(
  v.literal('DIRECT'),
  v.literal('IMPACT'),
  v.literal('CJ'),
  v.literal('RAKUTEN'),
  v.literal('CUSTOM'),
);

const paramsValidator = v.array(v.object({ key: v.string(), value: v.string() }));

export const list = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query('affiliate_links').order('desc').collect();
  },
});

export const save = mutation({
  args: {
    id: v.optional(v.id('affiliate_links')),
    merchantDomain: v.string(),
    merchantName: v.string(),
    network: networkValidator,
    trackingParams: paramsValidator,
    isEnabled: v.boolean(),
  },
  handler: async (ctx, args) => {
    const { id, ...data } = args;
    const timestamp = Date.now();
    const domain = data.merchantDomain.toLowerCase().trim();
    if (id) {
      await ctx.db.patch(id, { ...data, merchantDomain: domain, updatedAt: timestamp });
      return id;
    }
    return await ctx.db.insert('affiliate_links', {
      ...data,
      merchantDomain: domain,
      createdAt: timestamp,
      updatedAt: timestamp,
    });
  },
});

export const remove = mutation({
  args: { id: v.id('affiliate_links') },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
  },
});

/**
 * All-time outbound redirect counts for the admin dashboard.
 */
export const getRedirectStats = query({
  args: {},
  handler: async (ctx) => {
    const countByType = async (type: string) => {
      const events = await ctx.db
        .query('events')
        .withIndex('by_type', (q) => q.eq('type', type))
        .collect();
      return events.length;
    };
    return {
      affiliateRedirect: await countByType('affiliate_redirect'),
      merchantRedirect: await countByType('merchant_redirect'),
    };
  },
});
