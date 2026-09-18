import { v } from 'convex/values';

import { mutation, query } from './_generated/server';

/**
 * Notifications dispatch (hexagonal: Convex adapter layer)
 * Req 9.1 — price drop, back-in-stock, partner liked, order update
 * Each dispatch writes an inbox `notifications` row and logs a push_tokens lookup.
 * Actual Expo Push Server call is stubbed (logs) — plug `fetch('https://exp.host/--/api/v2/push/send')` in prod.
 */

const NotificationType = v.union(
  v.literal('PRICE_DROP'),
  v.literal('BACK_IN_STOCK'),
  v.literal('PARTNER_LIKED'),
  v.literal('ORDER_UPDATE'),
  v.literal('PARTNER_INVITE'),
  v.literal('PARTNER_MATCH'),
  v.literal('DISCOVERY_DROP'),
  v.literal('SYSTEM'),
);

type NotificationTypeValue =
  | 'PRICE_DROP'
  | 'BACK_IN_STOCK'
  | 'PARTNER_LIKED'
  | 'ORDER_UPDATE'
  | 'PARTNER_INVITE'
  | 'PARTNER_MATCH'
  | 'DISCOVERY_DROP'
  | 'SYSTEM';

interface DispatchArgs {
  userId: string;
  type: NotificationTypeValue;
  title: string;
  body: string;
  data?: Record<string, unknown>;
}

async function dispatchNotification(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ctx: any,
  args: DispatchArgs,
): Promise<string> {
  const now = Date.now();

  const notificationId: string = await ctx.db.insert('notifications', {
    userId: args.userId,
    type: args.type,
    title: args.title,
    body: args.body,
    data: args.data,
    isRead: false,
    createdAt: now,
  });

  // Lookup push tokens (both tables for backwards compat)
  const pushTokens = await ctx.db
    .query('push_tokens')
    .withIndex('by_user', (q: { eq: (field: string, value: string) => unknown } ) => q.eq('userId', args.userId))
    .collect();
  const legacy = await ctx.db
    .query('user_devices')
    .withIndex('by_user', (q: { eq: (field: string, value: string) => unknown } ) => q.eq('userId', args.userId))
    .collect();

  const tokens: string[] = [
    ...pushTokens.filter((t: { isActive: boolean }) => t.isActive).map((t: { token: string }) => t.token),
    ...legacy
      .filter((t: { isActive: boolean }) => t.isActive)
      .map((t: { token: string }) => t.token)
      .filter((tok: string) => !pushTokens.some((pt: { token: string }) => pt.token === tok)),
  ];

  if (tokens.length > 0) {
    await ctx.db.insert('logs', {
      level: 'INFO',
      message: `Push dispatch: ${args.type}`,
      context: { userId: args.userId, title: args.title, tokensCount: tokens.length, data: args.data },
      timestamp: now,
    });
    // TODO(prod): POST to Expo Push Service
    // await fetch('https://exp.host/--/api/v2/push/send', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(tokens.map(t=>({to:t, title:args.title, body:args.body, data: args.data})) )})
  } else {
    await ctx.db.insert('logs', {
      level: 'INFO',
      message: `Notification inbox only (no push token): ${args.type}`,
      context: { userId: args.userId },
      timestamp: now,
    });
  }

  return notificationId as string;
}

// ----- Dispatch helpers -----

export const dispatchPriceDrop = mutation({
  args: {
    userId: v.string(),
    productId: v.string(),
    oldPrice: v.number(),
    newPrice: v.number(),
    productTitle: v.optional(v.string()),
  },
  handler: async (ctx, args): Promise<string> => {
    const title = 'Price drop alert! 📉';
    const body = `${args.productTitle ?? 'An item you liked'} dropped from ₹${args.oldPrice} to ₹${args.newPrice}`;
    return dispatchNotification(ctx, {
      userId: args.userId,
      type: 'PRICE_DROP',
      title,
      body,
      data: { productId: args.productId, oldPrice: args.oldPrice, newPrice: args.newPrice },
    });
  },
});

export const dispatchBackInStock = mutation({
  args: {
    userId: v.string(),
    productId: v.string(),
    productTitle: v.optional(v.string()),
  },
  handler: async (ctx, args): Promise<string> => {
    const title = 'Back in stock! ✅';
    const body = `${args.productTitle ?? 'An item you wishlisted'} is back in stock. Grab it fast!`;
    return dispatchNotification(ctx, {
      userId: args.userId,
      type: 'BACK_IN_STOCK',
      title,
      body,
      data: { productId: args.productId },
    });
  },
});

export const dispatchPartnerLiked = mutation({
  args: {
    userId: v.string(),
    partnerName: v.string(),
    productId: v.string(),
    productTitle: v.optional(v.string()),
  },
  handler: async (ctx, args): Promise<string> => {
    const title = `${args.partnerName} liked something! 💞`;
    const body = `${args.partnerName} liked ${args.productTitle ?? 'an item'} — you might love it too.`;
    return dispatchNotification(ctx, {
      userId: args.userId,
      type: 'PARTNER_LIKED',
      title,
      body,
      data: { productId: args.productId, partnerName: args.partnerName },
    });
  },
});

export const dispatchOrderUpdate = mutation({
  args: {
    userId: v.string(),
    orderNumber: v.string(),
    status: v.string(),
  },
  handler: async (ctx, args): Promise<string> => {
    const title = 'Order update 📦';
    const body = `Your order ${args.orderNumber} is now ${args.status}.`;
    return dispatchNotification(ctx, {
      userId: args.userId,
      type: 'ORDER_UPDATE',
      title,
      body,
      data: { orderNumber: args.orderNumber, status: args.status },
    });
  },
});

// Generic dispatch (admin / internal)
export const dispatchGeneric = mutation({
  args: {
    userId: v.string(),
    type: NotificationType,
    title: v.string(),
    body: v.string(),
    data: v.optional(v.any()),
  },
  handler: async (ctx, args): Promise<string> => {
    return dispatchNotification(ctx, {
      userId: args.userId,
      type: args.type,
      title: args.title,
      body: args.body,
      data: args.data as Record<string, unknown> | undefined,
    });
  },
});

// ----- Inbox queries -----

export const listNotifications = query({
  args: { userId: v.string(), limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 20;
    return await ctx.db
      .query('notifications')
      .withIndex('by_user_created', (q) => q.eq('userId', args.userId))
      .order('desc')
      .take(limit);
  },
});

export const countUnread = query({
  args: { userId: v.string() },
  handler: async (ctx, args): Promise<number> => {
    const unread = await ctx.db
      .query('notifications')
      .withIndex('by_user', (q) => q.eq('userId', args.userId))
      .filter((q) => q.eq(q.field('isRead'), false))
      .collect();
    return unread.length;
  },
});

export const markRead = mutation({
  args: { notificationId: v.id('notifications') },
  handler: async (ctx, args): Promise<void> => {
    await ctx.db.patch(args.notificationId, { isRead: true });
  },
});

export const markAllRead = mutation({
  args: { userId: v.string() },
  handler: async (ctx, args): Promise<void> => {
    const unread = await ctx.db
      .query('notifications')
      .withIndex('by_user', (q) => q.eq('userId', args.userId))
      .filter((q) => q.eq(q.field('isRead'), false))
      .collect();
    for (const n of unread) {
      await ctx.db.patch(n._id, { isRead: true });
    }
  },
});

// ----- Preferences -----

export const getPreferences = query({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    const prefs = await ctx.db
      .query('notification_preferences')
      .withIndex('by_user', (q) => q.eq('userId', args.userId))
      .first();
    return prefs ?? null;
  },
});

export const setPreferences = mutation({
  args: {
    userId: v.string(),
    push: v.boolean(),
    email: v.boolean(),
    inApp: v.boolean(),
    priceDrops: v.boolean(),
    partnerSync: v.boolean(),
    dailyDrops: v.boolean(),
    marketing: v.boolean(),
  },
  handler: async (ctx, args): Promise<string> => {
    const existing = await ctx.db
      .query('notification_preferences')
      .withIndex('by_user', (q) => q.eq('userId', args.userId))
      .first();
    const now = Date.now();
    if (existing) {
      await ctx.db.patch(existing._id, {
        push: args.push,
        email: args.email,
        inApp: args.inApp,
        priceDrops: args.priceDrops,
        partnerSync: args.partnerSync,
        dailyDrops: args.dailyDrops,
        marketing: args.marketing,
        updatedAt: now,
      });
      return existing._id;
    }
    return await ctx.db.insert('notification_preferences', {
      userId: args.userId,
      push: args.push,
      email: args.email,
      inApp: args.inApp,
      priceDrops: args.priceDrops,
      partnerSync: args.partnerSync,
      dailyDrops: args.dailyDrops,
      marketing: args.marketing,
      updatedAt: now,
    });
  },
});

export const upsertPreferences = setPreferences;
