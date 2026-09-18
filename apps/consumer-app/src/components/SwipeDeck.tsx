/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
import { type Vector384, FilterState } from '@app/core';
import { useVectorFeed, useProcessSwipe, useCurrentUser, useAnalytics } from '@app/infrastructure';
import { Button } from '@app/ui-kit/components/Button';
import { FashionCard } from '@app/ui-kit/components/FashionCard';
import { Modal } from '@app/ui-kit/components/Modal';
import { SwipeCardStack, SwipeCardStackRef } from '@app/ui-kit/components/SwipeCardStack';
import { Undo2 } from '@tamagui/lucide-icons';
import { useRouter } from 'expo-router';
import React, { useState, useEffect, useRef } from 'react';
import { ActivityIndicator, Image } from 'react-native';
import { YStack, H2, H3, Text } from 'tamagui';

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

export interface SwipeDeckProps {
  filterState?: FilterState;
  partnerId?: string;
  influenceRatio?: number;
}

export function SwipeDeck({ filterState, partnerId, influenceRatio }: SwipeDeckProps) {
  const [products, setProducts] = useState<SwipeDeckProduct[] | null>(null);
  const [matchedProduct, setMatchedProduct] = useState<SwipeDeckProduct | null>(null);
  const getVectorFeed = useVectorFeed();
  const processSwipe = useProcessSwipe();
  const user = useCurrentUser();
  const router = useRouter();
  const { trackEvent } = useAnalytics();

  const stackRef = useRef<SwipeCardStackRef>(null);
  const [error, setError] = useState<string | null>(null);
  const [superLikeTrigger, setSuperLikeTrigger] = useState(0);

  useEffect(() => {
    setProducts(null); // Reset before fetching
    getVectorFeed({ limit: 10, influenceRatio })
      .then((data) => {
        console.log('Feed data received:', data?.length);
        setProducts(data as SwipeDeckProduct[]);
      })
      .catch((e) => {
        console.error('Feed Error:', e);
        setError(e.message || 'Unknown error fetching feed');
        setProducts([]); // Stop loading
      });
  }, [getVectorFeed, filterState, influenceRatio]);

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
      const result = await processSwipe({
        userId: user?._id || '',
        productId: item._id,
        action: action,
        timestamp: Date.now(),
        userPreferenceVector: user?.styleProfile?.preferenceVector,
        productEmbedding: item.embedding,
        partnerId,
      });
      console.log(`Synced ${action} for ${item.title} to Convex. Mutual match: ${result.isMutualMatch}`);

      if (result.isMutualMatch) {
        setMatchedProduct(item);
      }

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
      {/* @ts-expect-error generic mismatch */}
      <SwipeCardStack
        ref={stackRef}
        data={products as unknown as never[]}
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
        onSwipe={handleSwipe as unknown as never}
      />
      <Button
        position="absolute"
        bottom="$6"
        right="$6"
        size="medium"
        circular
        icon={Undo2}
        onPress={() => stackRef.current?.rewind()}
        backgroundColor="$background"
        borderColor="$borderColor"
        borderWidth={1}
      />

      <Modal
        open={!!matchedProduct}
        onClose={() => setMatchedProduct(null)}
        title="It's a Match! 🎉"
      >
        {matchedProduct && (
          <YStack alignItems="center" gap="$4" padding="$4">
            <Text fontSize="$4" textAlign="center" color="$textSecondary">
              You and your partner both liked this item!
            </Text>

            <Image
              source={{ uri: matchedProduct.images[0] }}
              style={{ width: 160, height: 200, borderRadius: 12 }}
              resizeMode="cover"
            />

            <H3 textAlign="center">{matchedProduct.title}</H3>
            <Text fontSize="$5" fontWeight="bold" color="$primary">${matchedProduct.price}</Text>

            <YStack gap="$3" width="100%" marginTop="$4">
              <Button variant="primary" onPress={() => {
                setMatchedProduct(null);
                router.push({ pathname: '/(app)/product/[id]', params: { id: matchedProduct._id } });
              }}>
                View Product Details
              </Button>
              <Button variant="secondary" onPress={() => {
                // TODO: Save to shared board action
                setMatchedProduct(null);
              }}>
                Save to Shared Board
              </Button>
              <Button variant="ghost" onPress={() => setMatchedProduct(null)}>
                Keep Swiping
              </Button>
            </YStack>
          </YStack>
        )}
      </Modal>
    </YStack>
  );
}
