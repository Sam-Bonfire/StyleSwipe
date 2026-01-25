import React, { useState } from 'react';
import { YStack, Input, Text, H1, XStack } from 'tamagui';
import { Button } from '@app/ui-kit';
import { authAdapter } from '../../lib/auth';
import { useNavigation } from '@react-navigation/native';
import { Alert } from 'react-native';

export function SignInScreen() {
    const [phone, setPhone] = useState('');
    const [loading, setLoading] = useState(false);
    const navigation = useNavigation<any>();

    const handleSignIn = async () => {
        setLoading(true);
        try {
            await authAdapter.signInWithPhone(phone);
            navigation.navigate('OTP', { phone });
        } catch (e) {
            console.error(e);
            Alert.alert('Error', 'Failed to send OTP. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <YStack flex={1} justifyContent="center" padding="$4" gap="$4" backgroundColor="$background">
            <YStack gap="$2" alignItems="center">
                <H1 textAlign="center" color="$textPrimary">StyleSwipe</H1>
                <Text textAlign="center" color="$textSecondary">Enter your phone number to continue</Text>
            </YStack>

            <YStack gap="$4">
                <Input
                    size="$4"
                    borderWidth={1}
                    placeholder="+1 234 567 8900"
                    value={phone}
                    onChangeText={setPhone}
                    keyboardType="phone-pad"
                    autoCapitalize="none"
                />

                <Button
                    variant="primary"
                    size="large"
                    onPress={handleSignIn}
                    loading={loading}
                    disabled={!phone || loading}
                >
                    Send Code
                </Button>
            </YStack>
        </YStack>
    );
}
