import { deserializeNotificationPayload } from '@app/core/notifications/domain/Notification';
import { useUpdatePushToken } from '@app/infrastructure';
import Constants from 'expo-constants';
import * as Notifications from 'expo-notifications';
import { useRouter } from 'expo-router';
import { useEffect, useRef } from 'react';
import { Platform } from 'react-native';

import { logger } from './logger';

// Notifications handler for foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  } as Notifications.NotificationBehavior),
});

type PushPermissionResult = {
  granted: boolean;
  token: string | null;
};

export async function requestPushPermissionAndRegister(
  updatePushToken: (args: { token: string; platform: 'IOS' | 'ANDROID' | 'WEB'; service: 'APNS' | 'FCM' }) => Promise<unknown>,
): Promise<PushPermissionResult> {
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus: Notifications.PermissionStatus = existingStatus;
  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }
  if (finalStatus !== 'granted') {
    logger.warn('Push permission not granted', { status: finalStatus });
    return { granted: false, token: null };
  }

  try {
    const projectId = Constants?.expoConfig?.extra?.eas?.projectId ?? Constants?.easConfig?.projectId;
    const token: string = (await Notifications.getExpoPushTokenAsync({ projectId })).data;
    if (token) {
      logger.info('Push token retrieved', { token });
      const platform: 'IOS' | 'ANDROID' | 'WEB' =
        Platform.OS === 'ios' ? 'IOS' : Platform.OS === 'android' ? 'ANDROID' : 'WEB';
      const service: 'APNS' | 'FCM' = Platform.OS === 'ios' ? 'APNS' : 'FCM';
      await updatePushToken({ token, platform, service });
      return { granted: true, token };
    }
  } catch (e: unknown) {
    logger.error('Error fetching push token', { error: e });
  }
  return { granted: true, token: null };
}

export function usePushNotifications(): void {
  const router = useRouter();
  const updatePushToken = useUpdatePushToken();

  const notificationListener = useRef<Notifications.EventSubscription | null>(null);
  const responseListener = useRef<Notifications.EventSubscription | null>(null);

  useEffect(() => {
    async function setupChannelsAndMaybeRegister(): Promise<void> {
      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('partner-sync', {
          name: 'Partner Sync',
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#FF231F7C',
        });
        await Notifications.setNotificationChannelAsync('drops', {
          name: 'Drops',
          importance: Notifications.AndroidImportance.HIGH,
        });
        await Notifications.setNotificationChannelAsync('general', {
          name: 'General',
          importance: Notifications.AndroidImportance.DEFAULT,
        });
      }

      // Only auto-register if already granted — do NOT prompt on launch (Req 9.1 after onboarding step 3)
      const { status } = await Notifications.getPermissionsAsync();
      if (status !== 'granted') {
        logger.info('Push permission not yet granted — skipping auto-register (will prompt after onboarding step 3)');
        return;
      }

      try {
        const projectId = Constants?.expoConfig?.extra?.eas?.projectId ?? Constants?.easConfig?.projectId;
        const token: string = (await Notifications.getExpoPushTokenAsync({ projectId })).data;
        if (token) {
          logger.info('Push token auto-registered (already granted)', { token });
          const platform: 'IOS' | 'ANDROID' | 'WEB' =
            Platform.OS === 'ios' ? 'IOS' : Platform.OS === 'android' ? 'ANDROID' : 'WEB';
          const service: 'APNS' | 'FCM' = Platform.OS === 'ios' ? 'APNS' : 'FCM';
          await updatePushToken({ token, platform, service });
        }
      } catch (e: unknown) {
        logger.error('Error auto-fetching push token', { error: e });
      }
    }

    void setupChannelsAndMaybeRegister();

    notificationListener.current = Notifications.addNotificationReceivedListener((notification) => {
      logger.info('Notification received in foreground', { notification });
      // You can trigger custom toasts/banners here if needed
    });

    responseListener.current = Notifications.addNotificationResponseReceivedListener((response) => {
      const data = response.notification.request.content.data;
      if (data && typeof data === 'object' && 'payload' in data && typeof data.payload === 'string') {
        try {
          const payload = deserializeNotificationPayload(data.payload);
          logger.info('Notification response received', { payload });

          switch (payload.type) {
            case 'PARTNER_MATCH':
              if (payload.data && typeof payload.data.boardId === 'string') {
                router.push(`/board/${payload.data.boardId}`);
              }
              break;
            case 'PARTNER_INVITE':
              if (payload.data && typeof payload.data.inviteCode === 'string') {
                router.push(`/sync/${payload.data.inviteCode}`);
              }
              break;
            case 'PRICE_DROP':
              if (payload.data && typeof payload.data.productId === 'string') {
                router.push(`/product/${payload.data.productId}`);
              }
              break;
            case 'DISCOVERY_DROP':
              router.push('/discover');
              break;
            default:
              logger.info('Unhandled notification type', { type: payload.type });
          }
        } catch (e) {
          logger.error('Failed to parse notification payload', { error: e });
        }
      }
    });

    return () => {
      if (notificationListener.current) {
        notificationListener.current.remove();
      }
      if (responseListener.current) {
        responseListener.current.remove();
      }
    };
  }, [router, updatePushToken]);
}

export function useRequestPushPermission(): () => Promise<PushPermissionResult> {
  const updatePushToken = useUpdatePushToken();
  return async (): Promise<PushPermissionResult> => {
    return requestPushPermissionAndRegister(updatePushToken as unknown as (args: { token: string; platform: 'IOS' | 'ANDROID' | 'WEB'; service: 'APNS' | 'FCM' }) => Promise<unknown>);
  };
}
