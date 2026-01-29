import { Button } from '@app/ui-kit';
import { useNavigation } from '@react-navigation/native';
import React, { useState } from 'react';
import { Alert } from 'react-native';
import { YStack, Input, Text, H2 } from 'tamagui';

import { authAdapter } from '../../lib/auth';

export function PhoneAuthScreen() {
    const [phone, setPhone] = useState('');
    const [loading, setLoading] = useState(false);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const navigation = useNavigation<any>();

    const handleSendCode = async () => {
        setLoading(true);
        try {
            await authAdapter.signInWithPhone(phone);
            navigation.navigate('OTP', { phone });
        } catch (e) {
            console.error(e);
            Alert.alert('Error', 'Failed to send OTP. Please check your number.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <YStack flex={1} padding="$6" gap="$6" backgroundColor="$background">
            <YStack marginTop="$10" gap="$2">
                <H2 color="$textPrimary">Welcome back</H2>
                <Text color="$textSecondary">Enter your phone number to continue</Text>
            </YStack>

            <YStack gap="$4">
                <Input
                    borderWidth={1}
                    placeholder="+91 99999 99999"
                    value={phone}
                    onChangeText={setPhone}
                    keyboardType="phone-pad"
                    autoFocus
                />

                <Button
                    variant="primary"
                    size="large"
                    onPress={handleSendCode}
                    loading={loading}
                    disabled={!phone || loading}
                >
                    Send Code
                </Button>
            </YStack>
        </YStack>
    );
}
