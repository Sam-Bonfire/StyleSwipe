import { api, type Id } from '@app/convex';
import { useMutation, useQuery } from 'convex/react';
import React from 'react';

/**
 * Hook to retrieve the user's default "Your orders" board with fully populated products.
 */
export function useSystemBoard(userId: string | undefined) {
  const data = useQuery(api.boards.getSystemBoard, userId ? { userId } : 'skip');

  return React.useMemo(() => {
    if (data === undefined) return undefined;
    return data;
  }, [data]);
}

/**
 * Hook to trigger the trackPurchaseClick mutation which logs analytics,
 * updates the user's system board, and clears the product from the shopping cart.
 */
export function useTrackPurchaseClick() {
  const mutation = useMutation(api.boards.trackPurchaseClick);

  return React.useCallback(
    async (userId: string, productId: string) => {
      return await mutation({
        userId,
        productId: productId as Id<'products'>,
      });
    },
    [mutation]
  );
}

/**
 * Hook to retrieve the user's "Wishlist" system board with fully populated products.
 */
export function useWishlist(userId: string | undefined) {
  const data = useQuery(api.boards.getWishlist, userId ? { userId } : 'skip');

  return React.useMemo(() => {
    if (data === undefined) return undefined;
    return data;
  }, [data]);
}

/**
 * Hook to trigger the toggleWishlist mutation.
 */
export function useToggleWishlist() {
  const mutation = useMutation(api.boards.toggleWishlist);

  return React.useCallback(
    async (userId: string, productId: string) => {
      return await mutation({
        userId,
        productId: productId as Id<'products'>,
      });
    },
    [mutation]
  );
}
