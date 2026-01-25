import { describe, it, expect } from 'bun:test';

import { Cart, CartItem } from './Cart';

describe('Cart', () => {
    it('should add items and calculate total', () => {
        const cart = new Cart('user-1');
        const item1 = new CartItem('prod-1', 1, 100, {});
        const item2 = new CartItem('prod-2', 2, 50, {});

        cart.addItem(item1);
        cart.addItem(item2);

        expect(cart.items.length).toBe(2);
        expect(cart.total).toBe(200);
    });

    it('should update quantity if item exists', () => {
        const cart = new Cart('user-1');
        const item1 = new CartItem('prod-1', 1, 100, {});
        cart.addItem(item1);

        const item2 = new CartItem('prod-1', 2, 100, {});
        cart.addItem(item2);

        expect(cart.items.length).toBe(1);
        expect(cart.items[0].quantity).toBe(3);
        expect(cart.total).toBe(300);
    });

    it('should remove items', () => {
        const cart = new Cart('user-1');
        const item1 = new CartItem('prod-1', 1, 100, {});
        cart.addItem(item1);
        cart.removeItem('prod-1');

        expect(cart.items.length).toBe(0);
        expect(cart.total).toBe(0);
    });
});
