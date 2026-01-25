import React from 'react';
import { YStack, Text, H1, XStack, Spacer } from 'tamagui';
import { Button } from '@app/ui-kit';
import { useNavigation } from '@react-navigation/native';

export function AuthSelectionScreen() {
    const navigation = useNavigation<any>();

    return (
        <YStack flex={1} padding="$6" backgroundColor="$background">
            {/* Logo and Copy - centered in the remaining top space */}
            <YStack flex={1} justifyContent="center" alignItems="center" gap="$4">
                <H1 textAlign="center" fontSize="$11" fontWeight="900" color="$textPrimary" letterSpacing={-1}>
                    StyleSwipe
                </H1>
                <Text textAlign="center" fontSize="$5" color="$textSecondary" paddingHorizontal="$6" lineHeight="$5">
                    Your personal AI fashion stylist. Personalized discovery, in one swipe.
                </Text>
            </YStack>

            {/* Actions and EULA - Anchored to the bottom */}
            <YStack gap="$1">
                <Button
                    variant="primary"
                    size="large"
                    onPress={() => navigation.navigate('PhoneAuth')}
                >
                    Continue with Phone
                </Button>

                <Button
                    variant="ghost"
                    size="large"
                    onPress={() => navigation.navigate('EmailAuth')}
                >
                    Continue with Email
                </Button>

                <XStack justifyContent="center" marginTop="$1">
                    <Text textAlign="center" fontSize="$2" color="$textTertiary" lineHeight="$3">
                        By continuing, you agree to our{"\n"}
                        <Text color="$primary" fontWeight="600">Terms of Service</Text> and <Text color="$primary" fontWeight="600">Privacy Policy</Text>.
                    </Text>
                </XStack>
            </YStack>
        </YStack>
    );
}
