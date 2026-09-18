import { api } from '@app/convex';
import { useConvex, useMutation, usePaginatedQuery, useQuery } from 'convex/react';
import { useCallback } from 'react';

export function useOrders(userId: string | undefined) {
  const result = usePaginatedQuery(api.orders.listUserOrders, userId ? { userId } : 'skip', { initialNumItems: 20 });
  return result;
}

export function useOrder(orderId: string | undefined) {
  const data = useQuery(api.orders.getOrderById, orderId ? { idOrOrderNumber: orderId } : 'skip');
  return data;
}

export function usePlaceOrder() {
  // Use direct mutation via convex client for hexagonal? We'll expose a simple callback that calls api.orders.placeOrder
  const placeOrder = useMutation(api.orders.placeOrder);
  return useCallback(
    async (args: {
      userId: string;
      items: { productId: string; quantity: number; price: number; brand?: string; title?: string; image?: string; attributes?: unknown }[];
      pricing: { subtotal: number; shippingCost: number; discountAmount: number; tax: number; totalAmount: number };
      deliveryAddress: { name: string; line1: string; line2?: string; city: string; state: string; postalCode: string; country: string; phone: string };
      paymentMethod?: string;
    }) => {
      return await placeOrder(args as never);
    },
    [placeOrder]
  );
}

export function useCancelOrder() {
  const cancel = useMutation(api.orders.cancelOrder);
  return useCallback(
    async (orderId: string, reason?: string) => {
      await cancel({ orderId: orderId as never, reason });
    },
    [cancel]
  );
}

export function useReturnOrder() {
  const ret = useMutation(api.orders.returnOrder);
  return useCallback(
    async (orderId: string, reason?: string) => {
      await ret({ orderId: orderId as never, reason });
    },
    [ret]
  );
}

export function useUpdateOrderStatus() {
  const upd = useMutation(api.orders.updateOrderStatus);
  return useCallback(
    async (orderId: string, status: string, reason?: string) => {
      await upd({ orderId: orderId as never, status, reason });
    },
    [upd]
  );
}

// CheckoutService wiring helper — uses OrderRepository layer under the hood
export function useCheckoutService() {
  const convex = useConvex();
  return convex;
}
