import { api } from '@app/convex';
import { useQuery, useMutation } from 'convex/react';

export function usePartnerSyncByInviteCode(inviteCode: string) {
  return useQuery(api.partnerSync.getByInviteCode, { inviteCode });
}

export function useAcceptPartnerSync() {
  const updateSync = useMutation(api.partnerSync.update);
  
  return async (id: string, partnerId: string) => {
    return await updateSync({
      id: id as any,
      partnerId: partnerId as any,
      status: 'active',
    });
  };
}

export function useCreatePartnerSync() {
  const createSync = useMutation(api.partnerSync.create);
  
  return async (initiatorId: string, durationMs: number) => {
    const inviteCode = Math.random().toString(36).substring(2, 8).toUpperCase();
    const result = await createSync({
      initiatorId: initiatorId as any,
      inviteCode,
      status: 'pending',
      expiresAt: Date.now() + durationMs,
      influenceRatio: 0.5,
      createdAt: Date.now(),
    });
    return { id: result, inviteCode };
  };
}

export function useActivePartnerSync(userId?: string) {
  return useQuery(api.partnerSync.getActiveByUser, userId ? { userId: userId as any } : 'skip');
}

export function useStopPartnerSync() {
  const updateStatus = useMutation(api.partnerSync.updateStatus);
  return async (id: string) => {
    return await updateStatus({
      id: id as any,
      status: 'expired',
    });
  };
}
