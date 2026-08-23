import React from 'react';
import { Image } from 'react-native';
import { XStack } from 'tamagui';

// Verify path - in Expo/RN usually requires require()
// Use shared asset from workspace root

// eslint-disable-next-line @typescript-eslint/no-require-imports
const logoSource = require('../../../../assets/favicon/favicon.png');

export const AppLogo = () => {
  return (
    <XStack alignItems="center">
      <Image source={logoSource} style={{ width: 40, height: 40, resizeMode: 'contain' }} />
    </XStack>
  );
};
