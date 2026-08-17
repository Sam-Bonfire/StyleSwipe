import { describe, expect, it } from 'vitest';

import { Cart, CartItem } from '../../../../src/commerce/domain/Cart';
import { PriceEstimator } from '../../../../src/commerce/domain/PriceEstimator';

describe('PriceEstimator', () => {
    function makeCart(items: { price: number; qty: number }[]): Cart {
        const cart = new Cart('user-1');
        for (const { price, qty } of items) {
            cart.addItem(new CartItem(`prod-${price}`, qty, price, {}));
        }
        return cart;
    }

    it('should calculate subtotal correctly', () => {
        const cart = makeCart([{ price: 200, qty: 2 }, { price: 100, qty: 1 }]);
        const result = PriceEstimator.estimate(cart);
        expect(result.subtotal).toBe(500);
    });

    it('should charge shipping below threshold', () => {
        const cart = makeCart([{ price: 100, qty: 1 }]);
        const result = PriceEstimator.estimate(cart);
        expect(result.shipping).toBe(100);
        expect(result.isFreeShipping).toBe(false);
    });

    it('should give free shipping at threshold', () => {
        const cart = makeCart([{ price: 1000, qty: 1 }]);
        const result = PriceEstimator.estimate(cart);
        expect(result.shipping).toBe(0);
        expect(result.isFreeShipping).toBe(true);
    });

    it('should give free shipping above threshold', () => {
        const cart = makeCart([{ price: 1500, qty: 1 }]);
        const result = PriceEstimator.estimate(cart);
        expect(result.shipping).toBe(0);
        expect(result.isFreeShipping).toBe(true);
    });

    it('should calculate 5% tax on subtotal', () => {
        const cart = makeCart([{ price: 200, qty: 1 }]);
        const result = PriceEstimator.estimate(cart);
        expect(result.tax).toBe(10); // 200 * 0.05
    });

    it('should round tax to nearest integer', () => {
        const cart = makeCart([{ price: 333, qty: 1 }]);
        const result = PriceEstimator.estimate(cart);
        expect(result.tax).toBe(Math.round(333 * 0.05));
    });

    it('should set discount to 0', () => {
        const cart = makeCart([{ price: 500, qty: 2 }]);
        const result = PriceEstimator.estimate(cart);
        expect(result.discount).toBe(0);
    });

    it('should calculate total = subtotal + shipping + tax - discount', () => {
        const cart = makeCart([{ price: 100, qty: 1 }]);
        const result = PriceEstimator.estimate(cart);
        // subtotal=100, shipping=100(below threshold), tax=5, discount=0
        expect(result.total).toBe(100 + 100 + 5 - 0);
    });

    it('should handle empty cart', () => {
        const cart = new Cart('user-1');
        const result = PriceEstimator.estimate(cart);
        expect(result.subtotal).toBe(0);
        expect(result.shipping).toBe(100); // below threshold
        expect(result.tax).toBe(0);
        expect(result.total).toBe(100); // only shipping
        expect(result.isFreeShipping).toBe(false);
    });
});
