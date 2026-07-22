import { useCurrentUser, useSystemBoard } from '@app/infrastructure';
import { Button, TopBarIconButton } from '@app/ui-kit';
import { ChevronLeft, ExternalLink, ShoppingBag } from '@tamagui/lucide-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import { Linking, SafeAreaView } from 'react-native';
import { YStack, ScrollView, Text, XStack, Image, Separator } from 'tamagui';

interface PopulatedBoardItem {
  productId: string;
  addedAt: number;
  product: {
    brand: string;
    title: string;
    price: number;
    images?: string[];
    meta?: Record<string, string | undefined>;
  };
}

export function OrdersScreen() {
  const router = useRouter();
  const user = useCurrentUser();
  const userId = user?._id ?? undefined;

  const board = useSystemBoard(userId);

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const handleBuyAgain = async (url?: string) => {
    if (url) {
      try {
        await Linking.openURL(url);
      } catch (err) {
        console.error('Failed to open marketplace URL:', err);
      }
    }
  };

  const renderContent = () => {
    if (userId && board === undefined) {
      return (
        <YStack flex={1} alignItems="center" justifyContent="center">
          <Text>Loading order history...</Text>
        </YStack>
      );
    }

    if (!board || !board.items || board.items.length === 0) {
      return (
        <YStack flex={1} alignItems="center" justifyContent="center" padding="$4" gap="$3">
          <ShoppingBag size={48} color="$textSecondary" opacity={0.5} />
          <Text fontSize="$5" fontWeight="600">
            No orders found
          </Text>
          <Text color="$textSecondary" textAlign="center" paddingHorizontal="$4">
            Items you purchase directly from Myntra or Ajio will appear here.
          </Text>
          <Button
            marginTop="$4"
            backgroundColor="$primary"
            onPress={() => router.push('/(app)/(tabs)/discover')}
          >
            <Text color="white" fontWeight="600">
              Discover Products
            </Text>
          </Button>
        </YStack>
      );
    }

    return (
      <ScrollView>
        <YStack padding="$4" gap="$4" paddingBottom="$10">
          <Text fontSize="$4" color="$textSecondary" marginBottom="$2">
            Tracked orders you have initiated checkout on external marketplaces:
          </Text>

          <YStack gap="$4">
            {board.items.map((item: PopulatedBoardItem) => {
              const product = item.product;
              if (!product) return null;

              const imageUrl = product.images?.[0] || 'https://placehold.co/80x100';
              const title = product.title;
              const brand = product.brand;
              const price = product.price;
              const originalUrl = product.meta?.originalUrl || product.meta?.url || '';

              const platform = originalUrl.toLowerCase().includes('myntra')
                ? 'Myntra'
                : originalUrl.toLowerCase().includes('ajio')
                ? 'Ajio'
                : 'Original Store';

              return (
                <YStack
                  key={`${item.productId}-${item.addedAt}`}
                  backgroundColor="$surface"
                  padding="$3"
                  borderRadius="$3"
                  borderWidth={1}
                  borderColor="$borderColor"
                  gap="$3"
                >
                  <XStack gap="$3" alignItems="center">
                    <Image
                      source={{ uri: imageUrl }}
                      width={70}
                      height={90}
                      borderRadius="$2"
                      resizeMode="cover"
                    />

                    <YStack flex={1} gap="$1">
                      <Text fontSize="$2" fontWeight="600" textTransform="uppercase" color="$textPrimary">
                        {brand}
                      </Text>
                      <Text fontSize="$3" numberOfLines={2} color="$textSecondary">
                        {title}
                      </Text>
                      <Text fontSize="$3" fontWeight="bold" color="$textPrimary">
                        {new Intl.NumberFormat('en-IN', {
                          style: 'currency',
                          currency: 'INR',
                          minimumFractionDigits: 0,
                          maximumFractionDigits: 0,
                        }).format(price)}
                      </Text>
                    </YStack>
                  </XStack>

                  <Separator borderColor="$borderColor" />

                  <XStack
                    justifyContent="space-between"
                    alignItems="center"
                    $xs={{ flexDirection: 'column', gap: '$3', alignItems: 'stretch' }}
                  >
                    <YStack $xs={{ alignItems: 'flex-start' }}>
                      <Text fontSize="$1" color="$textTertiary">
                        CHECKOUT INITIATED
                      </Text>
                      <Text fontSize="$2" fontWeight="600" color="$textSecondary">
                        {formatDate(item.addedAt)}
                      </Text>
                    </YStack>

                    <Button
                      backgroundColor="$primary"
                      size="small"
                      borderRadius="$2"
                      onPress={() => handleBuyAgain(originalUrl)}
                      icon={ExternalLink}
                      $xs={{ width: '100%' }}
                    >
                      <Text color="white" fontWeight="600" fontSize="$2">
                        Buy Again on {platform}
                      </Text>
                    </Button>
                  </XStack>
                </YStack>
              );
            })}
          </YStack>
        </YStack>
      </ScrollView>
    );
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: 'white' }}>
      <XStack
        alignItems="center"
        gap="$2"
        padding="$2"
        borderBottomWidth={1}
        borderColor="$borderColor"
      >
        <TopBarIconButton
          onPress={() => router.back()}
          backgroundColor="$background"
          shadowColor="$shadowColor"
          shadowRadius={4}
          shadowOpacity={0.1}
        >
          <ChevronLeft size={24} color="$textPrimary" />
        </TopBarIconButton>
        <Text fontSize="$5" fontWeight="bold">
          Your Orders
        </Text>
      </XStack>

      {renderContent()}
    </SafeAreaView>
  );
}

export default OrdersScreen;
