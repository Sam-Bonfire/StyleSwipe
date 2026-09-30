/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
import { type Vector384, FilterState, discountPercentage, applyProductFilters, sortProducts, type SortOption } from '@app/core';
import { useVectorFeed, useProcessSwipe, useAnalytics, useAddBoardItem } from '@app/infrastructure';
import { Button } from '@app/ui-kit/components/Button';
import { FashionCard } from '@app/ui-kit/components/FashionCard';
import { Modal } from '@app/ui-kit/components/Modal';
import { SwipeCardStack, SwipeCardStackRef } from '@app/ui-kit/components/SwipeCardStack';
import { Undo2 } from '@tamagui/lucide-icons';
import { useRouter } from 'expo-router';
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { ActivityIndicator, Image } from 'react-native';
import { YStack, H2, H3, Text } from 'tamagui';

import { useSwipeActions } from '../hooks/useSwipeActions';
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
  sort?: SortOption;
  partnerId?: string;
  influenceRatio?: number;
  sharedBoardId?: string;
}

const FEED_PAGE_SIZE = 30;
const REFILL_THRESHOLD = 5;

export function SwipeDeck({ filterState, sort, partnerId, influenceRatio, sharedBoardId }: SwipeDeckProps) {
  const [products, setProducts] = useState<SwipeDeckProduct[] | null>(null);
  const [savedToShared, setSavedToShared] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const addBoardItem = useAddBoardItem();
  // Cards swiped in the current feed (the stack advances its own index;
  // this mirrors it so we know when to refill).
  const [swipedCount, setSwipedCount] = useState(0);
  const seenIds = useRef<Set<string>>(new Set());
  const exhaustedRef = useRef(false);
  const loadingMoreRef = useRef(false);
  const [matchedProduct, setMatchedProduct] = useState<SwipeDeckProduct | null>(null);
  const getVectorFeed = useVectorFeed();
  const processSwipe = useProcessSwipe();
  const { bufferSwipe } = useSwipeActions();
  const router = useRouter();
  const { trackEvent } = useAnalytics();

  const stackRef = useRef<SwipeCardStackRef>(null);
  const [error, setError] = useState<string | null>(null);
  const [superLikeTrigger, setSuperLikeTrigger] = useState(0);

  const fetchFeed = useCallback(
    async (append: boolean) => {
      if (append) {
        if (loadingMoreRef.current || exhaustedRef.current) return;
        loadingMoreRef.current = true;
      }
      try {
        const data = await getVectorFeed({ limit: FEED_PAGE_SIZE, influenceRatio });
        let items = ((data ?? []) as unknown as SwipeDeckProduct[]).filter(
          (p) => p && typeof p._id === 'string' && !seenIds.current.has(p._id),
        );
        if (filterState) {
          items = sortProducts(applyProductFilters(items, filterState), sort ?? 'RELEVANCE');
        }
        if (items.length === 0) {
          exhaustedRef.current = true;
          if (!append) setProducts([]);
          return;
        }
        for (const item of items) seenIds.current.add(item._id);
        setProducts((prev) => (append && prev ? [...prev, ...items] : items));
        console.log('Feed data received:', items.length);
      } catch (e) {
        if (!append) {
          console.error('Feed Error:', e);
          setError(e instanceof Error ? e.message : 'Unknown error fetching feed');
          setProducts([]); // Stop loading
        }
      } finally {
        if (append) loadingMoreRef.current = false;
      }
    },
    [getVectorFeed, filterState, sort, influenceRatio],
  );

  // Initial load + refetch when filters/sort/blend change
  useEffect(() => {
    seenIds.current.clear();
    exhaustedRef.current = false;
    loadingMoreRef.current = false;
    setSwipedCount(0);
    setError(null);
    setProducts(null); // Reset before fetching
    void fetchFeed(false);
  }, [fetchFeed]);

  // Quietly refill as the stack runs low; the stack keeps its own index
  // over the (only ever appended-to) array, so appending is safe.
  useEffect(() => {
    if (products && products.length > 0 && products.length - swipedCount <= REFILL_THRESHOLD) {
      void fetchFeed(true);
    }
  }, [products, swipedCount, fetchFeed]);

  if (error) {
    return (
      <YStack flex={1} justifyContent="center" alignItems="center" padding="$4">
        <H2 fontFamily="$heading" color="red">Error Loading Feed</H2>
        <H2 fontFamily="$heading" fontSize="$4">{error}</H2>
      </YStack>
    );
  }

  if (products === null) {
    return (
      <YStack flex={1} justifyContent="center" alignItems="center">
        <ActivityIndicator size="large" />
        <H3 fontFamily="$heading">Loading Feed...</H3>
      </YStack>
    );
  }

  if (products.length === 0) {
    return (
      <YStack flex={1} justifyContent="center" alignItems="center" padding="$4">
        <H2 fontFamily="$heading" fontSize="$4" color="gray">
          That's all for now!
        </H2>
      </YStack>
    );
  }

  const handleSwipe = async (item: SwipeDeckProduct, direction: 'left' | 'right' | 'up' | 'down') => {
    // The stack advances its own index for every swipe; mirror it for refill.
    setSwipedCount((c) => c + 1);
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
      // Server runs the swipe use case (validates + persists + matches)
      const result = await processSwipe({
        productId: item._id,
        action: action,
        partnerId,
      });
      console.log(`Synced ${action} for ${item.title} to Convex. Mutual match: ${result.isMutualMatch}`);

      if (result.isMutualMatch) {
        setSavedToShared(false);
        setSaveError(null);
        setMatchedProduct(item);
      }

      // 2. Offline-first: Buffer locally for redundancy/worker analysis
      await bufferSwipe(item._id, action, {
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
            discountPercentage(item.price, item.mrp) || undefined;

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
        onPress={() => {
          stackRef.current?.rewind();
          setSwipedCount((c) => Math.max(0, c - 1));
        }}
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
            <Text fontFamily="$body" fontSize="$4" textAlign="center" color="$textSecondary">
              You and your partner both liked this item!
            </Text>

            <Image
              source={{ uri: matchedProduct.images[0] }}
              style={{ width: 160, height: 200, borderRadius: 12 }}
              resizeMode="cover"
            />

            <H3 fontFamily="$heading" textAlign="center">{matchedProduct.title}</H3>
            <Text fontFamily="$body" fontSize="$5" fontWeight="bold" color="$primary">${matchedProduct.price}</Text>

            <YStack gap="$3" width="100%" marginTop="$4">
              <Button variant="primary" onPress={() => {
                setMatchedProduct(null);
                router.push({ pathname: '/(app)/product/[id]', params: { id: matchedProduct._id } });
              }}>
                View Product Details
              </Button>
              {sharedBoardId && !savedToShared && (
                <Button variant="secondary" onPress={async () => {
                  setSaveError(null);
                  try {
                    await addBoardItem(sharedBoardId, matchedProduct._id);
                    setSavedToShared(true);
                  } catch (e) {
                    setSaveError(e instanceof Error ? e.message : 'Could not save.');
                  }
                }}>
                  Save to Shared Board
                </Button>
              )}
              {savedToShared && (
                <Button variant="secondary" disabled>
                  Saved to Shared Board ✓
                </Button>
              )}
              {saveError && (
                <Text fontFamily="$body" color="$error" textAlign="center">{saveError}</Text>
              )}
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
