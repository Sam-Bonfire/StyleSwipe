import { WifiOff } from '@tamagui/lucide-icons';
import * as Network from 'expo-network';
import React, { useEffect, useState } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { YStack, XStack, Text } from 'tamagui';

export function OfflineBanner() {
  const [isOffline, setIsOffline] = useState(false);
  const insets = useSafeAreaInsets();

  useEffect(() => {
    let interval: NodeJS.Timeout;

    const checkNetwork = async () => {
      try {
        const networkState = await Network.getNetworkStateAsync();
        setIsOffline(networkState.isConnected === false);
      } catch (e) {
        // Assume online if we can't check
      }
    };

    // Initial check
    checkNetwork();

    // Poll every 5 seconds since expo-network doesn't have an event listener for state changes
    interval = setInterval(checkNetwork, 5000);

    return () => clearInterval(interval);
  }, []);

  if (!isOffline) return null;

  return (
    <YStack
      position="absolute"
      top={insets.top > 0 ? insets.top : 20}
      left={16}
      right={16}
      backgroundColor="$danger"
      padding="$3"
      borderRadius="$4"
      zIndex={1000}
      elevation="$4"
      opacity={0.95}
    >
      <XStack alignItems="center" gap="$2" justifyContent="center">
        <WifiOff size={18} color="white" />
        <Text color="white" fontWeight="bold">
          No Internet Connection
        </Text>
      </XStack>
    </YStack>
  );
}
