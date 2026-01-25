import React, { useState } from 'react';
import { View, Text, ActivityIndicator } from 'react-native';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { SwipeCardStack } from '@app/ui-kit/components/SwipeCardStack';
import { FashionCard } from '@app/ui-kit/components/FashionCard';
import { YStack } from 'tamagui';

export function SwipeDeck() {
    const products = useQuery(api.discovery.getDiscoveryFeed, { limit: 10 });
    const swipeMutation = useMutation(api.discovery.processSwipe);

    if (products === undefined) {
        return (
            <YStack flex={1} justifyContent="center" alignItems="center">
                <ActivityIndicator size="large" />
            </YStack>
        );
    }

    const handleSwipe = async (item: any, direction: 'left' | 'right' | 'up') => {
        let action: 'like' | 'pass' | 'super' = 'pass';
        if (direction === 'right') action = 'like';
        if (direction === 'up') action = 'super';

        try {
            await swipeMutation({
                productId: item._id,
                action,
            });
            console.log(`Swiped ${direction} on ${item.title}`);
        } catch (e) {
            console.error("Swipe failed", e);
        }
    };

    return (
        <SwipeCardStack
            data={products}
            keyExtractor={(item) => item._id}
            renderCard={(item) => (
                <FashionCard
                    image={item.images[0]}
                    title={item.title}
                    price={item.price}
                    brand={item.brand}
                />
            )}
            onSwipe={handleSwipe}
        />
    );
}
