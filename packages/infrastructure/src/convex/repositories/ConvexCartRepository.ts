import { api } from '@app/convex';
import { Cart, CartItem, CartRepository, RepositoryError } from '@app/core';
import { ConvexClient } from 'convex/browser';
import { GenericId } from 'convex/values';
import { Layer, Effect } from 'effect';

import { CartMapper } from '../mappers/CartMapper';

interface ConvexCartItem {
  productId: string;
  quantity: number;
  price: number;
  variantId?: string;
  selectedAttributes?: Record<string, string>;
  attributes?: Record<string, string>;
}

export class ConvexCartRepository {
    constructor(private client: ConvexClient) { }

    save(cart: Cart): Effect.Effect<void, RepositoryError> {
        return Effect.tryPromise({
            try: async () => {
                await this.client.mutation(api.cart.saveCart, {
                    userId: cart.userId,
                    items: cart.items.map((item: CartItem) => ({
                        productId: item.productId as GenericId<'products'>,
                        quantity: item.quantity,
                        price: item.price,
                        attributes: item.selectedAttributes,
                    })),
                });
            },
            catch: (e) => new RepositoryError(e instanceof Error ? e.message : String(e), e)
        });
    }

    findByUserId(userId: string): Effect.Effect<Cart | null, RepositoryError> {
        return Effect.tryPromise({
            try: async () => {
                const cartData = (await this.client.query(api.cart.getCart, { userId })) as {
                    userId: string;
                    items: ConvexCartItem[];
                } | null;

                if (!cartData) return null;

                return CartMapper.toDomain(cartData);
            },
            catch: (e) => new RepositoryError(e instanceof Error ? e.message : String(e), e)
        });
    }

    clear(userId: string): Effect.Effect<void, RepositoryError> {
        return Effect.tryPromise({
            try: async () => {
                await this.client.mutation(api.cart.clear, { userId });
            },
            catch: (e) => new RepositoryError(e instanceof Error ? e.message : String(e), e)
        });
    }
}

export const createCartRepositoryLayer = (client: ConvexClient) => {
    const repo = new ConvexCartRepository(client);
    return Layer.succeed(
        CartRepository,
        CartRepository.of({
            save: (cart: Cart) => repo.save(cart),
            findByUserId: (userId: string) => repo.findByUserId(userId),
            clear: (userId: string) => repo.clear(userId),
        })
    );
};

