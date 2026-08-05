import {
  useLatestProducts,
  useRecentlyViewed,
  useVectorFeed,
  useRecordProductView,
  useCurrentUser,
  useWishlist,
  useToggleWishlist,
  useAnalytics,
} from '@app/infrastructure';
import { useRouter } from 'expo-router';
import React from 'react';
import { ScrollView } from 'react-native';
import { YStack } from 'tamagui';

import { ProductCarousel } from '../../components/ProductCarousel';
import { SectionHeader } from '../../components/SectionHeader';

export function HomeScreen() {
  const router = useRouter();
  const [recommended, setRecommended] = React.useState<Record<string, unknown>[] | undefined>(
    undefined,
  );

  const user = useCurrentUser();
  const userId = user?._id ?? undefined;

  // Data Fetching
  const latestProducts = useLatestProducts(10);
  const recentlyViewed = useRecentlyViewed(10);
  const wishlist = useWishlist(userId);
  const toggleWishlist = useToggleWishlist();

  // Recommendations (Action)
  const getVectorFeed = useVectorFeed();

  const wishlistedIds = React.useMemo(() => {
    if (!wishlist || !wishlist.items) return new Set<string>();
    return new Set<string>(wishlist.items.map((i) => i.productId));
  }, [wishlist]);

  const handleWishlistToggle = React.useCallback(
    async (productId: string) => {
      if (!userId) return;
      try {
        await toggleWishlist(userId, productId);
      } catch (e) {
        console.error('Failed to toggle wishlist:', e);
      }
    },
    [userId, toggleWishlist]
  );

  React.useEffect(() => {
    async function fetchRecommendations() {
      try {
        const results = await getVectorFeed({ limit: 10 });
        setRecommended(results);
      } catch (e) {
        console.error('Failed to fetch recommendations:', e);
        setRecommended([]); // Fallback to empty
      }
    }
    fetchRecommendations();
  }, [getVectorFeed]);

  const recordView = useRecordProductView();
  const { trackEvent } = useAnalytics();

  const handleProductPress = (productId: string) => {
    // Record view event
    recordView({ productId });
    trackEvent('product_viewed', undefined, { variant: 'macro_v1', productId });
    
    // Navigate to details
    router.push({ pathname: '/(app)/product/[id]', params: { id: productId } });
  };

  return (
    <YStack flex={1} backgroundColor="white">
      <ScrollView
        showsVerticalScrollIndicator={true}
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: 20 }}
      >
        <YStack paddingVertical="$2" gap="$6">
          {/* Latest Additions */}
          <YStack>
            <SectionHeader title="Latest Additions" onSeeAll={() => { }} />
            <ProductCarousel
              data={latestProducts}
              isLoading={latestProducts === undefined}
              onProductPress={handleProductPress}
              wishlistedIds={wishlistedIds}
              onWishlistToggle={handleWishlistToggle}
            />
          </YStack>

          {/* Recently Viewed */}
          {/* Only show if there are items or while loading (to avoid popping) */}
          {(recentlyViewed === undefined || (recentlyViewed && recentlyViewed.length > 0)) && (
            <YStack>
              <SectionHeader title="Recently Viewed" />
              <ProductCarousel
                data={recentlyViewed}
                isLoading={recentlyViewed === undefined}
                onProductPress={handleProductPress}
                emptyMessage="Items you view will appear here"
                wishlistedIds={wishlistedIds}
                onWishlistToggle={handleWishlistToggle}
              />
            </YStack>
          )}

          {/* You Might Like */}
          <YStack>
            <SectionHeader title="You Might Like" />
            <ProductCarousel
              data={recommended}
              isLoading={recommended === undefined}
              onProductPress={handleProductPress}
              wishlistedIds={wishlistedIds}
              onWishlistToggle={handleWishlistToggle}
            />
          </YStack>
        </YStack>
      </ScrollView>
    </YStack>
  );
}
