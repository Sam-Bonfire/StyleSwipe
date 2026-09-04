import { api } from '@app/convex';
import { Order, OrderRepository, RepositoryError, type OrderItem, createOrder } from '@app/core';
import { ConvexClient } from 'convex/browser';
import { Effect, Layer } from 'effect';

export class ConvexOrderRepository {
  constructor(private client: ConvexClient) {}

  save(order: Order): Effect.Effect<void, RepositoryError> {
    return Effect.tryPromise({
      try: async () => {
        // Direct insertion via placeOrder is preferred; but for CheckoutService compatibility we map to placeOrder
        // If order already exists, update status? For MVP, assume new order -> call placeOrder
        await this.client.mutation(api.orders.placeOrder, {
          userId: order.userId,
          items: order.items.map((i: OrderItem) => ({
            productId: i.productId,
            quantity: i.quantity,
            price: i.price,
            brand: i.brand,
            title: i.title,
            image: i.image,
          })),
          pricing: order.pricing,
          deliveryAddress: {
            name: order.deliveryAddress.fullName,
            line1: order.deliveryAddress.addressLine1,
            line2: order.deliveryAddress.addressLine2,
            city: order.deliveryAddress.city,
            state: order.deliveryAddress.state,
            postalCode: order.deliveryAddress.postalCode,
            country: order.deliveryAddress.country,
            phone: order.deliveryAddress.phoneNumber,
          },
          paymentMethod: order.paymentInfo?.method,
          paymentInfo: order.paymentInfo
            ? { method: order.paymentInfo.method, transactionId: order.paymentInfo.transactionId, paymentStatus: order.paymentInfo.paymentStatus as never }
            : undefined,
        });
      },
      catch: (e) => new RepositoryError(e instanceof Error ? e.message : String(e), e),
    });
  }

  findById(id: string): Effect.Effect<Order | null, RepositoryError> {
    return Effect.tryPromise({
      try: async () => {
        const doc = (await this.client.query(api.orders.getOrderById, { idOrOrderNumber: id })) as unknown as Record<string, unknown> | null;
        if (!doc) return null;
        return mapConvexOrderToDomain(doc);
      },
      catch: (e) => new RepositoryError(e instanceof Error ? e.message : String(e), e),
    });
  }

  listByUser(userId: string): Effect.Effect<Order[], RepositoryError> {
    return Effect.tryPromise({
      try: async () => {
        // Use pagination with large limit for simple list
        const result = (await this.client.query(api.orders.listUserOrders, { userId, paginationOpts: { numItems: 100, cursor: null } })) as { page: unknown[] };
        return result.page.map((d) => mapConvexOrderToDomain(d as Record<string, unknown>));
      },
      catch: (e) => new RepositoryError(e instanceof Error ? e.message : String(e), e),
    });
  }

  updateStatus(orderId: string, status: string, reason?: string): Effect.Effect<void, RepositoryError> {
    return Effect.tryPromise({
      try: async () => {
        await this.client.mutation(api.orders.updateOrderStatus, { orderId: orderId as never, status, reason });
      },
      catch: (e) => new RepositoryError(e instanceof Error ? e.message : String(e), e),
    });
  }
}

function mapConvexOrderToDomain(doc: Record<string, unknown>): Order {
  const d = doc as unknown as {
    _id: string;
    orderNumber: string;
    userId: string;
    items: OrderItem[];
    pricing: { subtotal: number; shippingCost: number; discountAmount: number; tax: number; totalAmount: number };
    deliveryAddress: { name: string; line1: string; line2?: string; city: string; state: string; postalCode: string; country: string; phone: string };
    paymentInfo?: { method: string; transactionId?: string; paymentStatus: string };
    tracking?: { carrier: string; trackingNumber: string; estimatedDeliveryDate?: number };
    trackingId?: string;
    status: string;
    statusHistory: { status: string; timestamp: number; reason?: string }[];
    createdAt: number;
    updatedAt: number;
  };
  return createOrder({
    id: d._id,
    orderNumber: d.orderNumber,
    userId: d.userId,
    items: d.items,
    pricing: d.pricing,
    deliveryAddress: {
      fullName: d.deliveryAddress.name,
      addressLine1: d.deliveryAddress.line1,
      addressLine2: d.deliveryAddress.line2,
      city: d.deliveryAddress.city,
      state: d.deliveryAddress.state,
      postalCode: d.deliveryAddress.postalCode,
      country: d.deliveryAddress.country,
      phoneNumber: d.deliveryAddress.phone,
      isDefault: false,
    },
    paymentInfo: d.paymentInfo as never,
    tracking: d.tracking as never,
    status: d.status as never,
    statusHistory: d.statusHistory as never,
    createdAt: d.createdAt,
    updatedAt: d.updatedAt,
  });
}

export const createOrderRepositoryLayer = (client: ConvexClient) =>
  Layer.succeed(
    OrderRepository,
    OrderRepository.of({
      save: (order: Order) => new ConvexOrderRepository(client).save(order),
      findById: (id: string) => new ConvexOrderRepository(client).findById(id),
      listByUser: (userId: string) => new ConvexOrderRepository(client).listByUser(userId),
      updateStatus: (orderId: string, status: string, reason?: string) => new ConvexOrderRepository(client).updateStatus(orderId, status, reason),
    })
  );
