import { api } from '@app/convex';
import { Address, AddressRepository, RepositoryError, type PersistedAddress } from '@app/core';
import { ConvexClient } from 'convex/browser';
import { Effect, Layer } from 'effect';

interface ConvexAddressDoc {
  _id: string;
  userId: string;
  fullName: string;
  phone: string;
  line1: string;
  line2?: string;
  city: string;
  state: string;
  pincode: string;
  country: string;
  isDefault: boolean;
  createdAt: number;
  updatedAt: number;
}

function toPersisted(doc: ConvexAddressDoc): PersistedAddress {
  return {
    id: doc._id,
    userId: doc.userId,
    fullName: doc.fullName,
    phoneNumber: doc.phone,
    addressLine1: doc.line1,
    addressLine2: doc.line2,
    city: doc.city,
    state: doc.state,
    postalCode: doc.pincode,
    country: doc.country,
    isDefault: doc.isDefault,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  } as unknown as PersistedAddress;
}

export class ConvexAddressRepository {
  constructor(private client: ConvexClient) {}

  list(userId: string): Effect.Effect<PersistedAddress[], RepositoryError> {
    return Effect.tryPromise({
      try: async () => {
        const docs = (await this.client.query(api.addresses.list, { userId })) as ConvexAddressDoc[];
        return docs.map(toPersisted);
      },
      catch: (e) => new RepositoryError(e instanceof Error ? e.message : String(e), e),
    });
  }

  getById(id: string): Effect.Effect<PersistedAddress | null, RepositoryError> {
    return Effect.tryPromise({
      try: async () => {
        const doc = (await this.client.query(api.addresses.getById, { addressId: id as never })) as ConvexAddressDoc | null;
        return doc ? toPersisted(doc) : null;
      },
      catch: (e) => new RepositoryError(e instanceof Error ? e.message : String(e), e),
    });
  }

  getDefault(userId: string): Effect.Effect<PersistedAddress | null, RepositoryError> {
    return Effect.tryPromise({
      try: async () => {
        const doc = (await this.client.query(api.addresses.getDefault, { userId })) as ConvexAddressDoc | null;
        return doc ? toPersisted(doc) : null;
      },
      catch: (e) => new RepositoryError(e instanceof Error ? e.message : String(e), e),
    });
  }

  create(userId: string, address: Address): Effect.Effect<string, RepositoryError> {
    return Effect.tryPromise({
      try: async () => {
        const id = (await this.client.mutation(api.addresses.create, {
          userId,
          fullName: address.fullName,
          phone: address.phoneNumber,
          line1: address.addressLine1,
          line2: address.addressLine2,
          city: address.city,
          state: address.state,
          pincode: address.postalCode,
          country: address.country,
          isDefault: address.isDefault,
        })) as string;
        return id;
      },
      catch: (e) => new RepositoryError(e instanceof Error ? e.message : String(e), e),
    });
  }

  update(id: string, patch: Partial<Address>): Effect.Effect<void, RepositoryError> {
    return Effect.tryPromise({
      try: async () => {
        await this.client.mutation(api.addresses.update, {
          addressId: id as never,
          fullName: patch.fullName,
          phone: patch.phoneNumber,
          line1: patch.addressLine1,
          line2: patch.addressLine2,
          city: patch.city,
          state: patch.state,
          pincode: patch.postalCode,
          country: patch.country,
          isDefault: patch.isDefault,
        });
      },
      catch: (e) => new RepositoryError(e instanceof Error ? e.message : String(e), e),
    });
  }

  remove(id: string): Effect.Effect<void, RepositoryError> {
    return Effect.tryPromise({
      try: async () => {
        await this.client.mutation(api.addresses.remove, { addressId: id as never });
      },
      catch: (e) => new RepositoryError(e instanceof Error ? e.message : String(e), e),
    });
  }

  setDefault(id: string): Effect.Effect<void, RepositoryError> {
    return Effect.tryPromise({
      try: async () => {
        await this.client.mutation(api.addresses.setDefault, { addressId: id as never });
      },
      catch: (e) => new RepositoryError(e instanceof Error ? e.message : String(e), e),
    });
  }
}

export const createAddressRepositoryLayer = (client: ConvexClient) =>
  Layer.succeed(
    AddressRepository,
    AddressRepository.of({
      list: (userId: string) => new ConvexAddressRepository(client).list(userId),
      getById: (id: string) => new ConvexAddressRepository(client).getById(id),
      getDefault: (userId: string) => new ConvexAddressRepository(client).getDefault(userId),
      create: (userId: string, address: Address) => new ConvexAddressRepository(client).create(userId, address),
      update: (id: string, patch: Partial<Address>) => new ConvexAddressRepository(client).update(id, patch),
      remove: (id: string) => new ConvexAddressRepository(client).remove(id),
      setDefault: (id: string) => new ConvexAddressRepository(client).setDefault(id),
    })
  );
