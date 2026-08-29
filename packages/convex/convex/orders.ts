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
  },
  handler: async (ctx, args) => {
    const timestamp = Date.now();
    const orderNumber = `ORD-${timestamp}`;
    const initialStatus = 'PENDING';

    const orderId = await ctx.db.insert('orders', {
      orderNumber,
      userId: args.userId,
      items: args.items,
      pricing: args.pricing,
      deliveryAddress: args.deliveryAddress,
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
