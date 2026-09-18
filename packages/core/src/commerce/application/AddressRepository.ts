import { Context, Effect } from 'effect';

import { RepositoryError } from '../../../shared/domain/errors';
import { type Address } from '../domain/Address';

export interface PersistedAddress extends Address {
  id: string;
  userId: string;
  createdAt: number;
  updatedAt: number;
}

export class AddressRepository extends Context.Tag('AddressRepository')<
  AddressRepository,
  {
    readonly list: (userId: string) => Effect.Effect<PersistedAddress[], RepositoryError>;
    readonly getById: (id: string) => Effect.Effect<PersistedAddress | null, RepositoryError>;
    readonly getDefault: (userId: string) => Effect.Effect<PersistedAddress | null, RepositoryError>;
    readonly create: (userId: string, address: Address) => Effect.Effect<string, RepositoryError>;
    readonly update: (id: string, patch: Partial<Address>) => Effect.Effect<void, RepositoryError>;
    readonly remove: (id: string) => Effect.Effect<void, RepositoryError>;
    readonly setDefault: (id: string) => Effect.Effect<void, RepositoryError>;
  }
>() {}
