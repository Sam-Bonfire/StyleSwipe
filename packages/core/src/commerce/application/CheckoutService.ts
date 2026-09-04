import { Effect } from 'effect';

import { RepositoryError } from '../../../shared/domain/errors';
import { type Address } from '../domain/Address';
import { type Cart } from '../domain/Cart';
import { EmptyCartError } from '../domain/errors';
import { type Order, type OrderItem, createOrder } from '../domain/Order';
import { PriceEstimator } from '../domain/PriceEstimator';
import { OrderRepository } from './OrderRepository';

export { OrderRepository };

export interface CheckoutOptions {
  readonly paymentMethod?: string;
}

export const createOrderFromCart = (
  cart: Cart,
  shippingAddress: Address,
  orderIdGenerator: () => string,
  options?: CheckoutOptions,
): Effect.Effect<Order, EmptyCartError | RepositoryError, OrderRepository> =>
  Effect.gen(function* (_) {
    if (cart.items.length === 0) {
      return yield* _(Effect.fail(new EmptyCartError(cart.userId)));
    }

    const priceBreakdown = PriceEstimator.estimate(cart);

    const orderItems: OrderItem[] = cart.items.map(
      (item) => ({
          productId: item.productId,
          quantity: item.quantity,
          price: item.price,
          brand: String(item.selectedAttributes?.['brand'] || 'Unknown'),
          title: `Product ${item.productId}`,
          image: 'https://placehold.co/100x100',
      }),
    );

    const paymentMethod = options?.paymentMethod ?? 'COD';
    const order = createOrder({
      id: orderIdGenerator(),
      userId: cart.userId,
      items: orderItems,
      deliveryAddress: shippingAddress,
      paymentInfo: { method: paymentMethod, paymentStatus: paymentMethod === 'COD' ? 'PENDING' : 'PENDING' },
      status: 'PENDING',
      pricing: {
        totalAmount: priceBreakdown.total,
        shippingCost: priceBreakdown.shipping,
        discountAmount: priceBreakdown.discount,
        tax: priceBreakdown.tax,
        subtotal: priceBreakdown.subtotal,
      }
    });

    const orderRepo = yield* _(OrderRepository);
    yield* _(orderRepo.save(order));

    return order;
  });
