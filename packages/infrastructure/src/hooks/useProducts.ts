import type { Id } from '@app/convex';

import { api } from '@app/convex';
/**
 * useProducts — Product catalog hooks
 * Reads wrap Convex queries; writes route through BrowseCatalog use case.
 */
import { useQuery } from 'convex/react';

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
