import { v } from 'convex/values';

import { query, mutation } from './_generated/server';

export const create = mutation({
  args: {
    level: v.union(v.literal('INFO'), v.literal('WARN'), v.literal('ERROR'), v.literal('DEBUG')),
    message: v.string(),
    context: v.optional(v.any()),
    traceId: v.optional(v.string()),
    userId: v.optional(v.string()),
    sessionId: v.optional(v.string()),
    timestamp: v.number(),
    app: v.optional(v.string()),
    error: v.optional(v.any()),
    device: v.optional(v.any()),
    breadcrumbs: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert('logs', args);
  },
});

export const log = create; // Alias

export const logBatch = mutation({
  args: {
    logs: v.array(
      v.object({
        level: v.union(v.literal('INFO'), v.literal('WARN'), v.literal('ERROR'), v.literal('DEBUG')),
        message: v.string(),
        context: v.optional(v.any()),
        traceId: v.optional(v.string()),
        userId: v.optional(v.string()),
        sessionId: v.optional(v.string()),
        timestamp: v.number(),
        app: v.optional(v.string()),
        error: v.optional(v.any()),
        device: v.optional(v.any()),
        breadcrumbs: v.optional(v.any()),
      }),
    ),
  },
  handler: async (ctx, args) => {
    await Promise.all(args.logs.map((log) => ctx.db.insert('logs', log)));
  },
});

export const getLogs = query({
  args: {
    paginationOpts: v.any(), // paginationOpts
    filters: v.optional(
      v.object({
        level: v.optional(v.union(v.literal('INFO'), v.literal('WARN'), v.literal('ERROR'), v.literal('DEBUG'))),
        userId: v.optional(v.string()),
        sessionId: v.optional(v.string()),
        traceId: v.optional(v.string()),
        startTime: v.optional(v.number()),
        endTime: v.optional(v.number()),
      })
    ),
  },
  handler: async (ctx, args) => {
    const { paginationOpts, filters } = args;

    // Construct query
    // Optimizations:
    // 1. If searching by TraceID, use trace index.
    // 2. If searching by User, use user index.
    // 3. If searching by Session, use session index.
    // 4. If searching by Level, use level index.
    // Priority: Trace > Session > User > Level > Timestamp (Default)

    let q;

    if (filters?.traceId) {
      q = ctx.db.query('logs').withIndex('by_trace', (q) => q.eq('traceId', filters.traceId!));
    } else if (filters?.sessionId) {
      q = ctx.db.query('logs').withIndex('by_session', (q) => q.eq('sessionId', filters.sessionId!));
    } else if (filters?.userId) {
      q = ctx.db.query('logs').withIndex('by_user', (q) => q.eq('userId', filters.userId!));
    } else if (filters?.level) {
      q = ctx.db.query('logs').withIndex('by_level', (q) => q.eq('level', filters.level!));
    } else {
      q = ctx.db.query('logs').withIndex('by_timestamp');
    }

    // Apply in-memory filters for remaining criteria
    // Note: Paginated queries in Convex apply filters BEFORE pagination if using .filter()
    // but .paginate() is the terminal operation.

    if (filters?.startTime) {
      q = q.filter((q) => q.gte(q.field('timestamp'), filters.startTime!));
    }
    if (filters?.endTime) {
      q = q.filter((q) => q.lte(q.field('timestamp'), filters.endTime!));
    }

    // If we used an index other than the one for the filter, we might need secondary filtering?
    // E.g. Query by Level but also filter by UserId? 
    // Since we prioritized specific ID indexes, this is mostly fine.
    // But if we Query by Level AND User, we picked User index (priority 3) vs Level (priority 4)??
    // Wait, my priority list above was Trace > Session > User > Level.

    // If I have User AND Level:
    // I use User index. I get all logs for User.
    // Then I must filter by Level.
    if (filters?.userId && filters?.level && !filters.traceId && !filters.sessionId) {
      q = q.filter(q => q.eq(q.field('level'), filters.level!))
    }

    // Correct.

    return await q.order('desc').paginate(paginationOpts);
  },
});

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
      .order('desc')
      .take(args.limit ?? 100);
  },
});

export const getByUserId = query({
  args: { userId: v.string(), limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    return await ctx.db
      .query('logs')
      .withIndex('by_user', (q) => q.eq('userId', args.userId))
      .order('desc')
      .take(args.limit ?? 100);
  },
});

export const deleteOlderThan = mutation({
  args: { timestamp: v.number() },
  handler: async (ctx, args) => {
    const oldLogs = await ctx.db
      .query('logs')
      .withIndex('by_timestamp', q => q.lt('timestamp', args.timestamp))
      .take(1000);

    let count = 0;
    for (const doc of oldLogs) {
      await ctx.db.delete(doc._id);
      count++;
    }
    return count;
  },
});
