import { Context, Effect } from 'effect';

import { RepositoryError } from '../../../shared/domain/errors';
import { type Order } from '../domain/Order';

export class OrderRepository extends Context.Tag('OrderRepository')<
  OrderRepository,
  {
    readonly save: (order: Order) => Effect.Effect<void, RepositoryError>;
    readonly findById: (id: string) => Effect.Effect<Order | null, RepositoryError>;
    readonly listByUser: (userId: string) => Effect.Effect<Order[], RepositoryError>;
    readonly updateStatus: (orderId: string, status: string, reason?: string) => Effect.Effect<void, RepositoryError>;
  }
>() {}
