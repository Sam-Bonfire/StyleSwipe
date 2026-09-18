import {
  useCurrentUser,
  useNotificationPreferences,
  useSetNotificationPreferences,
  useUpdatePushToken,
} from '@app/infrastructure';
import { useToast } from '@app/ui-kit';
import * as Notifications from 'expo-notifications';
import React from 'react';
import { Switch } from 'react-native';
import { YStack, XStack, Text, H3 } from 'tamagui';

import { requestPushPermissionAndRegister } from '../lib/notifications';

type ToggleRowProps = {
  label: string;
  description?: string;
  value: boolean;
  onValueChange: (value: boolean) => void;
  disabled?: boolean;
};

function ToggleRow({ label, description, value, onValueChange, disabled }: ToggleRowProps): React.JSX.Element {
  return (
    <XStack justifyContent="space-between" alignItems="center" paddingVertical="$2">
      <YStack flex={1} gap="$1">
        <Text fontWeight="600" fontSize="$3">
          {label}
        </Text>
        {description ? (
          <Text fontSize="$2" color="$textSecondary">
            {description}
          </Text>
        ) : null}
      </YStack>
      <Switch value={value} onValueChange={onValueChange} disabled={disabled} />
    </XStack>
  );
}

export function NotificationSettings(): React.JSX.Element {
  const user = useCurrentUser();
  const userId: string | undefined = user?._id ?? (user as unknown as { id?: string })?.id;
  const prefs = useNotificationPreferences(userId);
  const setPrefs = useSetNotificationPreferences();
  const updatePushToken = useUpdatePushToken();
  const { showToast } = useToast();
  const [isToggling, setIsToggling] = React.useState<boolean>(false);

  if (userId === undefined) {
    return (
      <YStack padding="$4">
        <Text color="$textSecondary">Sign in to manage notifications.</Text>
      </YStack>
    );
  }

  if (prefs === undefined) {
    return (
      <YStack padding="$4">
        <Text color="$textSecondary">Loading preferences…</Text>
      </YStack>
    );
  }

  // Defaults if no row yet in DB
  const current = prefs ?? {
    push: true,
    email: true,
    inApp: true,
    priceDrops: true,
    partnerSync: true,
    dailyDrops: true,
    marketing: false,
  };

  const handleToggle = async (key: keyof typeof current, value: boolean): Promise<void> => {
    if (!userId) return;
    setIsToggling(true);
    try {
      // If enabling push, ensure permission + token registration (hexagonal via adapter)
      if (key === 'push' && value === true) {
        const { status } = await Notifications.getPermissionsAsync();
        if (status !== 'granted') {
          const result = await requestPushPermissionAndRegister(
            updatePushToken as unknown as (args: { token: string; platform: 'IOS' | 'ANDROID' | 'WEB'; service: 'APNS' | 'FCM' }) => Promise<unknown>,
          );
          if (!result.granted) {
            showToast({ title: 'Permission needed', message: 'Enable notifications in system settings.', variant: 'info' });
            setIsToggling(false);
            return;
          }
        }
      }

      const next = { ...current, [key]: value };
      await setPrefs({
        userId,
        push: next.push,
        email: next.email,
        inApp: next.inApp,
        priceDrops: next.priceDrops,
        partnerSync: next.partnerSync,
        dailyDrops: next.dailyDrops,
        marketing: next.marketing,
      });
      showToast({ title: 'Preferences saved', message: `${key} ${value ? 'enabled' : 'disabled'}`, variant: 'success' });
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      showToast({ title: 'Failed to save', message: msg, variant: 'error' });
    } finally {
      setIsToggling(false);
    }
  };

  return (
    <YStack gap="$4" padding="$4" backgroundColor="$background" borderRadius="$4">
      <H3 fontSize="$4">Notifications</H3>
      <YStack gap="$1" borderWidth={1} borderColor="$borderColor" borderRadius="$3" padding="$3">
        <ToggleRow label="Push notifications" description="Price drops, restocks, order updates, partner likes" value={current.push} onValueChange={(v) => void handleToggle('push', v)} disabled={isToggling} />
        <ToggleRow label="Price drops" value={current.priceDrops} onValueChange={(v) => void handleToggle('priceDrops', v)} disabled={isToggling || !current.push} />
        <ToggleRow label="Partner sync" value={current.partnerSync} onValueChange={(v) => void handleToggle('partnerSync', v)} disabled={isToggling || !current.push} />
        <ToggleRow label="Daily drops" value={current.dailyDrops} onValueChange={(v) => void handleToggle('dailyDrops', v)} disabled={isToggling || !current.push} />
        <ToggleRow label="In-app" value={current.inApp} onValueChange={(v) => void handleToggle('inApp', v)} disabled={isToggling} />
        <ToggleRow label="Email" value={current.email} onValueChange={(v) => void handleToggle('email', v)} disabled={isToggling} />
        <ToggleRow label="Marketing" description="Occasional offers" value={current.marketing} onValueChange={(v) => void handleToggle('marketing', v)} disabled={isToggling} />
      </YStack>
    </YStack>
  );
}
