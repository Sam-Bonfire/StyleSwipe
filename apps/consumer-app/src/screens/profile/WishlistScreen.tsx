import { useCurrentUser, useWishlist, useToggleWishlist } from '@app/infrastructure';
import { Button, TopBarIconButton } from '@app/ui-kit';
import { ChevronLeft, Heart, Trash2, ExternalLink } from '@tamagui/lucide-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import { SafeAreaView, Alert } from 'react-native';
import { YStack, ScrollView, Text, XStack, Image, Separator } from 'tamagui';

interface PopulatedWishlistItem {
  productId: string;
  addedAt: number;
  product: {
    brand: string;
    title: string;
    price: number;
    mrp?: number;
    images?: string[];
    meta?: Record<string, string | undefined>;
  };
}

export function WishlistScreen() {
  const router = useRouter();
  const user = useCurrentUser();
  const userId = user?._id ?? undefined;

  const wishlist = useWishlist(userId);
  const toggleWishlist = useToggleWishlist();

  const handleRemove = async (productId: string) => {
    if (!userId) return;
    try {
      await toggleWishlist(userId, productId);
    } catch (e) {
      console.error('Failed to remove from wishlist:', e);
      Alert.alert('Error', 'Failed to remove item from wishlist.');
    }
  };

  const renderContent = () => {
    if (userId && wishlist === undefined) {
      return (
        <YStack flex={1} alignItems="center" justifyContent="center">
          <Text fontSize="$4" color="$textSecondary">Loading wishlist...</Text>
        </YStack>
      );
    }

    if (!wishlist || !wishlist.items || wishlist.items.length === 0) {
      return (
        <YStack flex={1} alignItems="center" justifyContent="center" padding="$4" gap="$3">
          <Heart size={48} color="$textSecondary" opacity={0.5} />
          <Text fontSize="$5" fontWeight="600">
            Your wishlist is empty
          </Text>
          <Text color="$textSecondary" textAlign="center" paddingHorizontal="$4">
            Items you favorite while swiping or browsing will appear here.
          </Text>
          <Button
            marginTop="$4"
            backgroundColor="$primary"
            onPress={() => router.push('/(app)/(tabs)/discover')}
          >
            <Text color="white" fontWeight="600">
              Start Swiping
            </Text>
          </Button>
        </YStack>
      );
    }

    return (
      <ScrollView showsVerticalScrollIndicator={true}>
        <YStack padding="$4" gap="$4" paddingBottom="$10">
          <Text fontSize="$4" color="$textSecondary" marginBottom="$2">
            Your saved items of interest:
          </Text>

          <YStack gap="$4">
            {wishlist.items.map((item: PopulatedWishlistItem) => {
              const product = item.product;
              if (!product) return null;

              const imageUrl = product.images?.[0] || 'https://placehold.co/80x100';
              const title = product.title;
              const brand = product.brand;
              const price = product.price;

              return (
                <YStack
                  key={`${item.productId}-${item.addedAt}`}
                  backgroundColor="$surface"
                  padding="$3"
                  borderRadius="$3"
                  borderWidth={1}
                  borderColor="$borderColor"
                  gap="$3"
                  elevation={2}
                  shadowColor="$shadowColor"
                  shadowRadius={8}
                  shadowOpacity={0.05}
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
                      <Text fontSize="$3" fontWeight="bold" color="$primary">
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
                    gap="$3"
                    $xs={{ flexDirection: 'column', alignItems: 'stretch' }}
                  >
                    <Button
                      borderColor="$error"
                      backgroundColor="transparent"
                      borderWidth={1}
                      size="small"
                      borderRadius="$2"
                      onPress={() => handleRemove(item.productId)}
                      icon={Trash2}
                      flex={1}
                    >
                      <Text color="$error" fontWeight="600" fontSize="$2">
                        Remove
                      </Text>
                    </Button>

                    <Button
                      backgroundColor="$primary"
                      size="small"
                      borderRadius="$2"
                      onPress={() => router.push({ pathname: '/(app)/product/[id]', params: { id: item.productId } })}
                      icon={ExternalLink}
                      flex={1}
                    >
                      <Text color="white" fontWeight="600" fontSize="$2">
                        View Product
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
        space="$2"
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
          My Wishlist
        </Text>
      </XStack>

      {renderContent()}
    </SafeAreaView>
  );
}

export default WishlistScreen;
