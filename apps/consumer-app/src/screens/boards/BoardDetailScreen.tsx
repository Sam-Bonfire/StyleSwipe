import {
  useCurrentUser,
  useBoard,
  useUserBoards,
  useDeleteBoard,
  useRemoveBoardItem,
  type UserBoardSummary,
} from '@app/infrastructure';
import { Button } from '@app/ui-kit';
import { ProductTile } from '@app/ui-kit/components/ProductTile';
import { ChevronLeft, Share as ShareIcon, Trash2, Pencil, ArrowLeftRight } from '@tamagui/lucide-icons';
import { useRouter } from 'expo-router';
import * as Sharing from 'expo-sharing';
import React from 'react';
import { Alert, Platform, SafeAreaView, ScrollView } from 'react-native';
import { YStack, XStack, Text, Spinner } from 'tamagui';

import { EditBoardModal } from '../../components/boards/EditBoardModal';
import { MoveItemSheet } from '../../components/boards/MoveItemSheet';
import { BrandedQRCodeModal } from '../../components/BrandedQRCodeModal';

interface BoardDetailScreenProps {
  boardId: string;
}

export function BoardDetailScreen({ boardId }: BoardDetailScreenProps) {
  const router = useRouter();
  const user = useCurrentUser();
  const userId = user?._id ?? undefined;
  const board = useBoard(boardId, userId) as
    | { _id: string; name: string; slug: string; isSystem?: boolean; userId: string; items: Array<{ productId: string; addedAt: number; product: Record<string, unknown> }> }
    | null
    | undefined;
  const boards = useUserBoards(userId, true) as UserBoardSummary[] | undefined;
  const removeItem = useRemoveBoardItem();
  const deleteBoard = useDeleteBoard();

  const [editVisible, setEditVisible] = React.useState<boolean>(false);
  const [shareVisible, setShareVisible] = React.useState<boolean>(false);
  const [moveTarget, setMoveTarget] = React.useState<{ productId: string } | null>(null);

  const boardUrl = React.useMemo(() => {
    const baseUrl = process.env.EXPO_PUBLIC_APP_URL || 'https://styleswipe.com';
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      return `${window.location.origin}/boards/${boardId}`;
    }
    return `${baseUrl.replace(/\/$/, '')}/boards/${boardId}`;
  }, [boardId]);

  const handleDelete = () => {
    if (!userId) return;
    Alert.alert('Delete Collection', `Delete "${board && 'name' in board ? board.name : ''}"? This will remove all items.`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteBoard(boardId, userId);
            router.back();
          } catch (e) {
            Alert.alert('Error', e instanceof Error ? e.message : 'Failed to delete');
          }
        },
      },
    ]);
  };

  const handleRemove = async (productId: string) => {
    try {
      await removeItem(boardId, productId);
    } catch (e) {
      Alert.alert('Error', e instanceof Error ? e.message : 'Failed to remove');
    }
  };

  const handleShare = async () => {
    setShareVisible(true);
  };

  const handleNativeShare = async () => {
    try {
      if (await Sharing.isAvailableAsync()) {
        // BrandedQRCodeModal handles sharing QR; here we just do link share
      }
      const message = `Check my StyleSwipe collection: ${boardUrl}`;
      if (Platform.OS === 'web' && typeof navigator !== 'undefined' && 'share' in navigator) {
        await (navigator as unknown as { share: (data: { title: string; text: string; url: string }) => Promise<void> }).share({ title: board?.name ?? 'StyleSwipe Board', text: message, url: boardUrl });
      } else {
        const { Share } = await import('react-native');
        await Share.share({ message, url: boardUrl });
      }
    } catch (e) {
      console.error(e);
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
        <YStack flex={1} alignItems="center" justifyContent="center" gap="$3" padding="$4">
          <Text fontSize="$5" fontWeight="700">Collection not found</Text>
          <Text color="$textSecondary" textAlign="center">This board may have been deleted or you don't have access.</Text>
          <Button variant="primary" onPress={() => router.back()}>Go Back</Button>
        </YStack>
      </SafeAreaView>
    );
  }

  const isOwner = userId === board.userId;
  const canEdit = isOwner && !board.isSystem;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: 'white' }}>
      <YStack flex={1}>
        <XStack alignItems="center" justifyContent="space-between" padding="$3" borderBottomWidth={1} borderColor="$borderColor">
          <XStack alignItems="center" gap="$2">
            <YStack
              width={36}
              height={36}
              borderRadius={18}
              backgroundColor="$backgroundHover"
              alignItems="center"
              justifyContent="center"
              onPress={() => router.back()}
              pressStyle={{ opacity: 0.7 }}
            >
              <ChevronLeft size={20} />
            </YStack>
            <YStack>
              <Text fontSize="$5" fontWeight="700" numberOfLines={1} maxWidth={180}>{board.name}</Text>
              <Text fontSize="$2" color="$textSecondary">{board.items?.length ?? 0} items • {board.slug}</Text>
            </YStack>
          </XStack>
          <XStack gap="$2">
            <YStack
              width={36}
              height={36}
              borderRadius={18}
              backgroundColor="$backgroundHover"
              alignItems="center"
              justifyContent="center"
              onPress={handleShare}
            >
              <ShareIcon size={18} />
            </YStack>
            {canEdit && (
              <>
                <YStack width={36} height={36} borderRadius={18} backgroundColor="$backgroundHover" alignItems="center" justifyContent="center" onPress={() => setEditVisible(true)}>
                  <Pencil size={16} />
                </YStack>
                <YStack width={36} height={36} borderRadius={18} backgroundColor="$error" alignItems="center" justifyContent="center" onPress={handleDelete}>
                  <Trash2 size={16} color="white" />
                </YStack>
              </>
            )}
          </XStack>
        </XStack>

        <ScrollView contentContainerStyle={{ padding: 12, paddingBottom: 40 }}>
          {board.items.length === 0 ? (
            <YStack alignItems="center" padding="$6" gap="$3">
              <Text fontSize="$5" fontWeight="600">No items yet</Text>
              <Text color="$textSecondary" textAlign="center">Products you save to this collection will appear here in a 2-column grid.</Text>
              <Button variant="primary" onPress={() => router.push('/(app)/(tabs)/discover' as never)}>Discover Products</Button>
            </YStack>
          ) : (
            <XStack flexWrap="wrap" gap="$2">
              {board.items.map((item) => {
                const product = item.product as { brand?: string; title?: string; price?: number; mrp?: number; images?: string[]; _id?: string };
                const imageUrl = product.images?.[0] ?? 'https://placehold.co/300x400';
                const discount = product.mrp && product.price && product.price < product.mrp ? Math.round(((product.mrp - product.price) / product.mrp) * 100) : undefined;
                return (
                  <YStack key={item.productId} width="48%" gap="$2" marginBottom="$3">
                    <ProductTile
                      imageUrl={imageUrl}
                      brand={product.brand ?? 'Brand'}
                      title={product.title ?? 'Product'}
                      price={product.price ?? 0}
                      originalPrice={product.mrp}
                      discountPercentage={discount}
                      onPress={() => router.push({ pathname: '/(app)/product/[id]', params: { id: item.productId } })}
                    />
                    <XStack gap="$2">
                      <Button size="small" variant="outlined" flex={1} icon={Trash2} onPress={() => handleRemove(item.productId)}>Remove</Button>
                      {boards && boards.length > 1 && (
                        <Button size="small" variant="outlined" flex={1} icon={ArrowLeftRight} onPress={() => setMoveTarget({ productId: item.productId })}>Move</Button>
                      )}
                    </XStack>
                  </YStack>
                );
              })}
            </XStack>
          )}

          <YStack marginTop="$4" gap="$2" alignItems="center">
            <Button variant="outlined" icon={ShareIcon} onPress={handleNativeShare}>Share Link</Button>
            <Text fontSize="$2" color="$textTertiary" textAlign="center" paddingHorizontal="$4">Share this collection via QR or link. Recipients can view your curated items.</Text>
          </YStack>
        </ScrollView>
      </YStack>

      <BrandedQRCodeModal visible={shareVisible} onClose={() => setShareVisible(false)} url={boardUrl} />

      {board && (
        <EditBoardModal
          visible={editVisible}
          onClose={() => setEditVisible(false)}
          userId={userId}
          board={boards?.find((b) => b._id === boardId) ?? null}
          onRenamed={() => {}}
        />
      )}

      {moveTarget && (
        <MoveItemSheet
          visible={!!moveTarget}
          onClose={() => setMoveTarget(null)}
          userId={userId}
          sourceBoardId={boardId}
          productId={moveTarget.productId}
          onMoved={() => setMoveTarget(null)}
        />
      )}
    </SafeAreaView>
  );
}
