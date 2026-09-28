import type { Id } from '@app/convex';
import type { SwipeAction } from '@app/core';

import { api } from '@app/convex';
import { useQuery, useMutation, useAction } from 'convex/react';

export function useRecentlyViewed(limit: number = 10) {
  return useQuery(api.discovery.getRecentlyViewed, { limit });
}

export function useRecordProductView() {
  return useMutation(api.discovery.recordProductView);
}

export function useVectorFeed() {
  return useAction(api.recommendations.getVectorFeed);
}

export function useCalibrationFeed(limit: number = 10) {
  return useQuery(api.discovery.getCalibrationFeed, { limit });
}

export function useUserSwipedIds(userId: string | undefined) {
  return useQuery(api.discovery.getUserSwipedIds, userId ? { userId } : 'skip');
}

export function usePartnerLikes(partnerId: string | undefined) {
  return useQuery(api.discovery.getPartnerLikes, partnerId ? { partnerId } : 'skip');
}

export function useProcessSwipe() {
  const swipeMutation = useMutation(api.discovery.processSwipe);

  // Thin adapter: validation, displacement, dedup, mutual-match, and
  // profile persistence all run server-side in the core use case.
  return async (input: { productId: string; action: SwipeAction; partnerId?: string }) => {
    const res = await swipeMutation({
      productId: input.productId as Id<'products'>,
      action: input.action,
      partnerId: input.partnerId,
    });
    return { isMutualMatch: res?.isMutualMatch ?? false };
  };
}
