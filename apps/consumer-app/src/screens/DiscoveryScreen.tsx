import React, { useState } from 'react';
import { View, SafeAreaView } from 'react-native';
import { SwipeDeck } from '../components/SwipeDeck';
import { InfluenceControl } from '../components/discovery/InfluenceControl';
import { YStack, Text, H2 } from 'tamagui';

// Mock Partner ID for demo purposes - in real app, this comes from context or navigation
const DEMO_PARTNER_ID = "jw7e8r6g213j123"; // Replace with real ID if testing

export function DiscoveryScreen() {
    const [influenceRatio, setInfluenceRatio] = useState(0);

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: 'white' }}>
            <YStack flex={1} padding="$4" space="$4">
                <H2 textAlign="center">StyleSwipe Discover</H2>

                <InfluenceControl
                    ratio={influenceRatio}
                    onRatioChange={setInfluenceRatio}
                    partnerName="Emma"
                />

                <SwipeDeck
                    influenceRatio={influenceRatio}
                // partnerId={DEMO_PARTNER_ID as any} // Uncomment to test with real ID
                />
            </YStack>
        </SafeAreaView>
    );
}
