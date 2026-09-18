import * as React from 'react';

import { LocalDatabase } from '../infrastructure/LocalDatabase';

export function useRecentSearches() {
  const [recent, setRecent] = React.useState<string[]>([]);
  const [loading, setLoading] = React.useState(true);

  const refresh = React.useCallback(async () => {
    try {
      const db = await LocalDatabase.getInstance();
      const items = await db.getRecentSearches();
      setRecent(items);
    } catch {
      setRecent([]);
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    void refresh();
  }, [refresh]);

  const add = React.useCallback(
    async (query: string) => {
      const trimmed = query.trim();
      if (!trimmed) return;
      try {
        const db = await LocalDatabase.getInstance();
        await db.saveRecentSearch(trimmed);
        await refresh();
      } catch (e) {
        console.warn('[RecentSearches] save failed', e);
      }
    },
    [refresh],
  );

  const remove = React.useCallback(
    async (query: string) => {
      try {
        const db = await LocalDatabase.getInstance();
        await db.removeRecentSearch(query);
        await refresh();
      } catch (e) {
        console.warn('[RecentSearches] remove failed', e);
      }
    },
    [refresh],
  );

  const clear = React.useCallback(async () => {
    try {
      const db = await LocalDatabase.getInstance();
      await db.clearRecentSearches();
      await refresh();
    } catch (e) {
      console.warn('[RecentSearches] clear failed', e);
    }
  }, [refresh]);

  return { recent, loading, add, remove, clear, refresh };
}
