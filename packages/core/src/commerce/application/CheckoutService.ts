import { Context, Effect } from 'effect';

import { RepositoryError } from '../../../shared/domain/errors';
import { Cart } from '../domain/Cart';
import { EmptyCartError } from '../domain/errors';
import { Order, OrderItem, Address, OrderStatus } from '../domain/Order';
import { PriceEstimator } from '../domain/PriceEstimator';

export class OrderRepository extends Context.Tag('OrderRepository')<
  OrderRepository,
  {
    readonly save: (order: Order) => Effect.Effect<void, RepositoryError>;
    readonly findById: (id: string) => Effect.Effect<Order | null, RepositoryError>;
  }
>() {}

export const createOrderFromCart = (
  cart: Cart,
  shippingAddress: Address,
  orderIdGenerator: () => string,
): Effect.Effect<Order, EmptyCartError | RepositoryError, OrderRepository> =>
  Effect.gen(function* (_) {
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

    const orderRepo = yield* _(OrderRepository);
    yield* _(orderRepo.save(order));

    return order;
  });
