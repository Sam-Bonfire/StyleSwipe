import { v } from 'convex/values';

import type { QueryCtx } from './_generated/server';

import { components } from './_generated/api';
import { query, mutation } from './_generated/server';

/** Minimal surface shared by query and mutation handlers. */
type DbCtx = { db: QueryCtx['db'] };

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

/** Pending, unexpired outgoing invites for the initiator (waiting room). */
export const getPendingByInitiator = query({
  args: { initiatorId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query('partner_sync')
      .withIndex('by_initiator', (q) => q.eq('initiatorId', args.initiatorId))
      .filter((q) => q.eq(q.field('status'), 'pending'))
      .filter((q) => q.gt(q.field('expiresAt'), Date.now()))
      .collect();
  },
});

/** Any live (active or pending, unexpired) session involving the user. */
async function liveSessionsFor(ctx: DbCtx, userId: string, excludeId?: string) {
  const now = Date.now();
  const asInitiator = await ctx.db
    .query('partner_sync')
    .withIndex('by_initiator', (q) => q.eq('initiatorId', userId))
    .collect();
  const asPartner = await ctx.db
    .query('partner_sync')
    .withIndex('by_partner', (q) => q.eq('partnerId', userId))
    .collect();
  return [...asInitiator, ...asPartner].filter(
    (s) =>
      s._id !== excludeId &&
      (s.status === 'active' || s.status === 'pending') &&
      s.expiresAt > now,
  );
}

export const getActiveByUser = query({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    // Active means status active AND not past expiry (the hourly cron flips
    // stale rows to expired, but time-based filtering is the real enforcement).
    const now = Date.now();
    const asInitiator = await ctx.db
      .query('partner_sync')
      .withIndex('by_initiator', (q) => q.eq('initiatorId', args.userId))
      .filter((q) => q.eq(q.field('status'), 'active'))
      .filter((q) => q.gt(q.field('expiresAt'), now))
      .collect();

    const asPartner = await ctx.db
      .query('partner_sync')
      .withIndex('by_partner', (q) => q.eq('partnerId', args.userId))
      .filter((q) => q.eq(q.field('status'), 'active'))
      .filter((q) => q.gt(q.field('expiresAt'), now))
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
    const existing = await ctx.db
      .query('partner_sync')
      .withIndex('by_inviteCode', (q) => q.eq('inviteCode', args.inviteCode))
      .first();
    if (existing) throw new Error('Invite code already in use. Please try again.');
    // One live session per user: the client reuses pending invites, this is the backstop.
    const live = await liveSessionsFor(ctx, args.initiatorId);
    if (live.length > 0) {
      throw new Error('You already have an active sync session. Stop it before starting a new one.');
    }
    return await ctx.db.insert('partner_sync', args);
  },
});

/**
 * Accept an invite with server-side validation (the client also guards,
 * but the mutation is the enforcement point).
 */
export const accept = mutation({
  args: { id: v.id('partner_sync'), partnerId: v.string() },
  handler: async (ctx, args) => {
    const doc = await ctx.db.get(args.id);
    if (!doc) throw new Error('Invite not found.');
    if (doc.status !== 'pending') throw new Error('Invite is no longer pending.');
    if (doc.expiresAt <= Date.now()) {
      await ctx.db.patch(args.id, { status: 'expired' });
      throw new Error('Invite has expired.');
    }
    if (doc.partnerId) throw new Error('Invite was already accepted.');
    if (doc.initiatorId === args.partnerId) throw new Error('You cannot accept your own invite.');
    const live = await liveSessionsFor(ctx, args.partnerId, args.id);
    if (live.length > 0) {
      throw new Error('Stop your current sync session before joining a new one.');
    }
    // Mint the couple's shared board (owner = initiator; reads/writes are
    // not owner-gated, and the detail screen hides edit/delete from guests).
    const timestamp = Date.now();
    const sharedBoardId = await ctx.db.insert('boards', {
      userId: doc.initiatorId,
      name: 'Shared Sync Board',
      slug: `sync-${doc.inviteCode.toLowerCase()}`,
      isSystem: false,
      createdAt: timestamp,
      updatedAt: timestamp,
    });
    await ctx.db.patch(args.id, {
      partnerId: args.partnerId,
      status: 'active',
      sharedBoardId,
    });
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
