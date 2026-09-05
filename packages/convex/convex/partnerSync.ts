import { v } from 'convex/values';

import { components } from './_generated/api';
import { query, mutation } from './_generated/server';

export const getById = query({
  args: { id: v.id('partner_sync') },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

export const getByInviteCode = query({
  args: { inviteCode: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query('partner_sync')
      .withIndex('by_inviteCode', (q) => q.eq('inviteCode', args.inviteCode))
      .first();
  },
});

export const getByInitiator = query({
  args: { initiatorId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query('partner_sync')
      .withIndex('by_initiator', (q) => q.eq('initiatorId', args.initiatorId))
      .collect();
  },
});

export const getByPartner = query({
  args: { partnerId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query('partner_sync')
      .withIndex('by_partner', (q) => q.eq('partnerId', args.partnerId))
      .collect();
  },
});

export const getActiveByUser = query({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    // Complex query not supported by index directly.
    // We look up by initiator and partner and filter.
    // Or assume repository handles selection from lists.
    // But Repository calls `getActiveByUser`.
    // This likely implies a custom search or index.
    // For now, scan initiator index + partner index?
    const asInitiator = await ctx.db
      .query('partner_sync')
      .withIndex('by_initiator', (q) => q.eq('initiatorId', args.userId))
      .filter((q) => q.eq(q.field('status'), 'active'))
      .collect();

    const asPartner = await ctx.db
      .query('partner_sync')
      .withIndex('by_partner', (q) => q.eq('partnerId', args.userId))
      .filter((q) => q.eq(q.field('status'), 'active'))
      .collect();
      
    const sessions = [...asInitiator, ...asPartner];
    
    // Enrich with partner details
    return await Promise.all(
      sessions.map(async (session) => {
        const otherUserId = session.initiatorId === args.userId ? session.partnerId : session.initiatorId;
        if (!otherUserId) return session;

        try {
          const users = await ctx.runQuery(components.auth.api.findMany, {
            model: 'users',
            where: [{ field: '_id', operator: 'eq', value: otherUserId }],
            paginationOpts: { numItems: 1, cursor: null },
          });
          const otherUser = users.page[0];
          
          return {
            ...session,
            partnerName: otherUser?.name || 'Partner',
            partnerImage: otherUser?.image,
          };
        } catch {
          // Fallback if auth component is not reachable or errors
          return session;
        }
      })
    );
  },
});

export const create = mutation({
  args: {
    initiatorId: v.string(),
    partnerId: v.optional(v.string()),
    inviteCode: v.string(),
    status: v.union(v.literal('pending'), v.literal('active'), v.literal('expired')),
    expiresAt: v.number(),
    influenceRatio: v.number(),
    createdAt: v.number(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert('partner_sync', args);
  },
});

export const update = mutation({
  args: {
    id: v.id('partner_sync'),
    initiatorId: v.optional(v.string()),
    partnerId: v.optional(v.string()),
    inviteCode: v.optional(v.string()),
    status: v.optional(v.union(v.literal('pending'), v.literal('active'), v.literal('expired'))),
    expiresAt: v.optional(v.number()),
    influenceRatio: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const { id, ...updates } = args;
    await ctx.db.patch(id, updates);
  },
});

export const updateStatus = mutation({
  args: {
    id: v.id('partner_sync'),
    status: v.union(v.literal('pending'), v.literal('active'), v.literal('expired')),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, { status: args.status });
  },
});

export const remove = mutation({
  args: { id: v.id('partner_sync') },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
  },
});

export const deleteExpired = mutation({
  args: { now: v.number() },
  handler: async (ctx, args) => {
    const expired = await ctx.db
      .query('partner_sync')
      .filter((q) => q.lt(q.field('expiresAt'), args.now))
      .collect();
    let count = 0;
    for (const doc of expired) {
      await ctx.db.delete(doc._id);
      count++;
    }
    return count;
  },
});
