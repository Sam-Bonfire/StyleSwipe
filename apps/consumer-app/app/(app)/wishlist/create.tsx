import { useCurrentUser, useCreateBoard } from '@app/infrastructure';
import { Button } from '@app/ui-kit';
import { ChevronLeft } from '@tamagui/lucide-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import { Alert, SafeAreaView } from 'react-native';
import { YStack, XStack, Text, Input } from 'tamagui';

function slugifyInput(value: string): string {
  return value.toLowerCase().trim().replace(/[^\w\s-]/g, '').replace(/[\s_]+/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '').slice(0, 48);
}

export default function WishlistCreateRoute() {
  const router = useRouter();
  const user = useCurrentUser();
  const userId = user?._id ?? undefined;
  const createBoard = useCreateBoard();
  const [name, setName] = React.useState<string>('');
  const [slug, setSlug] = React.useState<string>('');
  const [slugTouched, setSlugTouched] = React.useState<boolean>(false);
  const [submitting, setSubmitting] = React.useState<boolean>(false);

  const handleNameChange = (value: string) => {
    setName(value);
    if (!slugTouched) setSlug(slugifyInput(value));
  };

  const canSubmit = name.trim().length >= 1 && name.trim().length <= 48 && slug.length >= 1;

  const handleCreate = async () => {
    if (!userId) {
      Alert.alert('Login required', 'Please log in');
      return;
    }
    if (!canSubmit) {
      Alert.alert('Validation', 'Name 1-48 chars, slug required');
      return;
    }
    setSubmitting(true);
    try {
      const result = await createBoard(userId, name.trim(), slug);
      router.replace({ pathname: '/(app)/boards/[id]', params: { id: result.boardId as string } });
    } catch (e) {
      Alert.alert('Error', e instanceof Error ? e.message : 'Failed to create');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: 'white' }}>
      <XStack alignItems="center" gap="$2" padding="$3" borderBottomWidth={1} borderColor="$borderColor">
        <YStack width={36} height={36} borderRadius={18} backgroundColor="$backgroundHover" alignItems="center" justifyContent="center" onPress={() => router.back()}>
          <ChevronLeft size={20} />
        </YStack>
        <Text fontSize="$5" fontWeight="700">Create Collection</Text>
      </XStack>
      <YStack flex={1} padding="$4" gap="$4">
        <Text color="$textSecondary">Create a new board like "Summer Fits" or "Gift for Mom". Boards help you organize saved items.</Text>
        <YStack gap="$2">
          <Text fontWeight="600">Name</Text>
          <Input placeholder="Summer Fits" value={name} onChangeText={handleNameChange} maxLength={48} />
          <Text fontSize="$2" color="$textTertiary">{name.length}/48</Text>
        </YStack>
        <YStack gap="$2">
          <Text fontWeight="600">Slug</Text>
          <Input
            placeholder="summer-fits"
            value={slug}
            onChangeText={(v) => {
              setSlugTouched(true);
              setSlug(slugifyInput(v));
            }}
            autoCapitalize="none"
          />
          <Text fontSize="$2" color="$textTertiary">Auto-generated, URL-friendly.</Text>
        </YStack>
        <Button variant="primary" size="large" onPress={handleCreate} loading={submitting} disabled={!canSubmit || submitting}>Create Board</Button>
      </YStack>
    </SafeAreaView>
  );
}
