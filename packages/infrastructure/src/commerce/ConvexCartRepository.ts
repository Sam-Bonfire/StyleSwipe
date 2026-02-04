import { Cart, CartItem, CartRepository } from '@app/core';
import { api } from '@convex-api';
import { ConvexClient } from 'convex/browser';
import { GenericId } from 'convex/values';

interface ConvexCartItem {
  productId: string;
  quantity: number;
  price: number;
  attributes?: Record<string, string>;
}

export class ConvexCartRepository implements CartRepository {
  constructor(private client: ConvexClient) { }

  async save(cart: Cart): Promise<void> {
    await this.client.mutation(api.cart.saveCart, {
      userId: cart.userId,
      items: cart.items.map((item: CartItem) => ({
        productId: item.productId as GenericId<'products'>,
        quantity: item.quantity,
        price: item.price,
        attributes: item.attributes,
      })),
    });
  }

  async findByUserId(userId: string): Promise<Cart | null> {
    const cartData = (await this.client.query(api.cart.getCart, { userId })) as {
      userId: string;
      items: ConvexCartItem[];
    } | null;

    if (!cartData) return null;

    const items = cartData.items.map(
      (i) => new CartItem(i.productId, i.quantity, i.price, i.attributes || {}),
    );

    return new Cart(cartData.userId, items);
  }
}
