import {
  useCurrentUser,
  useWishlist,
  useToggleWishlist,
  useUserBoards,
  type UserBoardSummary,
} from '@app/infrastructure';
import { Button, TopBarIconButton } from '@app/ui-kit';
import { ChevronLeft, Heart, Trash2, ExternalLink, Plus, LayoutGrid, ArrowLeftRight } from '@tamagui/lucide-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import { SafeAreaView, Alert } from 'react-native';
import { YStack, ScrollView, Text, XStack, Image, Separator } from 'tamagui';

import { BoardListCard } from '../../components/boards/BoardCard';
import { CreateBoardModal } from '../../components/boards/CreateBoardModal';
import { MoveItemSheet } from '../../components/boards/MoveItemSheet';

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
  const userBoards = useUserBoards(userId, false) as UserBoardSummary[] | undefined;
  const toggleWishlist = useToggleWishlist();
  const [createVisible, setCreateVisible] = React.useState<boolean>(false);
  const [moveTarget, setMoveTarget] = React.useState<{ productId: string; boardId: string } | null>(null);

  const handleRemove = async (productId: string) => {
    if (!userId) return;
    try {
      await toggleWishlist(userId, productId);
    } catch (e) {
      console.error('Failed to remove from wishlist:', e);
      Alert.alert('Error', 'Failed to remove item from wishlist.');
    }
  };

  const wishlistBoardId = (wishlist as { _id?: string } | undefined)?._id as string | undefined;

  if (user === null) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: 'white' }}>
        <YStack flex={1} alignItems="center" justifyContent="center" padding="$4" gap="$3">
          <Heart size={48} color="$textSecondary" opacity={0.5} />
          <Text fontSize="$5" fontWeight="600">Sign in to view wishlist</Text>
          <Text color="$textSecondary" textAlign="center">Save your favorite styles by signing in.</Text>
          <Button marginTop="$4" backgroundColor="$primary" onPress={() => router.push('/(auth)')}>
            <Text color="white" fontWeight="600">Sign In</Text>
          </Button>
        </YStack>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: 'white' }}>
      <XStack alignItems="center" gap="$2" padding="$2" borderBottomWidth={1} borderColor="$borderColor">
        <TopBarIconButton onPress={() => router.back()} backgroundColor="$background" shadowColor="$shadowColor" shadowRadius={4} shadowOpacity={0.1}>
          <ChevronLeft size={24} color="$textPrimary" />
        </TopBarIconButton>
        <Text fontSize="$5" fontWeight="bold">My Wishlist</Text>
        <XStack flex={1} justifyContent="flex-end">
          <Button size="small" variant="outlined" icon={Plus} onPress={() => setCreateVisible(true)}>New Board</Button>
        </XStack>
      </XStack>

      <ScrollView showsVerticalScrollIndicator={true}>
        <YStack padding="$4" gap="$6" paddingBottom="$10">
          {/* User Collections */}
          <YStack gap="$3">
            <XStack justifyContent="space-between" alignItems="center">
              <XStack gap="$2" alignItems="center">
                <LayoutGrid size={18} />
                <Text fontSize="$4" fontWeight="700">Your Collections</Text>
              </XStack>
              {userBoards && userBoards.length > 0 && (
                <Text color="$primary" fontWeight="600" fontSize="$2" onPress={() => setCreateVisible(true)}>+ Create</Text>
              )}
            </XStack>

            {userId && userBoards === undefined ? (
              <Text color="$textSecondary">Loading collections...</Text>
            ) : !userBoards || userBoards.length === 0 ? (
              <YStack backgroundColor="$surface" borderRadius="$3" borderWidth={1} borderColor="$borderColor" padding="$4" gap="$2">
                <Text fontWeight="600">No collections yet</Text>
                <Text fontSize="$2" color="$textSecondary">Create a board like "Summer Fits" or "Gift for Mom" to organize items you love.</Text>
                <Button size="small" variant="primary" icon={Plus} onPress={() => setCreateVisible(true)} marginTop="$2">Create Collection</Button>
              </YStack>
            ) : (
              <YStack gap="$2">
                {userBoards.map((board) => (
                  <BoardListCard key={board._id as string} board={board} />
                ))}
              </YStack>
            )}
            <Button
              variant="outlined"
              size="small"
              onPress={() => router.push('/(app)/wishlist/create' as never)}
              marginTop="$1"
            >
              Create board via wishlist/create route
            </Button>
          </YStack>

          <Separator borderColor="$borderColor" />

          {/* Wishlist items */}
          <YStack gap="$3">
            <Text fontSize="$4" fontWeight="700">Wishlist Items ({wishlist?.items?.length ?? 0})</Text>
            {userId && wishlist === undefined ? (
              <YStack flex={1} alignItems="center" justifyContent="center"><Text color="$textSecondary">Loading wishlist...</Text></YStack>
            ) : !wishlist || !wishlist.items || wishlist.items.length === 0 ? (
              <YStack alignItems="center" justifyContent="center" padding="$4" gap="$3">
                <Heart size={48} color="$textSecondary" opacity={0.5} />
                <Text fontSize="$5" fontWeight="600">Your wishlist is empty</Text>
                <Text color="$textSecondary" textAlign="center" paddingHorizontal="$4">Items you favorite while swiping or browsing will appear here.</Text>
                <Button marginTop="$4" backgroundColor="$primary" onPress={() => router.push('/(app)/(tabs)/discover')}>
                  <Text color="white" fontWeight="600">Start Swiping</Text>
                </Button>
              </YStack>
            ) : (
              <YStack gap="$4">
                {wishlist.items.map((item: PopulatedWishlistItem) => {
                  const product = item.product;
                  if (!product) return null;
                  const imageUrl = product.images?.[0] || 'https://placehold.co/80x100';
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
                        <Image source={{ uri: imageUrl }} width={70} height={90} borderRadius="$2" resizeMode="cover" />
                        <YStack flex={1} gap="$1">
                          <Text fontSize="$2" fontWeight="600" textTransform="uppercase" color="$textPrimary">{product.brand}</Text>
                          <Text fontSize="$3" numberOfLines={2} color="$textSecondary">{product.title}</Text>
                          <Text fontSize="$3" fontWeight="bold" color="$primary">
                            {new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 0 }).format(product.price)}
                          </Text>
                        </YStack>
                      </XStack>
                      <Separator borderColor="$borderColor" />
                      <XStack gap="$2" flexWrap="wrap">
                        <Button borderColor="$error" backgroundColor="transparent" borderWidth={1} size="small" borderRadius="$2" onPress={() => handleRemove(item.productId)} icon={Trash2} flex={1}>
                          <Text color="$error" fontWeight="600" fontSize="$2">Remove</Text>
                        </Button>
                        <Button backgroundColor="$primary" size="small" borderRadius="$2" onPress={() => router.push({ pathname: '/(app)/product/[id]', params: { id: item.productId } })} icon={ExternalLink} flex={1}>
                          <Text color="white" fontWeight="600" fontSize="$2">View</Text>
                        </Button>
                      </XStack>
                      {wishlistBoardId && userBoards && userBoards.length > 0 && (
                        <Button size="small" variant="outlined" icon={ArrowLeftRight} onPress={() => setMoveTarget({ productId: item.productId, boardId: wishlistBoardId })}>Move to Collection</Button>
                      )}
                    </YStack>
                  );
                })}
              </YStack>
            )}
          </YStack>
        </YStack>
      </ScrollView>

      <CreateBoardModal visible={createVisible} onClose={() => setCreateVisible(false)} userId={userId} onCreated={(id) => router.push({ pathname: '/(app)/boards/[id]', params: { id } })} />

      {moveTarget && wishlistBoardId && (
        <MoveItemSheet
          visible={!!moveTarget}
          onClose={() => setMoveTarget(null)}
          userId={userId}
          sourceBoardId={moveTarget.boardId}
          productId={moveTarget.productId}
          onMoved={() => setMoveTarget(null)}
        />
      )}
    </SafeAreaView>
  );
}

export default WishlistScreen;
