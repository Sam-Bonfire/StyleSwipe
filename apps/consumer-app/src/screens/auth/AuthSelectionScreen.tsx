import { Button } from '@app/ui-kit';
import { useRouter } from 'expo-router';
import React from 'react';
import { YStack, Text, XStack, Image } from 'tamagui';

import logo from '../../../../../assets/logo/logo.png';

export function AuthSelectionScreen() {
  const router = useRouter();

  return (
    <YStack flex={1} padding="$6" backgroundColor="$background">
      <YStack
        flex={1}
        justifyContent="center"
        alignItems="center"
        gap="$2"
      >
        <YStack width="80%" aspectRatio={3.13} alignItems="center">
          <Image
            source={logo}
            width="100%"
            height="100%"
            resizeMode="contain"
          />
        </YStack>
        <Text
          textAlign="center"
          fontSize="$5"
          color="$textSecondary"
          paddingHorizontal="$6"
          lineHeight="$5"
        >
          Your personal AI fashion stylist. Personalized discovery, in one swipe.
        </Text>
      </YStack>

      {/* Actions and EULA - Anchored to the bottom */}
      <YStack gap="$1">
        <Button variant="primary" size="large" onPress={() => router.push('/(auth)/phone')}>
          Continue with Phone
        </Button>

        <Button variant="ghost" size="large" onPress={() => router.push('/(auth)/email')}>
          Continue with Email
        </Button>

        <XStack justifyContent="center" marginTop="$1">
          <Text textAlign="center" fontSize="$2" color="$textTertiary" lineHeight="$3">
            By continuing, you agree to our{'\n'}
            <Text color="$primary" fontWeight="600">
              Terms of Service
            </Text>{' '}
            and{' '}
            <Text color="$primary" fontWeight="600">
              Privacy Policy
            </Text>
            .
          </Text>
        </XStack>
      </YStack>
    </YStack>
  );
}
