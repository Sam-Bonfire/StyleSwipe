import { Cart } from './Cart';

export interface PriceBreakdown {
  subtotal: number;
  shipping: number;
  tax: number;
  discount: number;
  total: number;
  isFreeShipping: boolean;
}

export class PriceEstimator {
  private static readonly FREE_SHIPPING_THRESHOLD = 1000;
  private static readonly DEFAULT_SHIPPING = 100;

  static estimate(cart: Cart): PriceBreakdown {
    const subtotal = cart.total;
    const isFreeShipping = subtotal >= this.FREE_SHIPPING_THRESHOLD;
    const shipping = isFreeShipping ? 0 : this.DEFAULT_SHIPPING;
    const discount = 0; // Placeholder for future coupon logic

    // Tax is usually included in MRP in India, but if we need to separate it:
    // For now, let's assume price is inclusive, so tax is 0 derived or separate.
    // If exclusive: const tax = subtotal * this.TAX_RATE;
    // Let's go with simple exclusive tax for demonstration or 0 if inclusive.
    const tax = Math.round(subtotal * 0.05); // 5% platform fee/tax demo

    const total = subtotal + shipping + tax - discount;

    return {
      subtotal,
      shipping,
      tax,
      discount,
      total,
      isFreeShipping,
    };
  }
}
