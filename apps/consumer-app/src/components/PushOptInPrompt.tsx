import { Button, useToast } from '@app/ui-kit';
import { BellRing, X } from '@tamagui/lucide-icons';
import React from 'react';
import { YStack, XStack, Text, H3 } from 'tamagui';

import { useRequestPushPermission } from '../lib/notifications';

type PushOptInPromptProps = {
  onGranted?: () => void;
  onDismissed?: () => void;
  onClose?: () => void;
};

export function PushOptInPrompt({ onGranted, onDismissed, onClose }: PushOptInPromptProps): React.JSX.Element {
  const requestPermission = useRequestPushPermission();
  const { showToast } = useToast();
  const [isLoading, setIsLoading] = React.useState<boolean>(false);

  const handleEnable = async (): Promise<void> => {
    setIsLoading(true);
    const result = await requestPermission();
    setIsLoading(false);
    if (result.granted) {
      showToast({ title: 'Notifications enabled 🎉', message: "We'll ping you for price drops and partner matches.", variant: 'success' });
      onGranted?.();
    } else {
      showToast({ title: 'Maybe later', message: 'You can enable notifications from Profile → Settings.', variant: 'info' });
      onDismissed?.();
    }
    onClose?.();
  };

  const handleNotNow = (): void => {
    showToast({ title: 'No worries', message: 'You can enable notifications later in Settings.', variant: 'info' });
    onDismissed?.();
    onClose?.();
  };

  return (
    <YStack gap="$4" padding="$5" backgroundColor="$background" borderRadius="$6" borderWidth={1} borderColor="$borderColor">
      <XStack justifyContent="space-between" alignItems="center">
        <XStack gap="$3" alignItems="center">
          <YStack backgroundColor="$primary" padding="$2" borderRadius="$4">
            <BellRing size={20} color="white" />
          </YStack>
          <H3 fontSize="$5">Stay in the loop?</H3>
        </XStack>
        <XStack pressStyle={{ opacity: 0.6 }} onPress={onClose} cursor="pointer" padding="$2">
          <X size={18} />
        </XStack>
      </XStack>

      <Text color="$textSecondary" fontSize="$3">
        Get notified for price drops, back-in-stock alerts, partner likes and order updates. No spam — only the good stuff.
      </Text>

      <XStack gap="$3">
        <Button variant="outlined" onPress={handleNotNow} disabled={isLoading} style={{ flex: 1 }}>
          Not now
        </Button>
        <Button variant="primary" onPress={handleEnable} disabled={isLoading} style={{ flex: 1 }}>
          {isLoading ? 'Enabling...' : 'Enable'}
        </Button>
      </XStack>
    </YStack>
  );
}
