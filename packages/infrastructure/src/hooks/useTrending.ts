import { api } from '@app/convex';
import { useQuery } from 'convex/react';

export function usePopularEvents(limit: number = 20) {
  return useQuery(api.events.getByType, { type: 'product_viewed', limit });
}
