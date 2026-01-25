import { Search } from '@tamagui/lucide-icons';
import React from 'react';
import { SafeAreaView } from 'react-native';
import { YStack, H2, Text, Input } from 'tamagui';

export function SearchScreen() {
    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: 'white' }}>
            <YStack flex={1} padding="$4" space="$4">
                <H2>Search</H2>
                <Input placeholder="Search for items..." size="$4" borderWidth={1} />
                <YStack flex={1} justifyContent="center" alignItems="center">
                    <Search size={48} color="$textTertiary" />
                    <Text color="$textSecondary" marginTop="$4">Browse the marketplace</Text>
                </YStack>
            </YStack>
        </SafeAreaView>
    );
}
