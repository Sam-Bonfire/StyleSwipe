import { paginationOptsValidator } from 'convex/server';
import { v } from 'convex/values';

import { internalMutation, mutation, query } from './_generated/server';

export const placeOrder = mutation({
  args: {
    userId: v.string(),
    items: v.array(
      v.object({
        productId: v.string(),
        quantity: v.number(),
        price: v.number(),
        brand: v.optional(v.string()),
        title: v.optional(v.string()),
        image: v.optional(v.string()),
        attributes: v.optional(v.any()),
      })
    ),
    pricing: v.object({
      subtotal: v.number(),
      shippingCost: v.number(),
      discountAmount: v.number(),
      tax: v.number(),
      totalAmount: v.number(),
    }),
    deliveryAddress: v.object({
      name: v.string(),
      line1: v.string(),
      line2: v.optional(v.string()),
      city: v.string(),
      state: v.string(),
      postalCode: v.string(),
      country: v.string(),
      phone: v.string(),
    }),
    paymentMethod: v.optional(v.string()),
    paymentInfo: v.optional(
      v.object({
        method: v.string(),
        transactionId: v.optional(v.string()),
        paymentStatus: v.string(),
      })
    ),
  },
  handler: async (ctx, args) => {
    const timestamp = Date.now();
    const orderNumber = `ORD-${timestamp}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
    const initialStatus = 'pending';
    const paymentMethod = args.paymentMethod ?? args.paymentInfo?.method ?? 'COD';
    const paymentInfo = args.paymentInfo ?? {
      method: paymentMethod,
      paymentStatus: paymentMethod === 'COD' ? 'PENDING' : 'PENDING',
    };

    const orderId = await ctx.db.insert('orders', {
      orderNumber,
      userId: args.userId,
      items: args.items,
      pricing: args.pricing,
      deliveryAddress: args.deliveryAddress,
      address: args.deliveryAddress,
      paymentMethod,
      paymentInfo,
      trackingId: undefined,
      tracking: undefined,
      status: initialStatus,
      statusHistory: [
        {
          status: initialStatus,
          timestamp,
        },
      ],
      createdAt: timestamp,
      updatedAt: timestamp,
    });

    const cart = await ctx.db
      .query('carts')
      .withIndex('by_user', (q) => q.eq('userId', args.userId))
      .unique();

    if (cart) {
      await ctx.db.patch(cart._id, {
        items: [],
        updatedAt: timestamp,
      });
    }

    await ctx.db.insert('logs', {
      level: 'INFO',
      message: 'Order placed',
      timestamp,
      userId: args.userId,
      context: { orderNumber },
    });

    return orderId;
  },
});

export const getOrderById = query({
  args: {
    idOrOrderNumber: v.string(),
  },
  handler: async (ctx, args) => {
    // Try querying by orderNumber index first
    const order = await ctx.db
      .query('orders')
      .withIndex('by_order_number', (q) => q.eq('orderNumber', args.idOrOrderNumber))
      .unique();

    if (order) {
      return order;
    }

    // Basic length/regex check for Convex ID format, skipping try-catch
    // Convex IDs are typically 32 characters or something similar, but let's check alphanumeric
    if (/^[a-zA-Z0-9_-]{32}$/.test(args.idOrOrderNumber) || /^[a-zA-Z0-9]+$/.test(args.idOrOrderNumber)) {
      // Actually, convex ID length is variable depending on ID v1 vs v2, usually alphanumeric
      // Let's just pass it to `normalizeId` which returns null if invalid
      const validId = ctx.db.normalizeId('orders', args.idOrOrderNumber);
      if (validId) {
        return await ctx.db.get(validId);
      }
    }

    return null;
  },
});

export const listUserOrders = query({
  args: {
    userId: v.string(),
    paginationOpts: paginationOptsValidator,
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query('orders')
      .withIndex('by_user_created', (q) => q.eq('userId', args.userId))
      .order('desc')
      .paginate(args.paginationOpts);
  },
});

export const updateOrderStatus = mutation({
  args: {
    orderId: v.id('orders'),
    status: v.string(),
    reason: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const order = await ctx.db.get(args.orderId);
    if (!order) {
      throw new Error('Order not found');
    }

    const timestamp = Date.now();
    const newHistory = [
      ...order.statusHistory,
      {
        status: args.status,
        timestamp,
        reason: args.reason,
      },
    ];

    await ctx.db.patch(args.orderId, {
      status: args.status,
      statusHistory: newHistory,
      updatedAt: timestamp,
    });
  },
});

export const cancelOrder = mutation({
  args: {
    orderId: v.id('orders'),
    reason: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const order = await ctx.db.get(args.orderId);
    if (!order) throw new Error('Order not found');
    const now = Date.now();
    const lower = order.status.toLowerCase();
    if (lower === 'shipped' || lower === 'delivered' || lower === 'cancelled' || lower === 'returned') {
      throw new Error(`Cannot cancel order in status ${order.status}`);
    }
    // 24h window for cancel
    if (now - order.createdAt > 24 * 60 * 60 * 1000) {
      throw new Error('Cancel window expired (24h)');
    }
    const newHistory = [
      ...order.statusHistory,
      { status: 'cancelled', timestamp: now, reason: args.reason ?? 'User cancelled' },
    ];
    await ctx.db.patch(args.orderId, {
      status: 'cancelled',
      statusHistory: newHistory,
      updatedAt: now,
    });
  },
});

export const returnOrder = mutation({
  args: {
    orderId: v.id('orders'),
    reason: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const order = await ctx.db.get(args.orderId);
    if (!order) throw new Error('Order not found');
    const lower = order.status.toLowerCase();
    if (lower !== 'delivered' && lower !== 'shipped') {
      throw new Error(`Return only allowed after shipped/delivered, current ${order.status}`);
    }
    // Return window 7 days from delivery/shipped would be ideal; fallback 7 days from now check
    const lastShipped = [...order.statusHistory].reverse().find((h) => h.status.toLowerCase() === 'delivered' || h.status.toLowerCase() === 'shipped');
    const base = lastShipped?.timestamp ?? order.createdAt;
    if (Date.now() - base > 7 * 24 * 60 * 60 * 1000) {
      throw new Error('Return window expired (7 days)');
    }
    const now = Date.now();
    const newHistory = [...order.statusHistory, { status: 'returned', timestamp: now, reason: args.reason ?? 'User returned' }];
    await ctx.db.patch(args.orderId, {
      status: 'returned',
      statusHistory: newHistory,
      updatedAt: now,
    });
  },
});

export const addTracking = mutation({
  args: {
    orderId: v.id('orders'),
    carrier: v.string(),
    trackingNumber: v.string(),
    estimatedDeliveryDate: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const order = await ctx.db.get(args.orderId);
    if (!order) throw new Error('Order not found');
    const now = Date.now();
    await ctx.db.patch(args.orderId, {
      trackingId: args.trackingNumber,
      tracking: {
        carrier: args.carrier,
        trackingNumber: args.trackingNumber,
        estimatedDeliveryDate: args.estimatedDeliveryDate,
      },
      status: order.status.toLowerCase() === 'pending' || order.status.toLowerCase() === 'paid' ? 'shipped' : order.status,
      statusHistory:
        order.status.toLowerCase() === 'pending' || order.status.toLowerCase() === 'paid'
          ? [...order.statusHistory, { status: 'shipped', timestamp: now, reason: 'Tracking added' }]
          : order.statusHistory,
      updatedAt: now,
    });
  },
});

export const handlePaymentWebhook = internalMutation({
  args: {
    orderNumber: v.string(),
    paymentStatus: v.string(),
    transactionId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const order = await ctx.db
      .query('orders')
      .withIndex('by_order_number', (q) => q.eq('orderNumber', args.orderNumber))
      .unique();

    if (!order) {
      throw new Error(`Order ${args.orderNumber} not found for webhook`);
    }

    const currentPaymentInfo = order.paymentInfo || {
      method: 'unknown',
      paymentStatus: 'PENDING',
    };

    await ctx.db.patch(order._id, {
      paymentInfo: {
        ...currentPaymentInfo,
        paymentStatus: args.paymentStatus,
        ...(args.transactionId ? { transactionId: args.transactionId } : {}),
      },
      updatedAt: Date.now(),
    });
  },
});
