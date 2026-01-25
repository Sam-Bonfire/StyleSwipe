import React from 'react';
import { SafeAreaView } from 'react-native';
import { YStack, H2, Text } from 'tamagui';

export function HomeScreen() {
    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: 'white' }}>
            <YStack flex={1} padding="$4" justifyContent="center" alignItems="center" space="$4">
                <H2>Home</H2>
                <Text color="$textSecondary" textAlign="center">Explore offers, trending styles, and exclusive collections.</Text>
            </YStack>
        </SafeAreaView>
    );
}
