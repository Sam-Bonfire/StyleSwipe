import { WifiOff, RefreshCw, CloudOff } from '@tamagui/lucide-icons';
import * as Network from 'expo-network';
import React, { useEffect, useState } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { YStack, XStack, Text, Spinner } from 'tamagui';

import { LocalDatabase } from '../infrastructure/LocalDatabase';

type BannerState = {
  isOffline: boolean;
  bufferedCount: number;
  isSyncing: boolean;
};

export function OfflineBanner(): React.JSX.Element | null {
  const [state, setState] = useState<BannerState>({ isOffline: false, bufferedCount: 0, isSyncing: false });
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
        let isSyncing = false;
        if (db) {
          const events = await db.getEvents(200).catch(() => []);
          bufferedCount = events.length;
          // heuristic: if online and bufferedCount>0, assume sync will flush soon (BackgroundWorker interval)
          isSyncing = !isOffline && bufferedCount > 0;
        }
        if (mounted) setState({ isOffline, bufferedCount, isSyncing });
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

  const { isOffline, bufferedCount, isSyncing } = state;

  // Online + pending flush indicator (Req 9.3)
  if (!isOffline && bufferedCount > 0) {
    return (
      <YStack
        position="absolute"
        top={insets.top > 0 ? insets.top : 20}
        left={16}
        right={16}
        backgroundColor="$backgroundHover"
        padding="$3"
        borderRadius="$4"
        zIndex={1000}
        elevation="$4"
        opacity={0.97}
        borderWidth={1}
        borderColor="$borderColor"
      >
        <XStack alignItems="center" gap="$2" justifyContent="center">
          <RefreshCw size={16} color="$primary" />
          <Text fontSize="$3" fontWeight="600">
            {isSyncing ? `Syncing ${bufferedCount} swipe${bufferedCount === 1 ? '' : 's'}...` : `${bufferedCount} swipes queued — will sync shortly`}
          </Text>
          {isSyncing ? <Spinner size="small" color="$primary" /> : null}
        </XStack>
      </YStack>
    );
  }

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
        <Text color="white" fontWeight="bold" fontSize="$3">
          {bufferedCount > 0
            ? `You're offline — ${bufferedCount} swipe${bufferedCount === 1 ? '' : 's'} will sync`
            : "You're offline — swipes will sync when you're back"}
        </Text>
      </XStack>
      {bufferedCount > 0 ? (
        <XStack alignItems="center" gap="$2" justifyContent="center" marginTop="$1">
          <CloudOff size={14} color="white" />
          <Text color="white" fontSize="$2" opacity={0.9}>
            {bufferedCount} buffered • auto-sync on reconnect
          </Text>
        </XStack>
      ) : null}
    </YStack>
  );
}
