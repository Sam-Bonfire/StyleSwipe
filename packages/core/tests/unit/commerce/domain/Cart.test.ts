import { describe, expect, it } from 'vitest';

import { Cart, CartItem } from '../../../../src/commerce/domain/Cart';

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

  it('should update item quantity', () => {
    const cart = new Cart('user-1');
    cart.addItem(new CartItem('prod-1', 2, 100, {}));
    cart.updateItemQuantity('prod-1', 5);

    expect(cart.items[0].quantity).toBe(5);
    expect(cart.total).toBe(500);
  });

  it('should remove item when quantity is set to zero', () => {
    const cart = new Cart('user-1');
    cart.addItem(new CartItem('prod-1', 3, 100, {}));
    cart.updateItemQuantity('prod-1', 0);

    expect(cart.items.length).toBe(0);
  });

  it('should remove item when quantity is negative', () => {
    const cart = new Cart('user-1');
    cart.addItem(new CartItem('prod-1', 3, 100, {}));
    cart.updateItemQuantity('prod-1', -1);

    expect(cart.items.length).toBe(0);
  });

  it('should no-op when updating quantity of missing product', () => {
    const cart = new Cart('user-1');
    cart.addItem(new CartItem('prod-1', 1, 100, {}));
    cart.updateItemQuantity('prod-999', 5);

    expect(cart.items.length).toBe(1);
    expect(cart.items[0].productId).toBe('prod-1');
  });

  it('should remove non-existent item without error', () => {
    const cart = new Cart('user-1');
    cart.removeItem('prod-999');
    expect(cart.items.length).toBe(0);
  });
});

describe('CartItem', () => {
  it('should calculate total as price * quantity', () => {
    const item = new CartItem('prod-1', 3, 250, { size: 'M' });
    expect(item.total).toBe(750);
  });

  it('should store attributes', () => {
    const item = new CartItem('prod-1', 1, 100, { size: 'L', color: 'red' });
    expect(item.attributes).toEqual({ size: 'L', color: 'red' });
  });
});
