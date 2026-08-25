import { describe, expect, it } from 'vitest';

import { createCart, addCartItem, updateCartItemQuantity, removeCartItem, CartItem } from '../../../../src/commerce/domain/Cart';

describe('Cart Domain Schema', () => {
  it('should initialize an empty cart and calculate initial totals', () => {
    const cart = createCart({ userId: 'user-1' });

    expect(cart.userId).toBe('user-1');
    expect(cart.items.length).toBe(0);
    expect(cart.subtotal).toBe(0);
    expect(cart.total).toBe(0);
  });

  it('should add items and recalculate totals', () => {
    let cart = createCart({ userId: 'user-1' });
    const item1: CartItem = { productId: 'prod-1', quantity: 1, price: 100, selectedAttributes: {} };
    const item2: CartItem = { productId: 'prod-2', quantity: 2, price: 50, selectedAttributes: {} };

    cart = addCartItem(cart, item1);
    cart = addCartItem(cart, item2);

    expect(cart.items.length).toBe(2);
    expect(cart.subtotal).toBe(200);
    expect(cart.total).toBe(200); // Assuming no discount/tax
  });

  it('should update quantity if item already exists', () => {
    let cart = createCart({ userId: 'user-1' });
    const item1: CartItem = { productId: 'prod-1', quantity: 1, price: 100 };
    cart = addCartItem(cart, item1);

    const item2: CartItem = { productId: 'prod-1', quantity: 2, price: 100 };
    cart = addCartItem(cart, item2);

    expect(cart.items.length).toBe(1);
    expect(cart.items[0].quantity).toBe(3);
    expect(cart.subtotal).toBe(300);
  });

  it('should update item quantity via explicit function', () => {
    let cart = createCart({ userId: 'user-1' });
    cart = addCartItem(cart, { productId: 'prod-1', quantity: 2, price: 100 });

    cart = updateCartItemQuantity(cart, 'prod-1', 5);

    expect(cart.items[0].quantity).toBe(5);
    expect(cart.subtotal).toBe(500);
  });

  it('should remove item when quantity is updated to zero or negative', () => {
    let cart = createCart({ userId: 'user-1' });
    cart = addCartItem(cart, { productId: 'prod-1', quantity: 3, price: 100 });

    cart = updateCartItemQuantity(cart, 'prod-1', 0);
    expect(cart.items.length).toBe(0);

    cart = addCartItem(cart, { productId: 'prod-1', quantity: 3, price: 100 });
    cart = updateCartItemQuantity(cart, 'prod-1', -1);
    expect(cart.items.length).toBe(0);
  });

  it('should explicitly remove items', () => {
    let cart = createCart({ userId: 'user-1' });
    cart = addCartItem(cart, { productId: 'prod-1', quantity: 1, price: 100 });

    cart = removeCartItem(cart, 'prod-1');

    expect(cart.items.length).toBe(0);
    expect(cart.subtotal).toBe(0);
  });

  it('should ignore updates to missing products', () => {
    let cart = createCart({ userId: 'user-1' });
    cart = addCartItem(cart, { productId: 'prod-1', quantity: 1, price: 100 });

    cart = updateCartItemQuantity(cart, 'prod-999', 5);

    expect(cart.items.length).toBe(1);
    expect(cart.items[0].productId).toBe('prod-1');
  });

  it('should calculate total with discount and tax', () => {
    let cart = createCart({ userId: 'user-1', discountTotal: 50, estimatedTax: 20 });
    cart = addCartItem(cart, { productId: 'prod-1', quantity: 2, price: 100 });

    expect(cart.subtotal).toBe(200);
    // Total = subtotal (200) - discount (50) + tax (20) = 170
    expect(cart.total).toBe(170);
  });

  it('should not allow negative total', () => {
    let cart = createCart({ userId: 'user-1', discountTotal: 500, estimatedTax: 20 });
    cart = addCartItem(cart, { productId: 'prod-1', quantity: 1, price: 100 });

    expect(cart.subtotal).toBe(100);
    expect(cart.total).toBe(0); // Subtotal (100) - 500 + 20 is negative, max to 0
  });
});
