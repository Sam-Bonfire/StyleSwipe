import { Effect } from 'effect';

import { RepositoryError } from '../../../shared/domain/errors';
import { Cart, CartItem } from '../domain/Cart';
import { CartNotFoundError } from '../domain/errors';
import { CartRepository } from './CartRepository';

export const addToCart = (
  userId: string,
  item: CartItem
): Effect.Effect<Cart, RepositoryError, CartRepository> =>
  Effect.gen(function* (_) {
    const repo = yield* _(CartRepository);
    const existing = yield* _(repo.findByUserId(userId));
    const cart = existing ?? new Cart(userId);
    cart.addItem(item);
    yield* _(repo.save(cart));
    return cart;
  });

export const removeFromCart = (
  userId: string,
  productId: string
): Effect.Effect<Cart, CartNotFoundError | RepositoryError, CartRepository> =>
  Effect.gen(function* (_) {
    const repo = yield* _(CartRepository);
    const cart = yield* _(repo.findByUserId(userId));
    if (!cart) {
      return yield* _(Effect.fail(new CartNotFoundError(userId)));
    }
    cart.removeItem(productId);
    yield* _(repo.save(cart));
    return cart;
  });

export const updateQuantity = (
  userId: string,
  productId: string,
  quantity: number
): Effect.Effect<Cart, CartNotFoundError | RepositoryError, CartRepository> =>
  Effect.gen(function* (_) {
    const repo = yield* _(CartRepository);
    const cart = yield* _(repo.findByUserId(userId));
    if (!cart) {
      return yield* _(Effect.fail(new CartNotFoundError(userId)));
    }
    cart.updateItemQuantity(productId, quantity);
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
