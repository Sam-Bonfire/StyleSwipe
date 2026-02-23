import { api } from '@app/convex';
/**
 * useSearch — Search hooks
 * Wraps search-specific Convex operations.
 */
import { useConvex } from 'convex/react';
import React from 'react';

/**
 * Returns search functions that use the Convex client directly.
 */
export function useSearch() {
  const convex = useConvex();

  const searchProducts = React.useCallback(
    async (vector: number[], limit: number) => {
      return convex.action(api.search.searchProducts, { vector, limit });
    },
    [convex],
  );

  const getSuggestions = React.useCallback(
    async (query: string, limit: number) => {
      return convex.query(api.search.getSuggestions, { query, limit });
    },
    [convex],
  );

  return { searchProducts, getSuggestions };
}
