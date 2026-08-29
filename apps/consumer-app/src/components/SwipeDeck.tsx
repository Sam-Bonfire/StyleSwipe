import { type Vector384 } from '@app/core';
import { useVectorFeed, useProcessSwipe, useCurrentUser, useAnalytics } from '@app/infrastructure';
import { Undo2 } from '@tamagui/lucide-icons';
import { FashionCard } from '@app/ui-kit/components/FashionCard';
import { SwipeCardStack, SwipeCardStackRef } from '@app/ui-kit/components/SwipeCardStack';
import { useRouter } from 'expo-router';
import React, { useState, useEffect, useRef } from 'react';
import { ActivityIndicator } from 'react-native';
import { YStack, H2, H3, Button } from 'tamagui';

import { LocalDatabase } from '../infrastructure/LocalDatabase';
import { SuperLikeStarburst } from './SwipeAnimations';


interface SwipeDeckProduct {
  _id: string;
  title: string;
  description?: string;
  price: number;
  mrp?: number;
  brand?: string;
  images: string[];
  embedding?: Vector384;
}

export function SwipeDeck() {
  const [products, setProducts] = useState<SwipeDeckProduct[] | null>(null);
  const getVectorFeed = useVectorFeed();
  const processSwipe = useProcessSwipe();
  const user = useCurrentUser();
  const router = useRouter();
  const { trackEvent } = useAnalytics();

  const stackRef = useRef<SwipeCardStackRef>(null);
  const [error, setError] = useState<string | null>(null);
  const [superLikeTrigger, setSuperLikeTrigger] = useState(0);

  useEffect(() => {
    getVectorFeed({ limit: 10 })
      .then((data) => {
        console.log('Feed data received:', data?.length);
        setProducts(data as SwipeDeckProduct[]);
      })
      .catch((e) => {
        console.error('Feed Error:', e);
        setError(e.message || 'Unknown error fetching feed');
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
        <H2 fontSize="$4" color="gray">
          That's all for now!
        </H2>
      </YStack>
    );
  }

  const handleSwipe = async (item: SwipeDeckProduct, direction: 'left' | 'right' | 'up' | 'down') => {
    if (direction === 'down') {
      router.push({ pathname: '/(app)/product/[id]', params: { id: item._id } });
      return;
    }

    let action: 'like' | 'pass' | 'super' = 'pass';
    if (direction === 'right') action = 'like';
    if (direction === 'up') {
      action = 'super';
      setSuperLikeTrigger(prev => prev + 1);
    }

    try {
      // 1. Process Online via use case (validates + persists)
      await processSwipe({
        userId: user?._id || '', 
        productId: item._id,
        action: action,
        timestamp: Date.now(),
        userPreferenceVector: user?.styleProfile?.preferenceVector,
        productEmbedding: item.embedding,
      });
      console.log(`Synced ${action} for ${item.title} to Convex.`);

      // 2. Offline-first: Buffer locally for redundancy/worker analysis
      const db = await LocalDatabase.getInstance();
      await db.bufferEvent('swipe', {
        productId: item._id,
        action,
        // We add metadata for the worker to generate embeddings if needed
        description: item.description || item.title,
        title: item.title,
      });

      console.log(`Swiped ${direction} on ${item.title}`);
      
      trackEvent('product_swiped', { action }, { variant: 'macro_v1', productId: item._id });
    } catch (e) {
      console.warn('Swipe mutation failed (offline?), buffered locally.', e);
    }
  };

  return (
    <YStack flex={1} position="relative">
      <SuperLikeStarburst trigger={superLikeTrigger} />
      <SwipeCardStack
        ref={stackRef}
        data={products}
        keyExtractor={(item: SwipeDeckProduct) => item._id}
        renderCard={(item: SwipeDeckProduct) => {
          const discount =
            item.mrp && item.price < item.mrp
              ? Math.round(((item.mrp - item.price) / item.mrp) * 100)
              : undefined;

          return (
            <FashionCard
              imageUrl={item.images[0] || ''}
              title={item.title}
              price={item.price}
              originalPrice={item.mrp}
              discountPercentage={discount}
              brand={item.brand || 'Unknown'}
              width="100%"
              height="100%"
              onPress={() => router.push({ pathname: '/(app)/product/[id]', params: { id: item._id } })}
            />
          );
        }}
        onSwipe={handleSwipe}
      />
      <Button
        position="absolute"
        bottom="$6"
        right="$6"
        size="$4"
        circular
        icon={Undo2}
        onPress={() => stackRef.current?.rewind()}
        backgroundColor="$background"
        borderColor="$borderColor"
        borderWidth={1}
      />
    </YStack>
  );
}
