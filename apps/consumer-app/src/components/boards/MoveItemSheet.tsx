import { useUserBoards, useMoveBoardItem, type UserBoardSummary } from '@app/infrastructure';
import { Button } from '@app/ui-kit';
import React from 'react';
import { Modal, Alert } from 'react-native';
import { YStack, XStack, Text, ScrollView } from 'tamagui';

interface MoveItemSheetProps {
  visible: boolean;
  onClose: () => void;
  userId: string | undefined;
  sourceBoardId: string;
  productId: string;
  onMoved?: () => void;
}

export function MoveItemSheet({ visible, onClose, userId, sourceBoardId, productId, onMoved }: MoveItemSheetProps) {
  const boards = useUserBoards(userId, false) as UserBoardSummary[] | undefined;
  const moveItem = useMoveBoardItem();
  const [movingId, setMovingId] = React.useState<string | null>(null);

  const candidates = React.useMemo(() => {
    if (!boards) return [];
    return boards.filter((b) => b._id !== sourceBoardId);
  }, [boards, sourceBoardId]);

  const handleMove = async (targetBoardId: string) => {
    setMovingId(targetBoardId);
    try {
      await moveItem(sourceBoardId, targetBoardId, productId);
      onMoved?.();
      onClose();
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Failed to move item';
      Alert.alert('Error', message);
    } finally {
      setMovingId(null);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <YStack flex={1} backgroundColor="rgba(0,0,0,0.4)" justifyContent="flex-end">
        <YStack backgroundColor="$background" borderTopLeftRadius="$5" borderTopRightRadius="$5" padding="$4" maxHeight="70%" gap="$4">
          <XStack justifyContent="space-between" alignItems="center">
            <Text fontSize="$5" fontWeight="700">Move to Collection</Text>
            <Text color="$primary" fontWeight="600" onPress={onClose}>Close</Text>
          </XStack>
          {boards === undefined ? (
            <Text color="$textSecondary">Loading boards...</Text>
          ) : candidates.length === 0 ? (
            <YStack gap="$2" alignItems="center" padding="$4">
              <Text color="$textSecondary" textAlign="center">No other collections. Create one first.</Text>
            </YStack>
          ) : (
            <ScrollView>
              <YStack gap="$2">
                {candidates.map((board) => (
                  <XStack
                    key={board._id as string}
                    padding="$3"
                    borderWidth={1}
                    borderColor="$borderColor"
                    borderRadius="$3"
                    justifyContent="space-between"
                    alignItems="center"
                    pressStyle={{ backgroundColor: '$backgroundHover' }}
                    onPress={() => handleMove(board._id as string)}
                  >
                    <YStack flex={1}>
                      <Text fontWeight="600">{board.name}</Text>
                      <Text fontSize="$2" color="$textSecondary">{board.itemCount} items • {board.slug}</Text>
                    </YStack>
                    <Button size="small" variant="primary" loading={movingId === (board._id as string)} disabled={movingId !== null}>
                      Move
                    </Button>
                  </XStack>
                ))}
              </YStack>
            </ScrollView>
          )}
        </YStack>
      </YStack>
    </Modal>
  );
}
