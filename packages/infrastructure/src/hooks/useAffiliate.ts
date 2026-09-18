import type { Id } from '@app/convex';

import { api } from '@app/convex';
import { useMutation, useQuery } from 'convex/react';

export type AffiliateNetwork = 'DIRECT' | 'IMPACT' | 'CJ' | 'RAKUTEN' | 'CUSTOM';

export interface SaveAffiliateLinkInput {
  id?: string;
  merchantDomain: string;
  merchantName: string;
  network: AffiliateNetwork;
  trackingParams: Array<{ key: string; value: string }>;
  isEnabled: boolean;
}

export function useAffiliateLinks() {
  return useQuery(api.affiliate.list);
}

export function useRedirectStats() {
  return useQuery(api.affiliate.getRedirectStats);
}

export function useSaveAffiliateLink() {
  const save = useMutation(api.affiliate.save);
  return async (input: SaveAffiliateLinkInput) => {
    return await save({
      ...input,
      id: input.id ? (input.id as Id<'affiliate_links'>) : undefined,
    });
  };
}

export function useRemoveAffiliateLink() {
  const remove = useMutation(api.affiliate.remove);
  return async (id: string) => {
    return await remove({ id: id as Id<'affiliate_links'> });
  };
}
