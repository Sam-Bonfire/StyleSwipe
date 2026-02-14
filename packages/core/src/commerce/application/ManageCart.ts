import { Effect } from 'effect';

import { Cart, CartItem } from '../domain/Cart';
import { CartRepository } from '../domain/CartRepository';
import { CartNotFoundError, RepositoryError } from '../domain/errors';

export class ManageCart {
  constructor(private repo: CartRepository) { }

  addToCart(
    userId: string,
    item: CartItem,
  ): Effect.Effect<Cart, RepositoryError> {
    return Effect.gen(this, function* (_) {
      const existing = yield* _(
        Effect.tryPromise({
          try: () => this.repo.findByUserId(userId),
          catch: (e) => new RepositoryError('findByUserId', e),
        }),
      );

      const cart = existing ?? new Cart(userId);
      cart.addItem(item);

      yield* _(
        Effect.tryPromise({
          try: () => this.repo.save(cart),
          catch: (e) => new RepositoryError('save', e),
        }),
      );

      return cart;
    });
  }

  removeFromCart(
    userId: string,
    productId: string,
  ): Effect.Effect<Cart, CartNotFoundError | RepositoryError> {
    return Effect.gen(this, function* (_) {
      const cart = yield* _(
        Effect.tryPromise({
          try: () => this.repo.findByUserId(userId),
          catch: (e) => new RepositoryError('findByUserId', e),
        }),
      );

      if (!cart) {
        return yield* _(Effect.fail(new CartNotFoundError(userId)));
      }

      cart.removeItem(productId);

      yield* _(
        Effect.tryPromise({
          try: () => this.repo.save(cart),
          catch: (e) => new RepositoryError('save', e),
        }),
      );

      return cart;
    });
  }

  updateQuantity(
    userId: string,
    productId: string,
    quantity: number,
  ): Effect.Effect<Cart, CartNotFoundError | RepositoryError> {
    return Effect.gen(this, function* (_) {
      const cart = yield* _(
        Effect.tryPromise({
          try: () => this.repo.findByUserId(userId),
          catch: (e) => new RepositoryError('findByUserId', e),
        }),
      );

      if (!cart) {
        return yield* _(Effect.fail(new CartNotFoundError(userId)));
      }

      cart.updateItemQuantity(productId, quantity);

      yield* _(
        Effect.tryPromise({
          try: () => this.repo.save(cart),
          catch: (e) => new RepositoryError('save', e),
        }),
      );

      return cart;
    });
  }

  getCart(
    userId: string,
  ): Effect.Effect<Cart | null, RepositoryError> {
    return Effect.tryPromise({
      try: () => this.repo.findByUserId(userId),
      catch: (e) => new RepositoryError('findByUserId', e),
    });
  }

  clearCart(
    userId: string,
  ): Effect.Effect<void, RepositoryError> {
    return Effect.tryPromise({
      try: () => this.repo.clear(userId),
      catch: (e) => new RepositoryError('clear', e),
    });
  }
}
