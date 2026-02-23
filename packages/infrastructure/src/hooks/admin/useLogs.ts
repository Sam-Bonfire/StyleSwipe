import { api } from '@app/convex';
/**
 * Logs admin hooks
 */
import { usePaginatedQuery } from 'convex/react';

/**
 * Read — paginated logs.
 */
export function useLogs(initialNumItems: number = 50) {
    return usePaginatedQuery(api.logs.getLogs, {}, { initialNumItems });
}
