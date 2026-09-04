import { Effect, Exit, Layer } from 'effect';
import { describe, expect, it, vi } from 'vitest';

import * as CheckoutService from '../../../../src/commerce/application/CheckoutService';
import { OrderRepository } from '../../../../src/commerce/application/OrderRepository';
import { type Address } from '../../../../src/commerce/domain/Address';
import { createCart, addCartItem } from '../../../../src/commerce/domain/Cart';

describe('CheckoutService', () => {
  it('should create an order from a cart', async () => {
    const repoMock = OrderRepository.of({
      save: vi.fn(() => Effect.succeed(undefined)),
      findById: vi.fn(() => Effect.succeed(null)),
      listByUser: vi.fn(() => Effect.succeed([])),
      updateStatus: vi.fn(() => Effect.succeed(undefined)),
    });
    
    const layer = Layer.succeed(OrderRepository, repoMock);

    let cart = createCart({ userId: 'user-1' });
    cart = addCartItem(cart, { productId: 'prod-1', quantity: 1, price: 1000, selectedAttributes: { brand: 'Test' } });

    const address: Address = {
      fullName: 'Sam Altman',
      addressLine1: '123 AI Blvd',
      city: 'San Francisco',
      state: 'CA',
      postalCode: '94103',
      phoneNumber: '5550199000',
      country: 'US',
      isDefault: false
    };

    const order = await Effect.runPromise(
      CheckoutService.createOrderFromCart(cart, address, () => 'order-123').pipe(Effect.provide(layer))
    );

    expect(order.id).toBe('order-123');
    expect(order.pricing.totalAmount).toBeGreaterThan(1000); // Including tax/shipping
    expect(repoMock.save).toHaveBeenCalledTimes(1);
  });

  it('should fail with EmptyCartError on empty cart', async () => {
    const repoMock = OrderRepository.of({
      save: vi.fn(() => Effect.succeed(undefined)),
      findById: vi.fn(() => Effect.succeed(null)),
      listByUser: vi.fn(() => Effect.succeed([])),
      updateStatus: vi.fn(() => Effect.succeed(undefined)),
    });
    
    const layer = Layer.succeed(OrderRepository, repoMock);
    
    const cart = createCart({ userId: 'user-1' }); // Empty
    const address: Address = {
      fullName: 'Sam Altman',
      addressLine1: '123 AI Blvd',
      city: 'San Francisco',
      state: 'CA',
      postalCode: '94103',
      phoneNumber: '5550199000',
      country: 'US',
      isDefault: false
    };

    const exit = await Effect.runPromiseExit(
      CheckoutService.createOrderFromCart(cart, address, () => '1').pipe(Effect.provide(layer))
    );

    expect(Exit.isFailure(exit)).toBe(true);
    if (Exit.isFailure(exit)) {
      const error = exit.cause.toJSON();
      expect(JSON.stringify(error)).toContain('EmptyCartError');
    }
  });
});
