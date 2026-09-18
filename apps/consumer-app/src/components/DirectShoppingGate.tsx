import { useDirectShoppingEnabled } from '@app/infrastructure';
import { useRouter } from 'expo-router';
import React from 'react';
import { YStack, Spinner } from 'tamagui';

/**
 * DirectShoppingGate — renders direct-shopping routes (checkout, orders,
 * addresses) only when the direct_shopping flag is on; otherwise bounces
 * back to the tabs. The code ships so a future integration only flips a flag.
 */
export const DirectShoppingGate = ({ children }: { children: React.ReactNode }) => {
  const router = useRouter();
  const enabled = useDirectShoppingEnabled();

  React.useEffect(() => {
    if (enabled === false) router.replace('/(app)/(tabs)');
  }, [enabled, router]);

  if (!enabled) {
    return (
      <YStack flex={1} alignItems="center" justifyContent="center">
        <Spinner size="large" color="$primary" />
      </YStack>
    );
  }
  return <>{children}</>;
};
