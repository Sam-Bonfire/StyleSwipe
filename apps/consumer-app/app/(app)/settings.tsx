import React from 'react';
import { SafeAreaView, ScrollView } from 'react-native';
import { YStack, H2 } from 'tamagui';

import { NotificationSettings } from '../../src/components/NotificationSettings';

export default function SettingsRoute(): React.JSX.Element {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: 'white' }}>
      <ScrollView>
        <YStack padding="$4" gap="$4">
          <H2>Settings</H2>
          <NotificationSettings />
        </YStack>
      </ScrollView>
    </SafeAreaView>
  );
}
