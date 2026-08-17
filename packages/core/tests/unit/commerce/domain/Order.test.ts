import { describe, expect, it } from 'vitest';

import type { Address } from '../../../../src/commerce/domain/Order';

import { Order, OrderItem, OrderStatus } from '../../../../src/commerce/domain/Order';

describe('OrderItem', () => {
    it('should calculate total as price * quantity', () => {
        const item = new OrderItem('prod-1', 3, 250, 'Nike', 'Air Max', 'img.jpg');
        expect(item.total).toBe(750);
    });

    it('should handle quantity of 1', () => {
        const item = new OrderItem('prod-1', 1, 999, 'Adidas', 'Ultraboost', 'img.jpg');
        expect(item.total).toBe(999);
    });

    it('should handle zero quantity', () => {
        const item = new OrderItem('prod-1', 0, 500, 'Puma', 'RS-X', 'img.jpg');
        expect(item.total).toBe(0);
    });
});

describe('Order', () => {
    const mockAddress: Address = {
        fullName: 'John Doe',
        street: '123 Main St',
        city: 'Mumbai',
        state: 'Maharashtra',
        zipCode: '400001',
        phone: '9876543210',
    };

    it('should default to PENDING status', () => {
        const items = [new OrderItem('prod-1', 1, 100, 'Nike', 'Shirt', 'img.jpg')];
        const order = new Order('ord-1', 'user-1', items, mockAddress, undefined, undefined, 100, 0, 5);
        expect(order.status).toBe(OrderStatus.PENDING);
    });

    it('should accept a custom status', () => {
        const items = [new OrderItem('prod-1', 1, 100, 'Nike', 'Shirt', 'img.jpg')];
        const order = new Order('ord-1', 'user-1', items, mockAddress, OrderStatus.SHIPPED, undefined, 100, 0, 5);
        expect(order.status).toBe(OrderStatus.SHIPPED);
    });

    it('should set createdAt to current time by default', () => {
        const before = Date.now();
        const items = [new OrderItem('prod-1', 1, 100, 'Nike', 'Shirt', 'img.jpg')];
        const order = new Order('ord-1', 'user-1', items, mockAddress, undefined, undefined, 100, 0, 5);
        const after = Date.now();
        expect(order.createdAt).toBeGreaterThanOrEqual(before);
        expect(order.createdAt).toBeLessThanOrEqual(after);
    });

    it('should store all constructor properties', () => {
        const items = [
            new OrderItem('prod-1', 2, 100, 'Nike', 'Shirt', 'img.jpg'),
            new OrderItem('prod-2', 1, 200, 'Adidas', 'Pants', 'img2.jpg'),
        ];
        const order = new Order('ord-1', 'user-1', items, mockAddress, OrderStatus.CONFIRMED, 1700000000000, 400, 50, 20);

        expect(order.id).toBe('ord-1');
        expect(order.userId).toBe('user-1');
        expect(order.items).toHaveLength(2);
        expect(order.shippingAddress).toEqual(mockAddress);
        expect(order.totalAmount).toBe(400);
        expect(order.shippingCost).toBe(50);
        expect(order.tax).toBe(20);
    });
});
