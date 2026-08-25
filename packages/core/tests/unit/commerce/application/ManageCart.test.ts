import { Effect, Exit, Layer } from 'effect';
import { describe, expect, it, vi, beforeEach } from 'vitest';

import { CartRepository } from '../../../../src/commerce/application/CartRepository';
import * as ManageCart from '../../../../src/commerce/application/ManageCart';
import { type Cart, type CartItem, createCart, addCartItem } from '../../../../src/commerce/domain/Cart';

function createMockLayer() {
    const store = new Map<string, Cart>();
    
    // Create the mock implementation matching Context.Tag structure
    const repoMock = CartRepository.of({
        save: vi.fn((cart: Cart) => Effect.sync(() => {
            store.set(cart.userId, cart);
        })),
        findByUserId: vi.fn((userId: string) => Effect.sync(() => {
            return store.get(userId) ?? null;
        })),
        clear: vi.fn((userId: string) => Effect.sync(() => {
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
            const item: CartItem = { productId: 'prod-1', quantity: 1, price: 100, selectedAttributes: {} };
            
            const program = ManageCart.addToCart('user-1', item);
            const cart = await Effect.runPromise(program.pipe(Effect.provide(mockContext.layer)));

            expect(cart.userId).toBe('user-1');
            expect(cart.items).toHaveLength(1);
            expect(mockContext._repoMock.save).toHaveBeenCalledTimes(1);
        });

        it('should add to existing cart', async () => {
            const item1: CartItem = { productId: 'prod-1', quantity: 1, price: 100, selectedAttributes: {} };
            const item2: CartItem = { productId: 'prod-2', quantity: 1, price: 200, selectedAttributes: {} };

            await Effect.runPromise(ManageCart.addToCart('user-1', item1).pipe(Effect.provide(mockContext.layer)));
            const cart = await Effect.runPromise(ManageCart.addToCart('user-1', item2).pipe(Effect.provide(mockContext.layer)));

            expect(cart.items).toHaveLength(2);
            expect(cart.total).toBe(300);
        });

        it('should merge quantity for same product', async () => {
            const item1: CartItem = { productId: 'prod-1', quantity: 1, price: 100, selectedAttributes: {} };
            const item2: CartItem = { productId: 'prod-1', quantity: 2, price: 100, selectedAttributes: {} };

            await Effect.runPromise(ManageCart.addToCart('user-1', item1).pipe(Effect.provide(mockContext.layer)));
            const cart = await Effect.runPromise(ManageCart.addToCart('user-1', item2).pipe(Effect.provide(mockContext.layer)));

            expect(cart.items).toHaveLength(1);
            expect(cart.items[0].quantity).toBe(3);
        });
    });

    describe('removeFromCart', () => {
        it('should remove an item from existing cart', async () => {
            mockContext._store.set('user-1', (() => {
                let c = createCart({ userId: 'user-1' });
                c = addCartItem(c, { productId: 'prod-1', quantity: 1, price: 100, selectedAttributes: {} });
                c = addCartItem(c, { productId: 'prod-2', quantity: 1, price: 200, selectedAttributes: {} });
                return c;
            })());

            const cart = await Effect.runPromise(ManageCart.removeFromCart('user-1', 'prod-1').pipe(Effect.provide(mockContext.layer)));
            expect(cart.items).toHaveLength(1);
            expect(cart.items[0].productId).toBe('prod-2');
        });

        it('should fail with CartNotFoundError if cart not found', async () => {
            const exit = await Effect.runPromiseExit(ManageCart.removeFromCart('no-user', 'prod-1').pipe(Effect.provide(mockContext.layer)));

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
                let c = createCart({ userId: 'user-1' });
                c = addCartItem(c, { productId: 'prod-1', quantity: 1, price: 100, selectedAttributes: {} });
                return c;
            })());

            const cart = await Effect.runPromise(ManageCart.updateQuantity('user-1', 'prod-1', 5).pipe(Effect.provide(mockContext.layer)));
            expect(cart.items[0].quantity).toBe(5);
            expect(mockContext._repoMock.save).toHaveBeenCalled();
        });

        it('should fail with CartNotFoundError if cart not found', async () => {
            const exit = await Effect.runPromiseExit(ManageCart.updateQuantity('no-user', 'prod-1', 5).pipe(Effect.provide(mockContext.layer)));

            expect(Exit.isFailure(exit)).toBe(true);
            if (Exit.isFailure(exit)) {
                const error = exit.cause.toJSON();
                expect(JSON.stringify(error)).toContain('CartNotFoundError');
            }
        });
    });

    describe('getCart', () => {
        it('should return cart if exists', async () => {
            let existingCart = createCart({ userId: 'user-1' });
            existingCart = addCartItem(existingCart, { productId: 'prod-1', quantity: 1, price: 100, selectedAttributes: {} });
            mockContext._store.set('user-1', existingCart);

            const cart = await Effect.runPromise(ManageCart.getCart('user-1').pipe(Effect.provide(mockContext.layer)));
            expect(cart).not.toBeNull();
            expect(cart!.items).toHaveLength(1);
        });

        it('should return null if no cart', async () => {
            const cart = await Effect.runPromise(ManageCart.getCart('no-user').pipe(Effect.provide(mockContext.layer)));
            expect(cart).toBeNull();
        });
    });

    describe('clearCart', () => {
        it('should delegate to repo.clear', async () => {
            await Effect.runPromise(ManageCart.clearCart('user-1').pipe(Effect.provide(mockContext.layer)));
            expect(mockContext._repoMock.clear).toHaveBeenCalledWith('user-1');
        });
    });
});
