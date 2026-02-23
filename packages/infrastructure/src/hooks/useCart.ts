import type { CartItem } from '@app/core';

import { api } from '@app/convex';
import { ManageCart } from '@app/core';
import { ConvexClient } from 'convex/browser';
import { useConvex, useQuery } from 'convex/react';
import { Effect } from 'effect';
import React from 'react';

import { createCartRepositoryLayer } from '../convex';
import { CartMapper } from '../convex/mappers/CartMapper';

export function useCart(userId: string | undefined) {
  const data = useQuery(api.cart.getCart, userId ? { userId } : 'skip');

  return React.useMemo(() => (data ? CartMapper.toDomain(data) : null), [data]);
}

export function useAddToCart() {
  const convex = useConvex();
  return (userId: string, item: CartItem) => {
    const program = ManageCart.addToCart(userId, item);
    const layer = createCartRepositoryLayer(convex as unknown as ConvexClient);
    return Effect.runPromise(program.pipe(Effect.provide(layer)));
  };
}

export function useRemoveFromCart() {
  const convex = useConvex();
  return (userId: string, productId: string) => {
    const program = ManageCart.removeFromCart(userId, productId);
    const layer = createCartRepositoryLayer(convex as unknown as ConvexClient);
    return Effect.runPromise(program.pipe(Effect.provide(layer)));
  };
}

export function useUpdateCartQuantity() {
  const convex = useConvex();
  return (userId: string, productId: string, quantity: number) => {
    const program = ManageCart.updateQuantity(userId, productId, quantity);
    const layer = createCartRepositoryLayer(convex as unknown as ConvexClient);
    return Effect.runPromise(program.pipe(Effect.provide(layer)));
  };
}

export function useClearCart() {
  const convex = useConvex();
  return (userId: string) => {
    const program = ManageCart.clearCart(userId);
    const layer = createCartRepositoryLayer(convex as unknown as ConvexClient);
    return Effect.runPromise(program.pipe(Effect.provide(layer)));
  };
}
