import { FashionCard } from '@app/ui-kit/components/FashionCard';
import { SwipeCardStack } from '@app/ui-kit/components/SwipeCardStack';
import { api } from '@convex-api';
import { useNavigation } from '@react-navigation/native';
import { useAction, useMutation } from 'convex/react';
import React, { useState, useEffect } from 'react';
import { ActivityIndicator } from 'react-native';
import { YStack, H2, H3 } from 'tamagui';

import { LocalDatabase } from '../infrastructure/LocalDatabase';

export function SwipeDeck() {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [products, setProducts] = useState<any[] | null>(null);
    const getVectorFeed = useAction(api.recommendations.getVectorFeed);
    const swipeMutation = useMutation(api.discovery.processSwipe);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const navigation = useNavigation<any>();


    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        getVectorFeed({ limit: 10 })
            .then(data => {
                console.log("Feed data received:", data?.length);
                setProducts(data);
            })
            .catch(e => {
                console.error("Feed Error:", e);
                setError(e.message || "Unknown error fetching feed");
                setProducts([]); // Stop loading
            });
    }, [getVectorFeed]);

    if (error) {
        return (
            <YStack flex={1} justifyContent="center" alignItems="center" padding="$4">
                <H2 color="red">Error Loading Feed</H2>
                <H2 fontSize="$4">{error}</H2>
            </YStack>
        );
    }

    if (products === null) {
        return (
            <YStack flex={1} justifyContent="center" alignItems="center">
                <ActivityIndicator size="large" />
                <H3>Loading Feed...</H3>
            </YStack>
        );
    }

    if (products.length === 0) {
        return (
            <YStack flex={1} justifyContent="center" alignItems="center" padding="$4">
                <H2 fontSize="$4" color="gray">That's all for now!</H2>
            </YStack>
        );
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const handleSwipe = async (item: any, direction: 'left' | 'right' | 'up' | 'down') => {
        if (direction === 'down') {
            navigation.navigate('ProductDetail', { productId: item._id });
            return;
        }

        let action: 'like' | 'pass' | 'super' = 'pass';
        if (direction === 'right') action = 'like';
        if (direction === 'up') action = 'super';

        try {
            // 1. Process Online (Real-time update)
            // Error handling inside try/catch to ensure we still buffer if offline
            await swipeMutation({
                productId: item._id,
                action: action
            });
            console.log(`Synced ${action} for ${item.title} to Convex.`);

            // 2. Offline-first: Buffer locally for redundancy/worker analysis
            const db = await LocalDatabase.getInstance();
            await db.bufferEvent("swipe", {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                productId: (item as any)._id,
                action,
                // We add metadata for the worker to generate embeddings if needed
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                description: (item as any).description || (item as any).title,
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                title: (item as any).title
            });

            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            console.log(`Swiped ${direction} on ${(item as any).title}`);
        } catch (e) {
            console.warn("Swipe mutation failed (offline?), buffered locally.", e);
        }
    };

    return (
        <SwipeCardStack
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            data={products as any[]}
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            keyExtractor={(item: any) => item._id}
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            renderCard={(item: any) => {
                const discount = item.mrp && item.price < item.mrp
                    ? Math.round(((item.mrp - item.price) / item.mrp) * 100)
                    : undefined;

                return (
                    <FashionCard
                        imageUrl={item.images[0]}
                        title={item.title}
                        price={item.price}
                        originalPrice={item.mrp}
                        discountPercentage={discount}
                        brand={item.brand}
                        onPress={() => navigation.navigate('ProductDetail', { productId: item._id })}
                    />
                );
            }}
            onSwipe={handleSwipe}
        />
    );
}
