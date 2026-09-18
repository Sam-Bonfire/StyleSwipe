import { api } from '@app/convex';
import { useQuery, useMutation } from 'convex/react';

/**
 * Notifications preferences & inbox hooks (hexagonal adapter)
 * Wraps convex/notifications.ts over the UI.
 */

export type NotificationPrefs = {
  push: boolean;
  email: boolean;
  inApp: boolean;
  priceDrops: boolean;
  partnerSync: boolean;
  dailyDrops: boolean;
  marketing: boolean;
};

export function useNotificationPreferences(userId: string | undefined): NotificationPrefs | null | undefined {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return useQuery(api.notifications.getPreferences as any, userId ? { userId } : 'skip') as NotificationPrefs | null | undefined;
}

export function useSetNotificationPreferences(): (args: { userId: string } & NotificationPrefs) => Promise<string> {
  const mut = useMutation(api.notifications.setPreferences);
  return async (args: { userId: string } & NotificationPrefs): Promise<string> => {
    return (await mut(args)) as string;
  };
}

export function useNotifications(userId: string | undefined, limit?: number) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return useQuery(api.notifications.listNotifications as any, userId ? { userId, limit } : 'skip');
}

export function useUnreadCount(userId: string | undefined): number | undefined {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return useQuery(api.notifications.countUnread as any, userId ? { userId } : 'skip') as number | undefined;
}

export function useMarkAllRead(): (args: { userId: string }) => Promise<void> {
  const mut = useMutation(api.notifications.markAllRead);
  return async (args: { userId: string }): Promise<void> => {
    await mut(args);
  };
}

export function useDispatchPriceDrop(): (args: {
  userId: string;
  productId: string;
  oldPrice: number;
  newPrice: number;
  productTitle?: string;
}) => Promise<string> {
  const mut = useMutation(api.notifications.dispatchPriceDrop);
  return async (args) => (await mut(args)) as string;
}
