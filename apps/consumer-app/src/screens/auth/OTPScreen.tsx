import { Button } from '@app/ui-kit';
import { useLocalSearchParams } from 'expo-router';
import React, { useState } from 'react';
import { Alert } from 'react-native';
import { YStack, Input, Text, H2 } from 'tamagui';

import { authAdapter } from '../../lib/auth';

export function OTPScreen() {
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const { phone } = useLocalSearchParams<{ phone: string }>();

  const handleVerify = async () => {
    setLoading(true);
    try {
      await authAdapter.verifyOTP(phone, otp);
      // NavigationGuard in App.tsx will handle the redirect automatically
    } catch (e) {
      console.error(e);
      Alert.alert('Error', 'Invalid Code. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <YStack flex={1} justifyContent="center" padding="$4" gap="$4" backgroundColor="$background">
      <YStack gap="$2" alignItems="center">
        <H2 textAlign="center" color="$textPrimary">
          Verify Phone
        </H2>
        <Text textAlign="center" color="$textSecondary">
          Enter the code sent to {phone}
        </Text>
      </YStack>

      <YStack gap="$4">
        <Input
          borderWidth={1}
          placeholder="123456"
          value={otp}
          onChangeText={setOtp}
          keyboardType="number-pad"
          maxLength={6}
        />

        <Button
          variant="primary"
          size="large"
          onPress={handleVerify}
          loading={loading}
          disabled={otp.length < 4 || loading}
        >
          Verify
        </Button>
      </YStack>
    </YStack>
  );
}
