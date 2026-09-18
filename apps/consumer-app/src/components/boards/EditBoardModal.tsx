import { useRenameBoard, type UserBoardSummary } from '@app/infrastructure';
import { Button } from '@app/ui-kit';
import { X } from '@tamagui/lucide-icons';
import React from 'react';
import { Modal, Alert } from 'react-native';
import { YStack, XStack, Text, Input } from 'tamagui';

function slugifyInput(value: string): string {
  return value.toLowerCase().trim().replace(/[^\w\s-]/g, '').replace(/[\s_]+/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '').slice(0, 48);
}

interface EditBoardModalProps {
  visible: boolean;
  onClose: () => void;
  userId: string | undefined;
  board: UserBoardSummary | null;
  onRenamed?: () => void;
}

export function EditBoardModal({ visible, onClose, userId, board, onRenamed }: EditBoardModalProps) {
  const [name, setName] = React.useState<string>(board?.name ?? '');
  const [slug, setSlug] = React.useState<string>(board?.slug ?? '');
  const [submitting, setSubmitting] = React.useState<boolean>(false);
  const renameBoard = useRenameBoard();

  React.useEffect(() => {
    if (board) {
      setName(board.name);
      setSlug(board.slug);
    }
  }, [board]);

  const canSubmit = name.trim().length >= 1 && name.trim().length <= 48 && slug.length >= 1 && board !== null;

  const handleSubmit = async () => {
    if (!board || !userId) {
      Alert.alert('Error', 'Missing board or user');
      return;
    }
    setSubmitting(true);
    try {
      const normalizedSlug = slugifyInput(slug);
      await renameBoard(board._id as string, userId, name.trim(), normalizedSlug);
      onRenamed?.();
      onClose();
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Failed to rename';
      Alert.alert('Error', message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <YStack flex={1} backgroundColor="rgba(0,0,0,0.5)" alignItems="center" justifyContent="center" padding="$4">
        <YStack backgroundColor="$background" borderRadius="$4" padding="$5" width="100%" maxWidth={400} gap="$4">
          <XStack justifyContent="space-between" alignItems="center">
            <Text fontSize="$6" fontWeight="700">Edit Collection</Text>
            <XStack width={32} height={32} borderRadius={16} backgroundColor="$backgroundHover" alignItems="center" justifyContent="center" onPress={onClose}>
              <X size={18} />
            </XStack>
          </XStack>
          <YStack gap="$2">
            <Text fontSize="$2" fontWeight="600">Name</Text>
            <Input value={name} onChangeText={setName} maxLength={48} />
          </YStack>
          <YStack gap="$2">
            <Text fontSize="$2" fontWeight="600">Slug</Text>
            <Input value={slug} onChangeText={(v) => setSlug(slugifyInput(v))} autoCapitalize="none" />
          </YStack>
          <XStack gap="$3" marginTop="$2">
            <Button variant="outlined" flex={1} onPress={onClose} disabled={submitting}>Cancel</Button>
            <Button variant="primary" flex={1} onPress={handleSubmit} loading={submitting} disabled={!canSubmit || submitting}>Save</Button>
          </XStack>
        </YStack>
      </YStack>
    </Modal>
  );
}
