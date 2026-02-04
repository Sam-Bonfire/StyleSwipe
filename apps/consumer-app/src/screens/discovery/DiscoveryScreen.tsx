import React from 'react';
import { SafeAreaView } from 'react-native';
import { YStack } from 'tamagui';

import { SwipeDeck } from '../../components/SwipeDeck';

export function DiscoveryScreen() {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: 'white' }}>
      <YStack flex={1} padding="$4" space="$4">
        <SwipeDeck />
      </YStack>
    </SafeAreaView>
  );
}
