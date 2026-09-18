import { z } from 'zod';

export const CartItemSchema = z.object({
  productId: z.string().min(1, 'Product ID is required'),
  variantId: z.string().optional(),
  quantity: z.number().int().min(1, 'Quantity must be at least 1'),
  price: z.number().min(0, 'Price cannot be negative'),
  selectedAttributes: z.record(z.string(), z.string()).optional(),
});
export type CartItem = z.infer<typeof CartItemSchema>;

export const CartSchema = z.object({
  id: z.string().optional(),
  userId: z.string().min(1, 'User ID is required'),
  items: z.array(CartItemSchema).default([]),
  currency: z.string().min(1, 'Currency is required').default('INR'),
  subtotal: z.number().min(0).default(0),
  discountTotal: z.number().min(0).default(0),
  estimatedTax: z.number().min(0).default(0),
  total: z.number().min(0).default(0),
  updatedAt: z.number().int().min(0).default(() => Date.now()),
});
export type Cart = z.infer<typeof CartSchema>;

// Helper functions for invariants
export const calculateCartTotals = (cart: Omit<Cart, 'subtotal' | 'total'>): Cart => {
  const subtotal = cart.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const total = Math.max(0, subtotal - cart.discountTotal + cart.estimatedTax);
  return {
    ...cart,
    subtotal,
    total,
  };
};

export const createCart = (data: Partial<Cart> & { userId: string }): Cart => {
  const cart = CartSchema.parse(data);
  return calculateCartTotals(cart);
};

export const addCartItem = (cart: Cart, item: CartItem): Cart => {
  const parsedItem = CartItemSchema.parse(item);
  const existingItemIndex = cart.items.findIndex((i) => i.productId === parsedItem.productId && i.variantId === parsedItem.variantId);

  const newItems = [...cart.items];
  if (existingItemIndex !== -1) {
    newItems[existingItemIndex] = {
      ...newItems[existingItemIndex],
      quantity: newItems[existingItemIndex].quantity + parsedItem.quantity,
    };
  } else {
    newItems.push(parsedItem);
  }

  return calculateCartTotals({
    ...cart,
    items: newItems,
    updatedAt: Date.now(),
  });
};

export const updateCartItemQuantity = (cart: Cart, productId: string, quantity: number, variantId?: string): Cart => {
  let newItems = [...cart.items];

  if (quantity <= 0) {
    newItems = newItems.filter((i) => !(i.productId === productId && i.variantId === variantId));
  } else {
    const itemIndex = newItems.findIndex((i) => i.productId === productId && i.variantId === variantId);
    if (itemIndex !== -1) {
      newItems[itemIndex] = {
        ...newItems[itemIndex],
        quantity,
      };
    }
  }

  return calculateCartTotals({
    ...cart,
    items: newItems,
    updatedAt: Date.now(),
  });
};

export const removeCartItem = (cart: Cart, productId: string, variantId?: string): Cart => {
  const newItems = cart.items.filter((i) => !(i.productId === productId && i.variantId === variantId));
  return calculateCartTotals({
    ...cart,
    items: newItems,
    updatedAt: Date.now(),
  });
};
