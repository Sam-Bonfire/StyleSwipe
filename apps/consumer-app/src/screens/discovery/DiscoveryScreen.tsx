import React from 'react';
import { View, SafeAreaView } from 'react-native';
import { SwipeDeck } from '../../components/SwipeDeck';
import { YStack, Text, H2 } from 'tamagui';

export function DiscoveryScreen() {
    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: 'white' }}>
            <YStack flex={1} padding="$4" space="$4">
                <H2 textAlign="center">StyleSwipe Discover</H2>
                <SwipeDeck />
            </YStack>
        </SafeAreaView>
    );
}
