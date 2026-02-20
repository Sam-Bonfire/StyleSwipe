import type { CartItem } from '@app/core';

import { api } from '@app/convex';
import { ManageCart } from '@app/core';
import { ConvexClient } from 'convex/browser';
import { useConvex, useQuery } from 'convex/react';
import { Effect } from 'effect';
/**
 * useCart — Cart hooks
 * Reads wrap Convex queries; writes route through ManageCart use case.
 */
import { useMemo } from 'react';

import { CartMapper } from '../convex/mappers/CartMapper';
import { ConvexCartRepository } from '../convex/repositories/ConvexCartRepository';

/**
 * Read — fetches the user's cart.
 */
export function useCart(userId: string | undefined) {
    const data = useQuery(api.cart.getCart, userId ? { userId } : 'skip');

    return useMemo(() => (data ? CartMapper.toDomain(data) : null), [data]);
}

/**
 * Write — adds an item to the cart.
 */
export function useAddToCart() {
    const convex = useConvex();
    const repo = new ConvexCartRepository(convex as unknown as ConvexClient);
    const useCase = new ManageCart(repo);

    return (userId: string, item: CartItem) => Effect.runPromise(useCase.addToCart(userId, item));
}

/**
 * Write — removes an item from the cart.
 */
export function useRemoveFromCart() {
    const convex = useConvex();
    const repo = new ConvexCartRepository(convex as unknown as ConvexClient);
    const useCase = new ManageCart(repo);

    return (userId: string, productId: string) => Effect.runPromise(useCase.removeFromCart(userId, productId));
}

/**
 * Write — updates item quantity.
 */
export function useUpdateCartQuantity() {
    const convex = useConvex();
    const repo = new ConvexCartRepository(convex as unknown as ConvexClient);
    const useCase = new ManageCart(repo);

    return (userId: string, productId: string, quantity: number) =>
        Effect.runPromise(useCase.updateQuantity(userId, productId, quantity));
}

/**
 * Write — clears the cart.
 */
export function useClearCart() {
    const convex = useConvex();
    const repo = new ConvexCartRepository(convex as unknown as ConvexClient);
    const useCase = new ManageCart(repo);

    return (userId: string) => Effect.runPromise(useCase.clearCart(userId));
}
