import { FashionCard } from '@app/ui-kit/components/FashionCard';
import { SwipeCardStack } from '@app/ui-kit/components/SwipeCardStack';
import { api } from '@convex-api';
import { useMutation, useAction } from 'convex/react';
import React, { useState, useEffect } from 'react';
import { ActivityIndicator } from 'react-native';
import { YStack } from 'tamagui';

export function SwipeDeck() {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [products, setProducts] = useState<any[] | null>(null);
    const getVectorFeed = useAction(api.recommendations.getVectorFeed);
    const swipeMutation = useMutation(api.discovery.processSwipe);

    useEffect(() => {
        getVectorFeed({ limit: 10 }).then(setProducts).catch(console.error);
    }, [getVectorFeed]);

    if (products === null) {
        return (
            <YStack flex={1} justifyContent="center" alignItems="center">
                <ActivityIndicator size="large" />
            </YStack>
        );
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const handleSwipe = async (item: any, direction: 'left' | 'right' | 'up') => {
        let action: 'like' | 'pass' | 'super' = 'pass';
        if (direction === 'right') action = 'like';
        if (direction === 'up') action = 'super';

        try {
            await swipeMutation({
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                productId: (item as any)._id,
                action,
            });
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            console.log(`Swiped ${direction} on ${(item as any).title}`);
        } catch (e) {
            console.error("Swipe failed", e);
        }
    };

    return (
        <SwipeCardStack
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            data={products as any[]}
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            keyExtractor={(item: any) => item._id}
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            renderCard={(item: any) => (
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
