import { CartRepository } from '@app/core';
import * as ManageCart from '@app/core';
import { Cart, CartItem } from '@app/core';
import { describe, it, expect, beforeEach, mock } from 'bun:test';
import { Effect, Exit, Layer } from 'effect';

function createMockLayer() {
    const store = new Map<string, Cart>();
    
    // Create the mock implementation matching Context.Tag structure
    const repoMock = CartRepository.of({
        save: mock((cart: Cart) => Effect.sync(() => {
            store.set(cart.userId, cart);
        })),
        findByUserId: mock((userId: string) => Effect.sync(() => {
            return store.get(userId) ?? null;
        })),
        clear: mock((userId: string) => Effect.sync(() => {
            store.delete(userId);
        })),
    });

    return {
        _store: store,
        _repoMock: repoMock,
        layer: Layer.succeed(CartRepository, repoMock)
    };
}

describe('ManageCart', () => {
    let mockContext: ReturnType<typeof createMockLayer>;

    beforeEach(() => {
        mockContext = createMockLayer();
    });

    describe('addToCart', () => {
        it('should create a new cart if none exists', async () => {
            const item = new CartItem('prod-1', 1, 100, {});
            
            const program = ManageCart.ManageCart.addToCart('user-1', item);
            const cart = await Effect.runPromise(program.pipe(Effect.provide(mockContext.layer)));

            expect(cart.userId).toBe('user-1');
            expect(cart.items).toHaveLength(1);
            expect(mockContext._repoMock.save).toHaveBeenCalledTimes(1);
        });

        it('should add to existing cart', async () => {
            const item1 = new CartItem('prod-1', 1, 100, {});
            const item2 = new CartItem('prod-2', 1, 200, {});

            await Effect.runPromise(ManageCart.ManageCart.addToCart('user-1', item1).pipe(Effect.provide(mockContext.layer)));
            const cart = await Effect.runPromise(ManageCart.ManageCart.addToCart('user-1', item2).pipe(Effect.provide(mockContext.layer)));

            expect(cart.items).toHaveLength(2);
            expect(cart.total).toBe(300);
        });

        it('should merge quantity for same product', async () => {
            const item1 = new CartItem('prod-1', 1, 100, {});
            const item2 = new CartItem('prod-1', 2, 100, {});

            await Effect.runPromise(ManageCart.ManageCart.addToCart('user-1', item1).pipe(Effect.provide(mockContext.layer)));
            const cart = await Effect.runPromise(ManageCart.ManageCart.addToCart('user-1', item2).pipe(Effect.provide(mockContext.layer)));

            expect(cart.items).toHaveLength(1);
            expect(cart.items[0].quantity).toBe(3);
        });
    });

    describe('removeFromCart', () => {
        it('should remove an item from existing cart', async () => {
            mockContext._store.set('user-1', (() => {
                const c = new Cart('user-1');
                c.addItem(new CartItem('prod-1', 1, 100, {}));
                c.addItem(new CartItem('prod-2', 1, 200, {}));
                return c;
            })());

            const cart = await Effect.runPromise(ManageCart.ManageCart.removeFromCart('user-1', 'prod-1').pipe(Effect.provide(mockContext.layer)));
            expect(cart.items).toHaveLength(1);
            expect(cart.items[0].productId).toBe('prod-2');
        });

        it('should fail with CartNotFoundError if cart not found', async () => {
            const exit = await Effect.runPromiseExit(ManageCart.ManageCart.removeFromCart('no-user', 'prod-1').pipe(Effect.provide(mockContext.layer)));

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
            mockContext._store.set('user-1', (() => {
                const c = new Cart('user-1');
                c.addItem(new CartItem('prod-1', 1, 100, {}));
                return c;
            })());

            const cart = await Effect.runPromise(ManageCart.ManageCart.updateQuantity('user-1', 'prod-1', 5).pipe(Effect.provide(mockContext.layer)));
            expect(cart.items[0].quantity).toBe(5);
            expect(mockContext._repoMock.save).toHaveBeenCalled();
        });

        it('should fail with CartNotFoundError if cart not found', async () => {
            const exit = await Effect.runPromiseExit(ManageCart.ManageCart.updateQuantity('no-user', 'prod-1', 5).pipe(Effect.provide(mockContext.layer)));

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
            mockContext._store.set('user-1', existingCart);

            const cart = await Effect.runPromise(ManageCart.ManageCart.getCart('user-1').pipe(Effect.provide(mockContext.layer)));
            expect(cart).not.toBeNull();
            expect(cart!.items).toHaveLength(1);
        });

        it('should return null if no cart', async () => {
            const cart = await Effect.runPromise(ManageCart.ManageCart.getCart('no-user').pipe(Effect.provide(mockContext.layer)));
            expect(cart).toBeNull();
        });
    });

    describe('clearCart', () => {
        it('should delegate to repo.clear', async () => {
            await Effect.runPromise(ManageCart.ManageCart.clearCart('user-1').pipe(Effect.provide(mockContext.layer)));
            expect(mockContext._repoMock.clear).toHaveBeenCalledWith('user-1');
        });
    });
});
