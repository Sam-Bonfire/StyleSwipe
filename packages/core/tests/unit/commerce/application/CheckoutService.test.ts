import * as CheckoutService from '@app/core';
import { Cart, CartItem, type Address } from '@app/core';
import { Effect, Exit, Layer } from 'effect';
import { describe, expect, it, vi } from 'vitest';

import { OrderRepository } from '../../../../src/commerce/application/CheckoutService';

describe('CheckoutService', () => {
  it('should create an order from a cart', async () => {
    const repoMock = OrderRepository.of({
      save: vi.fn(() => Effect.succeed(undefined)),
      findById: vi.fn(() => Effect.succeed(null)),
    });
    
    const layer = Layer.succeed(OrderRepository, repoMock);

    const cart = new Cart('user-1');
    cart.addItem(new CartItem('prod-1', 1, 1000, { brand: 'Test' }));

    const address: Address = {
      fullName: 'Sam Altman',
      street: '123 AI Blvd',
      city: 'San Francisco',
      state: 'CA',
      zipCode: '94103',
      phone: '555-0199',
    };

    const order = await Effect.runPromise(
      CheckoutService.createOrderFromCart(cart, address, () => 'order-123').pipe(Effect.provide(layer))
    );

    expect(order.id).toBe('order-123');
    expect(order.totalAmount).toBeGreaterThan(1000); // Including tax/shipping
    expect(repoMock.save).toHaveBeenCalledTimes(1);
  });

  it('should fail with EmptyCartError on empty cart', async () => {
    const repoMock = OrderRepository.of({
      save: vi.fn(() => Effect.succeed(undefined)),
      findById: vi.fn(() => Effect.succeed(null)),
    });
    
    const layer = Layer.succeed(OrderRepository, repoMock);
    
    const cart = new Cart('user-1'); // Empty
    const address: Address = {
      fullName: 'Sam Altman',
      street: '123 AI Blvd',
      city: 'San Francisco',
      state: 'CA',
      zipCode: '94103',
      phone: '555-0199',
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
