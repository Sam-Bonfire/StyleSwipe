import { useCurrentUser, useUserBoards, type UserBoardSummary } from '@app/infrastructure';
import { Button } from '@app/ui-kit';
import { Plus } from '@tamagui/lucide-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import { ScrollView } from 'react-native';
import { YStack, XStack, Text } from 'tamagui';

import { BoardCard } from './BoardCard';
import { CreateBoardModal } from './CreateBoardModal';

interface BoardsSectionProps {
  title?: string;
  compact?: boolean;
}

export function BoardsSection({ title = 'Your Collections', compact = false }: BoardsSectionProps) {
  const router = useRouter();
  const user = useCurrentUser();
  const userId = user?._id ?? undefined;
  const boards = useUserBoards(userId, false) as UserBoardSummary[] | undefined;
  const [createVisible, setCreateVisible] = React.useState<boolean>(false);

  if (!userId) return null;

  return (
    <YStack gap="$3">
      <XStack justifyContent="space-between" alignItems="center" paddingHorizontal="$4">
        <Text fontSize="$5" fontWeight="700">{title}</Text>
        <Button size="small" variant="outlined" icon={Plus} onPress={() => setCreateVisible(true)}>New</Button>
      </XStack>

      {boards === undefined ? (
        <XStack paddingHorizontal="$4" gap="$3">
          <YStack width={160} height={160} backgroundColor="$backgroundHover" borderRadius="$4" />
          <YStack width={160} height={160} backgroundColor="$backgroundHover" borderRadius="$4" />
        </XStack>
      ) : boards.length === 0 ? (
        <YStack paddingHorizontal="$4" paddingVertical="$3" backgroundColor="$surface" borderRadius="$4" marginHorizontal="$4" gap="$2" borderWidth={1} borderColor="$borderColor">
          <Text fontWeight="600">No collections yet</Text>
          <Text fontSize="$2" color="$textSecondary">Create a board like "Summer Fits" to organize items you love.</Text>
          <Button size="small" variant="primary" onPress={() => setCreateVisible(true)} marginTop="$2">Create Collection</Button>
        </YStack>
      ) : compact ? (
        <YStack paddingHorizontal="$4" gap="$2">
          {boards.slice(0, 3).map((b) => (
            <XStack key={b._id as string} justifyContent="space-between" alignItems="center" backgroundColor="$surface" padding="$3" borderRadius="$3" borderWidth={1} borderColor="$borderColor" onPress={() => router.push({ pathname: '/(app)/board/[id]', params: { id: b._id as string } })}>
              <YStack>
                <Text fontWeight="600">{b.name}</Text>
                <Text fontSize="$2" color="$textSecondary">{b.itemCount} items</Text>
              </YStack>
              <Text color="$primary" fontWeight="600">Open</Text>
            </XStack>
          ))}
          {boards.length > 3 && (
            <Text color="$primary" fontWeight="600" textAlign="center" onPress={() => router.push('/(app)/wishlist' as never)}>View all {boards.length} boards</Text>
          )}
        </YStack>
      ) : (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16, gap: 12 }}>
          {boards.map((b) => (
            <BoardCard key={b._id as string} board={b} />
          ))}
        </ScrollView>
      )}

      <CreateBoardModal visible={createVisible} onClose={() => setCreateVisible(false)} userId={userId} onCreated={(id) => router.push({ pathname: '/(app)/board/[id]', params: { id } })} />
    </YStack>
  );
}
