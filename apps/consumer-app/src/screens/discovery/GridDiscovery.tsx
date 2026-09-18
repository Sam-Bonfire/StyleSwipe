import { type Vector384 } from '@app/core';
import { useVectorFeed, useProcessSwipe, useCurrentUser, useAnalytics } from '@app/infrastructure';
import { Button } from '@app/ui-kit/components/Button';
import { ProductTileSkeleton } from '@app/ui-kit/components/LoadingSkeleton';
import { ProductTile } from '@app/ui-kit/components/ProductTile';
import { useRouter } from 'expo-router';
import React, { useState, useEffect, useCallback } from 'react';
import { FlatList } from 'react-native';
import { RefreshControl } from 'react-native';
import { YStack, H2, View, Spinner } from 'tamagui';

import { LocalDatabase } from '../../infrastructure/LocalDatabase';

interface GridProduct {
  _id: string;
  title: string;
  description?: string;
  price: number;
  mrp?: number;
  brand?: string;
  images: string[];
  embedding?: Vector384;
}

export function GridDiscovery() {
  const [products, setProducts] = useState<GridProduct[] | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);

  const getVectorFeed = useVectorFeed();
  const processSwipe = useProcessSwipe();
  const user = useCurrentUser();
  const router = useRouter();
  const { trackEvent } = useAnalytics();

  const [error, setError] = useState<string | null>(null);

  const fetchProducts = useCallback(async (isRefresh = false) => {
    if (!isRefresh) setLoadingMore(true);

    try {
      const data = await getVectorFeed({ limit: 20 });
      if (isRefresh) {
        setProducts(data as GridProduct[]);
      } else {
        setProducts(prev => prev ? [...prev, ...(data as GridProduct[])] : (data as GridProduct[]));
      }
      setError(null);
    } catch (e: unknown) {
      console.error('Feed Error:', e);
      if (!products) {
        setError(e instanceof Error ? e.message : 'Unknown error fetching feed');
        setProducts([]);
      }
    } finally {
      if (isRefresh) setRefreshing(false);
      setLoadingMore(false);
    }
  }, [getVectorFeed, products]);

  useEffect(() => {
    fetchProducts(true);
  }, []); // Initial load

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    fetchProducts(true);
  }, [fetchProducts]);

  const handleEndReached = useCallback(() => {
    if (!loadingMore && products && products.length > 0) {
      fetchProducts(false);
    }
  }, [fetchProducts, loadingMore, products]);

  const handleQuickLike = async (item: GridProduct) => {
    try {
      const db = await LocalDatabase.getInstance();
      await db.bufferEvent('swipe', {
        productId: item._id,
        action: 'like',
        description: item.description || item.title,
        title: item.title,
      });

      await processSwipe({
        userId: user?._id || '',
        productId: item._id,
        action: 'like',
        timestamp: Date.now(),
        userPreferenceVector: user?.styleProfile?.preferenceVector,
        productEmbedding: item.embedding,
      });
      console.log(`Synced like for ${item.title} to Convex.`);

      trackEvent('product_swiped', { action: 'like' }, { variant: 'grid_mode', productId: item._id });
    } catch (e) {
      console.warn('Like mutation failed (offline?), buffered locally.', e);
    }
  };

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
      <View style={{ flex: 1, padding: 16 }}>
         <FlatList
            data={[1,2,3,4,5,6]}
            numColumns={2}

            renderItem={() => (
              <View style={{ padding: 8, flex: 1 }}>
                <ProductTileSkeleton />
              </View>
            )}
         />
      </View>
    );
  }

  if (products.length === 0) {
    return (
      <YStack flex={1} justifyContent="center" alignItems="center" padding="$4" gap="$4">
        <H2 fontSize="$4" color="gray">
          No items match your preferences. Try resetting filters!
        </H2>
        <Button variant="primary" onPress={() => handleRefresh()}>Reset Filters</Button>
      </YStack>
    );
  }

  return (
    <View style={{ flex: 1 }}>
      <FlatList
        data={products}
        numColumns={2}

        keyExtractor={(item) => item._id}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
        onEndReached={handleEndReached}
        onEndReachedThreshold={0.5}
        ListFooterComponent={loadingMore ? <Spinner size="large" color="$primary" padding="$4" /> : null}
        renderItem={({ item }) => {
          const discount =
            item.mrp && item.price < item.mrp
              ? Math.round(((item.mrp - item.price) / item.mrp) * 100)
              : undefined;

          return (
            <View style={{ padding: 8, flex: 1 }}>
              <ProductTile
                imageUrl={item.images[0] || ''}
                title={item.title}
                price={item.price}
                originalPrice={item.mrp}
                discountPercentage={discount}
                brand={item.brand || 'Unknown'}
                size="wide"
                onPress={() => router.push({ pathname: '/(app)/product/[id]', params: { id: item._id } })}
                onWishlistToggle={() => handleQuickLike(item)}
              />
            </View>
          );
        }}
      />
    </View>
  );
}
