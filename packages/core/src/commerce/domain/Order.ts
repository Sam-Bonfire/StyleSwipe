import { z } from 'zod';

import { AddressSchema } from './Address';

export const OrderStatusSchema = z.enum([
  'PENDING',
  'CONFIRMED',
  'PAID',
  'PROCESSING',
  'SHIPPED',
  'DELIVERED',
  'CANCELLED',
  'REFUNDED',
]);
export type OrderStatus = z.infer<typeof OrderStatusSchema>;

export const OrderItemSchema = z.object({
  productId: z.string().min(1, 'Product ID is required'),
  quantity: z.number().int().min(1, 'Quantity must be at least 1'),
  price: z.number().min(0, 'Price cannot be negative'),
  brand: z.string().optional(),
  title: z.string().optional(),
  image: z.string().optional(),
});
export type OrderItem = z.infer<typeof OrderItemSchema>;

export const OrderPricingSchema = z.object({
  subtotal: z.number().min(0),
  shippingCost: z.number().min(0),
  discountAmount: z.number().min(0),
  tax: z.number().min(0),
  totalAmount: z.number().min(0),
});
export type OrderPricing = z.infer<typeof OrderPricingSchema>;

export const PaymentInfoSchema = z.object({
  method: z.string().min(1),
  transactionId: z.string().optional(),
  paymentStatus: z.enum(['PENDING', 'SUCCESS', 'FAILED', 'REFUNDED']).default('PENDING'),
});
export type PaymentInfo = z.infer<typeof PaymentInfoSchema>;

export const TrackingInfoSchema = z.object({
  carrier: z.string().min(1),
  trackingNumber: z.string().min(1),
  estimatedDeliveryDate: z.number().optional(),
});
export type TrackingInfo = z.infer<typeof TrackingInfoSchema>;

export const StatusHistorySchema = z.object({
  status: OrderStatusSchema,
  timestamp: z.number().int().min(0).default(() => Date.now()),
  reason: z.string().optional(),
});
export type StatusHistory = z.infer<typeof StatusHistorySchema>;

export const OrderSchema = z.object({
  id: z.string().min(1, 'Order ID is required'),
  orderNumber: z.string().min(1, 'Order number is required'),
  userId: z.string().min(1, 'User ID is required'),
  items: z.array(OrderItemSchema).min(1, 'Order must contain at least one item'),
  pricing: OrderPricingSchema,
  deliveryAddress: AddressSchema,
  paymentInfo: PaymentInfoSchema.optional(),
  tracking: TrackingInfoSchema.optional(),
  status: OrderStatusSchema.default('PENDING'),
  statusHistory: z.array(StatusHistorySchema).default([]),
  createdAt: z.number().int().min(0).default(() => Date.now()),
  updatedAt: z.number().int().min(0).default(() => Date.now()),
});
export type Order = z.infer<typeof OrderSchema>;

export const createOrder = (data: Omit<Order, 'id' | 'orderNumber' | 'status' | 'statusHistory' | 'createdAt' | 'updatedAt'> & Partial<Order>): Order => {
  const initialStatus = data.status || 'PENDING';
  const historyEntry: StatusHistory = {
    status: initialStatus,
    timestamp: Date.now(),
  };

  return OrderSchema.parse({
    id: data.id || crypto.randomUUID(), // Assume we have an id generator or it's passed
    orderNumber: data.orderNumber || `ORD-${Date.now()}`,
    status: initialStatus,
    statusHistory: [historyEntry],
    createdAt: Date.now(),
    updatedAt: Date.now(),
    ...data,
  });
};

export const updateOrderStatus = (order: Order, newStatus: OrderStatus, reason?: string): Order => {
  const historyEntry: StatusHistory = {
    status: newStatus,
    timestamp: Date.now(),
    ...(reason ? { reason } : {}),
  };

  return OrderSchema.parse({
    ...order,
    status: newStatus,
    statusHistory: [...order.statusHistory, historyEntry],
    updatedAt: Date.now(),
  });
};

// -----------------------------------------------------------------------------
// Eligibility rules (pure; `now` injectable for tests)
// -----------------------------------------------------------------------------

export const CANCEL_WINDOW_MS = 24 * 60 * 60 * 1000;
export const RETURN_WINDOW_MS = 7 * 24 * 60 * 60 * 1000;

export interface OrderEligibilityInput {
  status: string;
  createdAt: number;
  statusHistory?: { status: string; timestamp: number }[];
}

/** Cancellable unless shipped/delivered/cancelled/returned and within 24h of creation. */
export function canCancelOrder(order: OrderEligibilityInput, now: number = Date.now()): boolean {
  const status = order.status.toUpperCase();
  if (['SHIPPED', 'DELIVERED', 'CANCELLED', 'RETURNED'].includes(status)) return false;
  if (now - order.createdAt > CANCEL_WINDOW_MS) return false;
  return true;
}

/** Returnable when delivered/shipped and within 7d of the last delivered/shipped event. */
export function canReturnOrder(order: OrderEligibilityInput, now: number = Date.now()): boolean {
  const status = order.status.toUpperCase();
  if (status !== 'DELIVERED' && status !== 'SHIPPED') return false;
  const last = [...(order.statusHistory ?? [])]
    .reverse()
    .find((h) => ['DELIVERED', 'SHIPPED'].includes(h.status.toUpperCase()));
  const base = last?.timestamp ?? order.createdAt;
  if (now - base > RETURN_WINDOW_MS) return false;
  return true;
}