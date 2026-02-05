import { api } from '@app/convex';
import { useNavigation } from '@react-navigation/native';
import { useQuery, useMutation, useAction } from 'convex/react';
import React from 'react';
import { ScrollView } from 'react-native';
import { YStack } from 'tamagui';

import { ProductCarousel } from '../../components/ProductCarousel';
import { SectionHeader } from '../../components/SectionHeader';

export function HomeScreen() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const navigation = useNavigation<any>();
  const [recommended, setRecommended] = React.useState<Record<string, unknown>[] | undefined>(
    undefined,
  );

  // Data Fetching
  const latestProducts = useQuery(api.products.getLatest, { limit: 10 });
  const recentlyViewed = useQuery(api.discovery.getRecentlyViewed, { limit: 10 });

  // Recommendations (Action)
  const getVectorFeed = useAction(api.recommendations.getVectorFeed);

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

  const recordView = useMutation(api.discovery.recordProductView);

  const handleProductPress = (productId: string) => {
    // Record view event
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    recordView({ productId: productId as any });
    // Navigate to details
    navigation.navigate('ProductDetail', { productId });
  };

  return (
    <YStack flex={1} backgroundColor="white">
      <ScrollView
        showsVerticalScrollIndicator={true}
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: 20 }}
      >
        <YStack paddingVertical="$2" space="$6">
          {/* Latest Additions */}
          <YStack>
            <SectionHeader title="Latest Additions" onSeeAll={() => { }} />
            <ProductCarousel
              data={latestProducts}
              isLoading={latestProducts === undefined}
              onProductPress={handleProductPress}
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
            />
          </YStack>
        </YStack>
      </ScrollView>
    </YStack>
  );
}
