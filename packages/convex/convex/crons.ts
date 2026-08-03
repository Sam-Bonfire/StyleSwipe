import { cronJobs } from "convex/server";
import { internalMutation } from "./_generated/server";
import { internal } from "./_generated/api";

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
