import { useCreateBoard } from '@app/infrastructure';
import { Button } from '@app/ui-kit';
import { X } from '@tamagui/lucide-icons';
import React from 'react';
import { Modal, Alert } from 'react-native';
import { YStack, XStack, Text, Input } from 'tamagui';

function slugifyInput(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 48);
}

interface CreateBoardModalProps {
  visible: boolean;
  onClose: () => void;
  userId: string | undefined;
  onCreated?: (boardId: string) => void;
}

export function CreateBoardModal({ visible, onClose, userId, onCreated }: CreateBoardModalProps) {
  const [name, setName] = React.useState<string>('');
  const [slug, setSlug] = React.useState<string>('');
  const [slugTouched, setSlugTouched] = React.useState<boolean>(false);
  const [submitting, setSubmitting] = React.useState<boolean>(false);
  const createBoard = useCreateBoard();

  React.useEffect(() => {
    if (visible) {
      setName('');
      setSlug('');
      setSlugTouched(false);
      setSubmitting(false);
    }
  }, [visible]);

  const handleNameChange = (value: string) => {
    setName(value);
    if (!slugTouched) {
      setSlug(slugifyInput(value));
    }
  };

  const handleSlugChange = (value: string) => {
    setSlugTouched(true);
    setSlug(slugifyInput(value));
  };

  const canSubmit = name.trim().length >= 1 && name.trim().length <= 48 && slug.length >= 1;

  const handleSubmit = async () => {
    if (!userId) {
      Alert.alert('Login required', 'Please log in to create a board.');
      return;
    }
    if (!canSubmit) {
      Alert.alert('Validation', 'Name must be 1-48 chars and slug required.');
      return;
    }
    setSubmitting(true);
    try {
      const result = await createBoard(userId, name.trim(), slug);
      onCreated?.(result.boardId as string);
      onClose();
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Failed to create board';
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
            <Text fontSize="$6" fontWeight="700">Create Collection</Text>
            <XStack
              width={32}
              height={32}
              borderRadius={16}
              backgroundColor="$backgroundHover"
              alignItems="center"
              justifyContent="center"
              onPress={onClose}
              pressStyle={{ opacity: 0.7 }}
            >
              <X size={18} />
            </XStack>
          </XStack>
          <Text fontSize="$3" color="$textSecondary">Name your new board. E.g. "Summer Fits" or "Gift for Mom"</Text>
          <YStack gap="$2">
            <Text fontSize="$2" fontWeight="600">Name</Text>
            <Input
              placeholder="Summer Fits"
              value={name}
              onChangeText={handleNameChange}
              maxLength={48}
              borderColor={name.length > 48 ? '$error' : '$borderColor'}
            />
          </YStack>
          <YStack gap="$2">
            <Text fontSize="$2" fontWeight="600">Slug</Text>
            <Input placeholder="summer-fits" value={slug} onChangeText={handleSlugChange} autoCapitalize="none" />
            <Text fontSize="$1" color="$textTertiary">URL-friendly identifier. Auto-generated from name.</Text>
          </YStack>
          <XStack gap="$3" marginTop="$2">
            <Button variant="outlined" flex={1} onPress={onClose} disabled={submitting}>
              Cancel
            </Button>
            <Button variant="primary" flex={1} onPress={handleSubmit} loading={submitting} disabled={!canSubmit || submitting}>
              Create
            </Button>
          </XStack>
        </YStack>
      </YStack>
    </Modal>
  );
}
