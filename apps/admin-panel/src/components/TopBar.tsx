
import React from 'react';
import { XStack, YStack, Text } from 'tamagui';

export function TopBar() {
  return (
    <XStack justifyContent="space-between" marginBottom="$6">
      <YStack>
        <Text color="$textSecondary" fontSize="$2" textTransform="uppercase" letterSpacing={1}>
          Please be careful while operating this app
        </Text>
      </YStack>
    </XStack>
  );
}
