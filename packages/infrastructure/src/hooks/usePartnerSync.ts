import type { Id } from '@app/convex';

import { api } from '@app/convex';
import { useQuery, useMutation } from 'convex/react';

export function usePartnerSyncByInviteCode(inviteCode: string) {
  return useQuery(api.partnerSync.getByInviteCode, { inviteCode });
}

export function useAcceptPartnerSync() {
  const acceptSync = useMutation(api.partnerSync.accept);

  return async (id: string, partnerId: string) => {
    return await acceptSync({
      id: id as Id<'partner_sync'>,
      partnerId: partnerId,
    });
  };
}

export function useCreatePartnerSync() {
  const createSync = useMutation(api.partnerSync.create);

  return async (initiatorId: string, durationMs: number) => {
    // Invite codes are short; the server rejects collisions, so retry.
    let lastError: unknown = null;
    for (let attempt = 0; attempt < 3; attempt++) {
      const inviteCode = Math.random().toString(36).substring(2, 8).toUpperCase();
      try {
        const result = await createSync({
          initiatorId: initiatorId,
          inviteCode,
          status: 'pending',
          expiresAt: Date.now() + durationMs,
          influenceRatio: 0.5,
          createdAt: Date.now(),
        });
        return { id: result, inviteCode };
      } catch (e) {
        lastError = e;
        if (!(e instanceof Error) || !e.message.includes('already in use')) throw e;
      }
    }
    throw lastError instanceof Error ? lastError : new Error('Failed to generate sync link.');
  };
}

export function useActivePartnerSync(userId?: string) {
  return useQuery(api.partnerSync.getActiveByUser, userId ? { userId: userId } : 'skip');
}

export function useStopPartnerSync() {
  const updateStatus = useMutation(api.partnerSync.updateStatus);
  return async (id: string) => {
    return await updateStatus({
      id: id as Id<'partner_sync'>,
      status: 'expired',
    });
  };
}
