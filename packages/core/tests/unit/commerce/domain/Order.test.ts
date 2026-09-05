import { describe, expect, it } from 'vitest';

import type { Address } from '../../../../src/commerce/domain/Address';

import { createOrder, updateOrderStatus, type OrderItem } from '../../../../src/commerce/domain/Order';

describe('Order Domain Schema', () => {
  const mockAddress: Address = {
    fullName: 'John Doe',
    addressLine1: '123 Main St',
    city: 'Mumbai',
    state: 'Maharashtra',
    postalCode: '400001',
    phoneNumber: '9876543210',
    country: 'India',
    isDefault: false,
  };

  it('should create an order with default PENDING status', () => {
    const items: OrderItem[] = [{ productId: 'prod-1', quantity: 1, price: 100, brand: 'Nike', title: 'Shirt', image: 'img.jpg' }];

    const order = createOrder({
      userId: 'user-1',
      items,
      deliveryAddress: mockAddress,
      pricing: {
        subtotal: 100,
        shippingCost: 0,
        discountAmount: 0,
        tax: 5,
        totalAmount: 105,
      }
    });

    expect(order.status).toBe('PENDING');
    expect(order.statusHistory.length).toBe(1);
    expect(order.statusHistory[0].status).toBe('PENDING');
  });

  it('should accept a custom initial status', () => {
    const items: OrderItem[] = [{ productId: 'prod-1', quantity: 1, price: 100 }];

    const order = createOrder({
      userId: 'user-1',
      items,
      deliveryAddress: mockAddress,
      status: 'SHIPPED',
      pricing: {
        subtotal: 100,
        shippingCost: 0,
        discountAmount: 0,
        tax: 5,
        totalAmount: 105,
      }
    });

    expect(order.status).toBe('SHIPPED');
    expect(order.statusHistory[0].status).toBe('SHIPPED');
  });

  it('should set createdAt to current time by default', () => {
    const before = Date.now();
    const items: OrderItem[] = [{ productId: 'prod-1', quantity: 1, price: 100 }];
    const order = createOrder({
      userId: 'user-1',
      items,
      deliveryAddress: mockAddress,
      pricing: { subtotal: 100, shippingCost: 0, discountAmount: 0, tax: 5, totalAmount: 105 }
    });
    const after = Date.now();

    expect(order.createdAt).toBeGreaterThanOrEqual(before);
    expect(order.createdAt).toBeLessThanOrEqual(after);
  });

  it('should update status and append to history', () => {
    const items: OrderItem[] = [{ productId: 'prod-1', quantity: 2, price: 100 }];
    let order = createOrder({
      userId: 'user-1',
      items,
      deliveryAddress: mockAddress,
      pricing: { subtotal: 200, shippingCost: 50, discountAmount: 0, tax: 20, totalAmount: 270 }
    });

    order = updateOrderStatus(order, 'CONFIRMED', 'Payment verified');

    expect(order.status).toBe('CONFIRMED');
    expect(order.statusHistory.length).toBe(2);
    expect(order.statusHistory[1].status).toBe('CONFIRMED');
    expect(order.statusHistory[1].reason).toBe('Payment verified');
  });

  it('should fail to create order with no items', () => {
    expect(() => {
      createOrder({
        userId: 'user-1',
        items: [],
        deliveryAddress: mockAddress,
        pricing: { subtotal: 0, shippingCost: 0, discountAmount: 0, tax: 0, totalAmount: 0 }
      });
    }).toThrow();
  });
});
