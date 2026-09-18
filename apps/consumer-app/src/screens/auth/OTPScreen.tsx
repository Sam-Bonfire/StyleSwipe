import { Button, InputOTP, useToast } from '@app/ui-kit';
import { useLocalSearchParams } from 'expo-router';
import React, { useState } from 'react';
import { YStack, Text, H2 } from 'tamagui';

import { authAdapter } from '../../lib/auth';

export function OTPScreen() {
  const [otp, setOtp] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [resendSeconds, setResendSeconds] = useState<number>(30);
  const { phone } = useLocalSearchParams<{ phone: string }>();
  const { showToast } = useToast();

  React.useEffect(() => {
    if (resendSeconds <= 0) return;
    const t = setTimeout(() => setResendSeconds((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [resendSeconds]);

  const handleVerify = async (): Promise<void> => {
    setLoading(true);
    try {
      await authAdapter.verifyOTP(phone, otp);
    } catch (e) {
      console.error(e);
      showToast({ message: 'Invalid code. Please try again.', variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async (): Promise<void> => {
    if (resendSeconds > 0) return;
    try {
      await authAdapter.signInWithPhone(phone);
      setResendSeconds(30);
      showToast({ message: 'Code resent', variant: 'success' });
    } catch (e) {
      console.error(e);
      showToast({ message: 'Failed to resend code', variant: 'error' });
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
        <InputOTP value={otp} onChange={setOtp} length={6} autoFocus />

        <Button
          variant="primary"
          size="large"
          onPress={handleVerify}
          loading={loading}
          disabled={otp.length < 6 || loading}
        >
          Verify
        </Button>

        <YStack alignItems="center" gap="$2">
          {resendSeconds > 0 ? (
            <Text color="$textSecondary" fontSize="$3">
              Resend code in {resendSeconds}s
            </Text>
          ) : (
            <Text color="$primary" fontWeight="600" onPress={handleResend} pressStyle={{ opacity: 0.6 }}>
              Resend code
            </Text>
          )}
        </YStack>
      </YStack>
    </YStack>
  );
}
