import { cronJobs } from "convex/server";

import { internal } from "./_generated/api";
import { internalMutation } from "./_generated/server";

const crons = cronJobs();

// Schedule: Prune old logs every Sunday at 2 AM UTC
crons.weekly(
  "prune-old-logs",
  { dayOfWeek: "sunday", hourUTC: 2, minuteUTC: 0 },
  internal.crons.pruneOldLogs
);

// Schedule: Prune old events every Sunday at 2:30 AM UTC
crons.weekly(
  "prune-old-events",
  { dayOfWeek: "sunday", hourUTC: 2, minuteUTC: 30 },
  internal.crons.pruneOldEvents
);

// Schedule: Prune old swipes every Sunday at 3 AM UTC
crons.weekly(
  "prune-old-swipes",
  { dayOfWeek: "sunday", hourUTC: 3, minuteUTC: 0 },
  internal.crons.pruneOldSwipes
);

// Schedule: Flip past-expiry partner sync sessions to expired every hour.
// Query-time expiresAt filtering is the real enforcement; this keeps the
// table honest (sessions live 30m-24h, so weekly pruning would leave
// stale actives blending feeds for days).
crons.hourly(
  "expire-stale-syncs",
  { minuteUTC: 0 },
  internal.crons.expireStaleSyncs
);

export default crons;

// -----------------------------------------------------------------------------
// INTERNAL MUTATIONS FOR PRUNING
// -----------------------------------------------------------------------------

export const pruneOldLogs = internalMutation({
  args: {},
  handler: async (ctx) => {
    // 14 days ago
    const cutoff = Date.now() - 14 * 24 * 60 * 60 * 1000;
    
    // Batch size of 200 to prevent hitting transaction limits
    const oldLogs = await ctx.db
      .query("logs")
      .withIndex("by_timestamp", (q) => q.lt("timestamp", cutoff))
      .take(200);
      
    for (const log of oldLogs) {
      await ctx.db.delete(log._id);
    }
  },
});

export const pruneOldEvents = internalMutation({
  args: {},
  handler: async (ctx) => {
    // 14 days ago
    const cutoff = Date.now() - 14 * 24 * 60 * 60 * 1000;
    
    const oldEvents = await ctx.db
      .query("events")
      .withIndex("by_timestamp", (q) => q.lt("timestamp", cutoff))
      .take(200);
      
    for (const event of oldEvents) {
      await ctx.db.delete(event._id);
    }
  },
});

export const expireStaleSyncs = internalMutation({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();
    const stale = await ctx.db
      .query("partner_sync")
      .filter((q) => q.lt(q.field("expiresAt"), now))
      .collect();
    for (const doc of stale) {
      if (doc.status !== "expired") {
        await ctx.db.patch(doc._id, { status: "expired" });
      }
    }
  },
});

export const pruneOldSwipes = internalMutation({
  args: {},
  handler: async (ctx) => {
    // 30 days ago
    const cutoff = Date.now() - 30 * 24 * 60 * 60 * 1000;
    
    const oldSwipes = await ctx.db
      .query("swipes")
      .withIndex("by_timestamp", (q) => q.lt("timestamp", cutoff))
      .take(200);
      
    for (const swipe of oldSwipes) {
      await ctx.db.delete(swipe._id);
    }
  },
});
