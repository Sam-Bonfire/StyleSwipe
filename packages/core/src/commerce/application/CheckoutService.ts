import { Effect } from 'effect';

import { Cart } from '../domain/Cart';
import { EmptyCartError, RepositoryError } from '../domain/errors';
import { Order, OrderItem, Address, OrderStatus } from '../domain/Order';
import { PriceEstimator } from '../domain/PriceEstimator';

export interface OrderRepository {
  save(order: Order): Promise<void>;
  findById(id: string): Promise<Order | null>;
}

export class CheckoutService {
  constructor(private orderRepo: OrderRepository) { }

  createOrderFromCart(
    cart: Cart,
    shippingAddress: Address,
    orderIdGenerator: () => string,
  ): Effect.Effect<Order, EmptyCartError | RepositoryError> {
    return Effect.gen(this, function* (_) {
      if (cart.items.length === 0) {
        return yield* _(Effect.fail(new EmptyCartError(cart.userId)));
      }

      const priceBreakdown = PriceEstimator.estimate(cart);

      const orderItems = cart.items.map(
        (item) =>
          new OrderItem(
            item.productId,
            item.quantity,
            item.price,
            item.attributes['brand'] || 'Unknown',
            `Product ${item.productId}`,
            'https://placehold.co/100x100',
          ),
      );

      const order = new Order(
        orderIdGenerator(),
        cart.userId,
        orderItems,
        shippingAddress,
        OrderStatus.PENDING,
        Date.now(),
        priceBreakdown.total,
        priceBreakdown.shipping,
        priceBreakdown.tax,
      );

      yield* _(
        Effect.tryPromise({
          try: () => this.orderRepo.save(order),
          catch: (e) => new RepositoryError('orderRepo.save', e),
        }),
      );

      return order;
    });
  }
}
