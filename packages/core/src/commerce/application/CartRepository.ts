import { Context, Effect } from 'effect';

import type { Cart } from '../domain/Cart';

import { RepositoryError } from '../../../shared/domain/errors';

export class CartRepository extends Context.Tag('CartRepository')<
  CartRepository,
  {
    readonly save: (cart: Cart) => Effect.Effect<void, RepositoryError>;
    readonly findByUserId: (userId: string) => Effect.Effect<Cart | null, RepositoryError>;
    readonly clear: (userId: string) => Effect.Effect<void, RepositoryError>;
  }
>() { }
