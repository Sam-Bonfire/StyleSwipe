import { v } from 'convex/values';

import { query, mutation } from './_generated/server';

export const create = mutation({
  args: {
    level: v.union(v.literal('INFO'), v.literal('WARN'), v.literal('ERROR')),
    message: v.string(),
    context: v.optional(v.any()),
    traceId: v.optional(v.string()),
    userId: v.optional(v.string()),
    timestamp: v.number(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert('logs', args);
  },
});

export const log = create; // Alias

export const getByTraceId = query({
  args: { traceId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query('logs')
      .withIndex('by_trace', (q) => q.eq('traceId', args.traceId))
      .collect();
  },
});

export const getByLevel = query({
  args: {
    level: v.union(v.literal('INFO'), v.literal('WARN'), v.literal('ERROR')),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query('logs')
      .withIndex('by_level', (q) => q.eq('level', args.level))
      .order('desc') // timestamp implicit? schema has it.
      // Index `by_level` is `["level"]`.
      // `ctx.db.query("logs").withIndex("by_level", ...)`.
      // Does it sort by timestamp? No.
      // But we can take limit.
      .take(args.limit ?? 100);
  },
});

export const getByUserId = query({
  args: { userId: v.string(), limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    return await ctx.db
      .query('logs')
      .withIndex('by_user', (q) => q.eq('userId', args.userId))
      .order('desc') // Assuming creation order or add .order("desc")
      .take(args.limit ?? 100);
  },
});

export const deleteOlderThan = mutation({
  args: { timestamp: v.number() },
  handler: async (ctx, args) => {
    const oldLogs = await ctx.db
      .query('logs')
      .filter((q) => q.lt(q.field('timestamp'), args.timestamp))
      .take(1000); // Limit batch size avoid timeout

    let count = 0;
    for (const doc of oldLogs) {
      await ctx.db.delete(doc._id);
      count++;
    }
    return count;
  },
});
