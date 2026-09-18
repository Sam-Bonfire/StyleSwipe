import { createCart, addCartItem } from '@app/core';
import { Effect } from 'effect';
import { describe, expect, it, beforeEach, vi } from 'vitest';

import { ConvexCartRepository } from '../../../src/convex/repositories/ConvexCartRepository';

// Mock ConvexClient with typed method signatures
function createMockClient() {
    return {
        mutation: vi.fn(() => Promise.resolve()),
        query: vi.fn(() => Promise.resolve(null)),
    };
}

describe('ConvexCartRepository', () => {
    let mockClient: ReturnType<typeof createMockClient>;
    let repo: ConvexCartRepository;

    beforeEach(() => {
        mockClient = createMockClient();
        repo = new ConvexCartRepository(mockClient as never);
    });

    describe('save', () => {
        it('should call mutation with transformed cart data', async () => {
            let cart = createCart({ userId: 'user-1' });
            cart = addCartItem(cart, { productId: 'prod-1', quantity: 2, price: 500, selectedAttributes: { size: 'M' } });
            cart = addCartItem(cart, { productId: 'prod-2', quantity: 1, price: 300, selectedAttributes: {} });

            await Effect.runPromise(repo.save(cart));

            expect(mockClient.mutation).toHaveBeenCalledTimes(1);
            const callArgs = mockClient.mutation.mock.calls[0];
            expect(callArgs[1]).toEqual({
                userId: 'user-1',
                items: [
                    { productId: 'prod-1', quantity: 2, price: 500, attributes: { size: 'M' } },
                    { productId: 'prod-2', quantity: 1, price: 300, attributes: {} },
                ],
            });
        });

        it('should handle empty cart', async () => {
            const cart = createCart({ userId: 'user-1' });
            await Effect.runPromise(repo.save(cart));

            expect(mockClient.mutation).toHaveBeenCalledTimes(1);
            const callArgs = mockClient.mutation.mock.calls[0];
            expect(callArgs[1]).toEqual({
                userId: 'user-1',
                items: [],
            });
        });
    });

    describe('findByUserId', () => {
        it('should return null when no cart exists', async () => {
            mockClient.query = vi.fn(() => Promise.resolve(null));
            const result = await Effect.runPromise(repo.findByUserId('user-1'));
            expect(result).toBeNull();
        });

        it('should reconstruct Cart domain object from Convex data', async () => {
            mockClient.query = vi.fn(() =>
                Promise.resolve({
                    userId: 'user-1',
                    items: [
                        { productId: 'prod-1', quantity: 2, price: 500, attributes: { size: 'M' } },
                        { productId: 'prod-2', quantity: 1, price: 300 },
                    ],
                }),
            ) as never;

            const result = await Effect.runPromise(repo.findByUserId('user-1'));

            expect(result).not.toBeNull();
            expect(result!.userId).toBe('user-1');
            expect(result!.items).toHaveLength(2);
            expect(result!.items[0].productId).toBe('prod-1');
            expect(result!.items[0].quantity).toBe(2);
            expect(result!.items[0].price).toBe(500);
            expect(result!.items[0].selectedAttributes).toEqual({ size: 'M' });
        });

        it('should default missing attributes to empty object', async () => {
            mockClient.query = vi.fn(() =>
                Promise.resolve({
                    userId: 'user-1',
                    items: [{ productId: 'prod-1', quantity: 1, price: 100 }],
                }),
            ) as never;

            const result = await Effect.runPromise(repo.findByUserId('user-1'));
            expect(result!.items[0].selectedAttributes).toEqual({});
        });
    });

    describe('clear', () => {
        it('should call mutation with userId', async () => {
            await Effect.runPromise(repo.clear('user-1'));

            expect(mockClient.mutation).toHaveBeenCalledTimes(1);
            const callArgs = mockClient.mutation.mock.calls[0];
            expect(callArgs[1]).toEqual({ userId: 'user-1' });
        });
    });
});
