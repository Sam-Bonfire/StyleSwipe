import { WifiOff, CloudOff } from '@tamagui/lucide-icons';
import * as Network from 'expo-network';
import React, { useEffect, useState } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { YStack, XStack, Text } from 'tamagui';

import { LocalDatabase } from '../infrastructure/LocalDatabase';

type BannerState = {
  isOffline: boolean;
  bufferedCount: number;
};

export function OfflineBanner(): React.JSX.Element | null {
  const [state, setState] = useState<BannerState>({ isOffline: false, bufferedCount: 0 });
  const insets = useSafeAreaInsets();

  useEffect(() => {
    let mounted = true;

    const check = async (): Promise<void> => {
      try {
        const [networkState, db] = await Promise.all([
          Network.getNetworkStateAsync(),
          LocalDatabase.getInstance().catch(() => null),
        ]);
        const isOffline: boolean = networkState.isConnected === false;
        let bufferedCount = 0;
        if (db) {
          const events = await db.getEvents(200).catch(() => []);
          bufferedCount = events.length;
        }
        if (mounted) setState({ isOffline, bufferedCount });
      } catch {
        // Assume online if check fails
        if (mounted) setState((s) => ({ ...s, isOffline: false }));
      }
    };

    void check();
    const interval = setInterval(() => {
      void check();
    }, 4000);

    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, []);

  const { isOffline, bufferedCount } = state;

  // Background sync runs silently — never surface it as a banner/toast.
  // Only the offline state gets a banner.
  if (!isOffline) return null;

  return (
    <YStack
      position="absolute"
      top={insets.top > 0 ? insets.top : 20}
      left={16}
      right={16}
      backgroundColor="$primary"
      padding="$3"
      borderRadius="$4"
      zIndex={1000}
      elevation="$4"
      opacity={0.97}
    >
      <XStack alignItems="center" gap="$2" justifyContent="center">
        <WifiOff size={18} color="white" />
        <Text fontFamily="$body" color="white" fontWeight="bold" fontSize="$3">
          {bufferedCount > 0
            ? `You're offline — ${bufferedCount} swipe${bufferedCount === 1 ? '' : 's'} will sync`
            : "You're offline — swipes will sync when you're back"}
        </Text>
      </XStack>
      {bufferedCount > 0 ? (
        <XStack alignItems="center" gap="$2" justifyContent="center" marginTop="$1">
          <CloudOff size={14} color="white" />
          <Text fontFamily="$body" color="white" fontSize="$2" opacity={0.9}>
            {bufferedCount} buffered • auto-sync on reconnect
          </Text>
        </XStack>
      ) : null}
    </YStack>
  );
}
