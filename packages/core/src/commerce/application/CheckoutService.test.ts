import { describe, it, expect, mock } from 'bun:test';

import { Cart, CartItem } from '../domain/Cart';
import { Address } from '../domain/Order';
import { CheckoutService } from './CheckoutService';

describe('CheckoutService', () => {
  it('should create an order from a cart', async () => {
    const mockRepo = {
      save: mock(() => Promise.resolve()),
      findById: mock(() => Promise.resolve(null)),
    };
    const service = new CheckoutService(mockRepo);

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

    const order = await service.createOrderFromCart(cart, address, () => 'order-123');

    expect(order.id).toBe('order-123');
    expect(order.totalAmount).toBeGreaterThan(1000); // Including tax/shipping
    expect(mockRepo.save).toHaveBeenCalledTimes(1);
  });

  it('should throw on empty cart', async () => {
    const mockRepo = {
      save: mock(() => Promise.resolve()),
      findById: mock(() => Promise.resolve(null)),
    };
    const service = new CheckoutService(mockRepo);
    const cart = new Cart('user-1'); // Empty
    const address: Address = {
      fullName: 'Sam Altman',
      street: '123 AI Blvd',
      city: 'San Francisco',
      state: 'CA',
      zipCode: '94103',
      phone: '555-0199',
    };

    expect(service.createOrderFromCart(cart, address, () => '1')).rejects.toThrow();
  });
});
