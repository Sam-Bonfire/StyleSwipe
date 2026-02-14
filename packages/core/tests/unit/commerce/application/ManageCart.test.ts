import { describe, it, expect, beforeEach, mock } from 'bun:test';
import { Effect, Exit } from 'effect';

import type { CartRepository } from '../../../../src/commerce/domain/CartRepository';

import { ManageCart } from '../../../../src/commerce/application/ManageCart';
import { Cart, CartItem } from '../../../../src/commerce/domain/Cart';

function createMockRepo(): CartRepository & { _store: Map<string, Cart> } {
    const store = new Map<string, Cart>();
    return {
        _store: store,
        save: mock(async (cart: Cart) => {
            store.set(cart.userId, cart);
        }),
        findByUserId: mock(async (userId: string) => {
            return store.get(userId) ?? null;
        }),
        clear: mock(async (userId: string) => {
            store.delete(userId);
        }),
    };
}

describe('ManageCart', () => {
    let repo: ReturnType<typeof createMockRepo>;
    let useCase: ManageCart;

    beforeEach(() => {
        repo = createMockRepo();
        useCase = new ManageCart(repo);
    });

    describe('addToCart', () => {
        it('should create a new cart if none exists', async () => {
            const item = new CartItem('prod-1', 1, 100, {});
            const cart = await Effect.runPromise(useCase.addToCart('user-1', item));

            expect(cart.userId).toBe('user-1');
            expect(cart.items).toHaveLength(1);
            expect(repo.save).toHaveBeenCalledTimes(1);
        });

        it('should add to existing cart', async () => {
            const item1 = new CartItem('prod-1', 1, 100, {});
            const item2 = new CartItem('prod-2', 1, 200, {});

            await Effect.runPromise(useCase.addToCart('user-1', item1));
            const cart = await Effect.runPromise(useCase.addToCart('user-1', item2));

            expect(cart.items).toHaveLength(2);
            expect(cart.total).toBe(300);
        });

        it('should merge quantity for same product', async () => {
            const item1 = new CartItem('prod-1', 1, 100, {});
            const item2 = new CartItem('prod-1', 2, 100, {});

            await Effect.runPromise(useCase.addToCart('user-1', item1));
            const cart = await Effect.runPromise(useCase.addToCart('user-1', item2));

            expect(cart.items).toHaveLength(1);
            expect(cart.items[0].quantity).toBe(3);
        });
    });

    describe('removeFromCart', () => {
        it('should remove an item from existing cart', async () => {
            repo._store.set('user-1', (() => {
                const c = new Cart('user-1');
                c.addItem(new CartItem('prod-1', 1, 100, {}));
                c.addItem(new CartItem('prod-2', 1, 200, {}));
                return c;
            })());

            const cart = await Effect.runPromise(useCase.removeFromCart('user-1', 'prod-1'));
            expect(cart.items).toHaveLength(1);
            expect(cart.items[0].productId).toBe('prod-2');
        });

        it('should fail with CartNotFoundError if cart not found', async () => {
            const exit = await Effect.runPromiseExit(useCase.removeFromCart('no-user', 'prod-1'));

            expect(Exit.isFailure(exit)).toBe(true);
            if (Exit.isFailure(exit)) {
                const error = exit.cause.toJSON();
                // The cause contains the CartNotFoundError
                expect(JSON.stringify(error)).toContain('CartNotFoundError');
            }
        });
    });

    describe('updateQuantity', () => {
        it('should update item quantity', async () => {
            repo._store.set('user-1', (() => {
                const c = new Cart('user-1');
                c.addItem(new CartItem('prod-1', 1, 100, {}));
                return c;
            })());

            const cart = await Effect.runPromise(useCase.updateQuantity('user-1', 'prod-1', 5));
            expect(cart.items[0].quantity).toBe(5);
            expect(repo.save).toHaveBeenCalled();
        });

        it('should fail with CartNotFoundError if cart not found', async () => {
            const exit = await Effect.runPromiseExit(useCase.updateQuantity('no-user', 'prod-1', 5));

            expect(Exit.isFailure(exit)).toBe(true);
            if (Exit.isFailure(exit)) {
                const error = exit.cause.toJSON();
                expect(JSON.stringify(error)).toContain('CartNotFoundError');
            }
        });
    });

    describe('getCart', () => {
        it('should return cart if exists', async () => {
            const existingCart = new Cart('user-1');
            existingCart.addItem(new CartItem('prod-1', 1, 100, {}));
            repo._store.set('user-1', existingCart);

            const cart = await Effect.runPromise(useCase.getCart('user-1'));
            expect(cart).not.toBeNull();
            expect(cart!.items).toHaveLength(1);
        });

        it('should return null if no cart', async () => {
            const cart = await Effect.runPromise(useCase.getCart('no-user'));
            expect(cart).toBeNull();
        });
    });

    describe('clearCart', () => {
        it('should delegate to repo.clear', async () => {
            await Effect.runPromise(useCase.clearCart('user-1'));
            expect(repo.clear).toHaveBeenCalledWith('user-1');
        });
    });
});
