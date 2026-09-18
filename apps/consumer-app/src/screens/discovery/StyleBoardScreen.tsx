import { AffiliateLinkSchema } from '@app/core';
import {
  useCurrentUser,
  useBoard,
  useActivePartnerSync,
  useCreatePartnerSync,
  useRemoveBoardItem
} from '@app/infrastructure';
import { AvatarGroup, ProductTile, TopBarIconButton } from '@app/ui-kit';
import { ChevronLeft, Share as ShareIcon, X } from '@tamagui/lucide-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import { View, Alert, Linking, ScrollView, Platform, SafeAreaView, Share } from 'react-native';
import { Button, Spinner, Text, XStack, YStack } from 'tamagui';

export function StyleBoardScreen({ boardId }: { boardId: string }) {
  const router = useRouter();
  const user = useCurrentUser();
  const board = useBoard(boardId, user?._id);
  const activeSyncs = useActivePartnerSync(user?._id) as Record<string, unknown>[];
  const createSync = useCreatePartnerSync();
  const removeBoardItem = useRemoveBoardItem();

  const handleShare = async () => {
    if (!user) {
      Alert.alert('Login Required', 'Please log in to share this board.');
      return;
    }

    try {
      // Logic from PartnerSyncSettingsScreen
      const durationMs = 24 * 60 * 60 * 1000; // 24h default for sharing from here
      const { inviteCode } = await createSync(user._id, durationMs);

      let url = '';
      if (Platform.OS === 'web' && typeof window !== 'undefined') {
        url = `${window.location.origin}/sync/${inviteCode}`;
      } else {
        const baseUrl = process.env.EXPO_PUBLIC_APP_URL || 'https://styleswipe.com';
        url = `${baseUrl.replace(/\/$/, '')}/sync/${inviteCode}`;
      }

      const message = `Let's sync our style on StyleSwipe! Click here to collaborate on my board: ${url}`;


      await Share.share({
        message,
        url: Platform.OS === 'ios' ? url : undefined,
      });

    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'Failed to generate share link.');
    }
  };

  const handleShop = (productId: string, rawUrl: string, merchantName: string) => {
    try {
      const affiliateData = AffiliateLinkSchema.parse({
        productId,
        merchantName: merchantName || 'Unknown',
        rawProductUrl: rawUrl.startsWith('http') ? rawUrl : `https://${rawUrl}`,
        affiliateNetwork: 'DIRECT',
        trackingParams: {},
        resolvedUrl: rawUrl.startsWith('http') ? rawUrl : `https://${rawUrl}`,
      });
      Linking.openURL(affiliateData.resolvedUrl);
    } catch (e) {
      console.error('Failed to parse affiliate link:', e);
      Linking.openURL(rawUrl);
    }
  };

  const handleRemove = async (productId: string) => {
    try {
      await removeBoardItem(boardId, productId);
    } catch (e) {
      console.error('Failed to remove item:', e);
    }
  };

  if (board === undefined) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: 'white' }}>
        <YStack flex={1} alignItems="center" justifyContent="center">
          <Spinner size="large" color="$primary" />
        </YStack>
      </SafeAreaView>
    );
  }

  if (board === null) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: 'white' }}>
        <YStack flex={1} alignItems="center" justifyContent="center">
          <Text>Board not found.</Text>
          <Button onPress={() => router.back()}>Go Back</Button>
        </YStack>
      </SafeAreaView>
    );
  }

  // Construct avatars list
  const avatars = [
    { id: user?._id || 'me', imageUrl: user?.image, name: user?.name || 'Me' },
    ...(activeSyncs || []).map((sync) => ({
      id: sync._id,
      imageUrl: sync.partnerImage,
      name: sync.partnerName,
    })),
  ];

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: 'white' }}>
      <ScrollView>
        {/* Header Section */}
        <YStack padding="$4" borderBottomWidth={1} borderColor="$borderColor">
          <XStack alignItems="center" justifyContent="space-between" marginBottom="$4">
            <TopBarIconButton
              children={<ChevronLeft size={24} color="black" />}
              onPress={() => router.back()}
            />
            <Button
              size="$3"
              variant="outlined"
              icon={<ShareIcon size={16} />}
              onPress={handleShare}
            >
              Invite Partner / Friend
            </Button>
          </XStack>

          <XStack alignItems="center" justifyContent="space-between">
            <YStack>
              <Text fontSize="$6" fontWeight="bold" fontFamily="$heading">{board.name}</Text>
              <Text fontSize="$3" color="$textSecondary" marginTop="$1">
                {board.items?.length || 0} items
              </Text>
            </YStack>
            <AvatarGroup avatars={avatars} size="medium" max={3} />
          </XStack>
        </YStack>

        {/* Grid Section */}
        <XStack flexWrap="wrap" padding="$2">
          {board.items?.map((item: { productId: string; matchStatus: string; product: Record<string, unknown> }) => {
            const product = item.product;
            if (!product) return null;

            return (
              <YStack key={item.productId} width="50%" padding="$2">
                <View style={{ position: 'relative' }}>
                  <ProductTile
                    imageUrl={(product.images as string[])?.[0] ?? 'https://placehold.co/200x250'}
                    brand={(product.brand as string) ?? 'Brand'}
                    title={(product.title as string) ?? 'Product'}
                    price={(product.price as number) ?? 0}
                    onPress={() => router.push(`/product/${item.productId}` as never)}
                  />

                  {/* Match Indicator Badge */}
                  <YStack
                    position="absolute"
                    top={8}
                    left={8}
                    backgroundColor={item.matchStatus === 'Mutual Match' ? '$primary' : '$surface'}
                    paddingHorizontal="$2"
                    paddingVertical="$1"
                    borderRadius="$full"
                    borderWidth={1}
                    borderColor={item.matchStatus === 'Mutual Match' ? '$primary' : '$borderColor'}
                    zIndex={10}
                  >
                    <Text
                      fontSize="$1"
                      fontWeight="bold"
                      color={item.matchStatus === 'Mutual Match' ? 'white' : '$textPrimary'}
                    >
                      {item.matchStatus}
                    </Text>
                  </YStack>

                  {/* Quick Remove Button */}
                  <YStack
                    position="absolute"
                    top={8}
                    right={8}
                    backgroundColor="rgba(255,255,255,0.9)"
                    borderRadius="$full"
                    padding="$1"
                    cursor="pointer"
                    onPress={() => handleRemove(item.productId)}
                    zIndex={10}
                  >
                    <X size={16} color="black" />
                  </YStack>
                </View>

                {/* Shop Action */}
                <Button
                  size="$2"
                  marginTop="$2"
                  onPress={() => handleShop(item.productId, (product.url as string) || 'https://styleswipe.com', (product.merchantName as string) || (product.platform as string))}
                >
                  Shop on Merchant
                </Button>
              </YStack>
            );
          })}
        </XStack>

        {board.items?.length === 0 && (
          <YStack padding="$6" alignItems="center">
            <Text color="$textSecondary" textAlign="center">
              This board is empty. Start swiping to add items!
            </Text>
          </YStack>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
