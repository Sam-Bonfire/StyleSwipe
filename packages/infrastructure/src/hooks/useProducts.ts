import type { Id } from '@app/convex';

import { api } from '@app/convex';
/**
 * useProducts — Product catalog hooks
 * Reads wrap Convex queries; writes route through BrowseCatalog use case.
 */
import { useAction, useQuery } from 'convex/react';
import React from 'react';

/**
 * Fetches the latest products.
 */
export function useLatestProducts(limit: number = 10) {
    return useQuery(api.products.getLatest, { limit });
}

/**
 * Fetches a single product by ID.
 */
export function useProduct(id: string | undefined) {
    return useQuery(api.products.get, id ? { id: id as Id<'products'> } : 'skip');
}

/**
 * Fetches multiple products by their IDs.
 */
export function useProductsByIds(ids: string[]) {
    return useQuery(api.helpers.getProductsByIds, { ids: ids as Id<'products'>[] });
}

export function useSimilarProducts(productId: string | undefined, limit: number = 8) {
  const action = useAction(api.products.getSimilarByProductId);
  const [data, setData] = React.useState<unknown[] | undefined>(undefined);
  const [loading, setLoading] = React.useState<boolean>(false);

  React.useEffect(() => {
    if (!productId) {
      setData(undefined);
      return;
    }
    let cancelled = false;
    setLoading(true);
    action({ productId: productId as Id<'products'>, limit })
      .then((res) => {
        if (!cancelled) setData(res as unknown[]);
      })
      .catch(() => {
        if (!cancelled) setData([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [action, productId, limit]);

  return { data, loading };
}

