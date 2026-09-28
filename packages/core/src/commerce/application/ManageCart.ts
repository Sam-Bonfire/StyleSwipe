import { Effect } from 'effect';

import { RepositoryError } from '../../../shared/domain/errors';
import { type Cart, type CartItem, createCart, addCartItem, updateCartItemQuantity, removeCartItem } from '../domain/Cart';
import { CartNotFoundError } from '../domain/errors';
import { CartRepository } from './CartRepository';

export const addToCart = (
  userId: string,
  item: CartItem
): Effect.Effect<Cart, RepositoryError, CartRepository> =>
  Effect.gen(function* (_) {
    const repo = yield* _(CartRepository);
    const existing = yield* _(repo.findByUserId(userId));
    let cart = existing ?? createCart({ userId });
    cart = addCartItem(cart, item);
    yield* _(repo.save(cart));
    return cart;
  });

export const removeFromCart = (
  userId: string,
  productId: string,
  variantId?: string
): Effect.Effect<Cart, CartNotFoundError | RepositoryError, CartRepository> =>
  Effect.gen(function* (_) {
    const repo = yield* _(CartRepository);
    let cart = yield* _(repo.findByUserId(userId));
    if (!cart) {
      return yield* _(Effect.fail(new CartNotFoundError(userId)));
    }
    cart = removeCartItem(cart, productId, variantId);
    yield* _(repo.save(cart));
    return cart;
  });

export const updateQuantity = (
  userId: string,
  productId: string,
  quantity: number,
  variantId?: string
): Effect.Effect<Cart, CartNotFoundError | RepositoryError, CartRepository> =>
  Effect.gen(function* (_) {
    const repo = yield* _(CartRepository);
    let cart = yield* _(repo.findByUserId(userId));
    if (!cart) {
      return yield* _(Effect.fail(new CartNotFoundError(userId)));
    }
    cart = updateCartItemQuantity(cart, productId, quantity, variantId);
    yield* _(repo.save(cart));
    return cart;
  });

export const getCart = (userId: string): Effect.Effect<Cart | null, RepositoryError, CartRepository> =>
  Effect.gen(function* (_) {
    const repo = yield* _(CartRepository);
    return yield* _(repo.findByUserId(userId));
  });

export const clearCart = (userId: string): Effect.Effect<void, RepositoryError, CartRepository> =>
  Effect.gen(function* (_) {
    const repo = yield* _(CartRepository);
    return yield* _(repo.clear(userId));
  });

export interface GuestCartItemInput {
  productId: string;
  quantity: number;
  price: number;
  selectedAttributes?: Record<string, string>;
}

/**
 * Merges guest (unauthenticated) items into the user's cart.
 * Rows that cannot satisfy the CartItem invariant are dropped
 * (legacy junk must not fail the merge).
 */
export const mergeGuestCarts = (
  userId: string,
  guestItems: GuestCartItemInput[],
): Effect.Effect<Cart, RepositoryError, CartRepository> =>
  Effect.gen(function* (_) {
    const repo = yield* _(CartRepository);
    const existing = yield* _(repo.findByUserId(userId));
    let cart = existing ?? createCart({ userId });
    const sane = guestItems.filter(
      (g) =>
        g.productId &&
        Number.isInteger(g.quantity) &&
        g.quantity >= 1 &&
        g.price >= 0 &&
        (!g.selectedAttributes || Object.values(g.selectedAttributes).every((v) => typeof v === 'string')),
    );
    for (const item of sane) {
      cart = addCartItem(cart, {
        productId: item.productId,
        quantity: item.quantity,
        price: item.price,
        ...(item.selectedAttributes ? { selectedAttributes: item.selectedAttributes } : {}),
      });
    }
    yield* _(repo.save(cart));
    return cart;
  });
