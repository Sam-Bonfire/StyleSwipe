import { api } from '@app/convex';
import { useMutation, useQuery } from 'convex/react';
import { useCallback } from 'react';

export function useAddresses(userId: string | undefined) {
  const data = useQuery(api.addresses.list, userId ? { userId } : 'skip');
  return data;
}

export function useDefaultAddress(userId: string | undefined) {
  const data = useQuery(api.addresses.getDefault, userId ? { userId } : 'skip');
  return data;
}

export function useCreateAddress() {
  const create = useMutation(api.addresses.create);
  return useCallback(
    async (args: {
      userId: string;
      fullName: string;
      phone: string;
      line1: string;
      line2?: string;
      city: string;
      state: string;
      pincode: string;
      country?: string;
      isDefault?: boolean;
    }) => {
      return await create(args);
    },
    [create]
  );
}

export function useUpdateAddress() {
  const upd = useMutation(api.addresses.update);
  return useCallback(
    async (args: {
      addressId: string;
      fullName?: string;
      phone?: string;
      line1?: string;
      line2?: string;
      city?: string;
      state?: string;
      pincode?: string;
      country?: string;
      isDefault?: boolean;
    }) => {
      const { addressId, ...rest } = args;
      await upd({ addressId: addressId as never, ...rest } as never);
    },
    [upd]
  );
}

export function useDeleteAddress() {
  const del = useMutation(api.addresses.remove);
  return useCallback(
    async (addressId: string) => {
      await del({ addressId: addressId as never });
    },
    [del]
  );
}

export function useSetDefaultAddress() {
  const setDef = useMutation(api.addresses.setDefault);
  return useCallback(
    async (addressId: string) => {
      await setDef({ addressId: addressId as never });
    },
    [setDef]
  );
}
