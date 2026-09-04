import type { UserBoardSummary } from '@app/infrastructure';

import { useRouter } from 'expo-router';
import { Image, YStack, XStack, Text } from 'tamagui';

interface BoardCardProps {
  board: UserBoardSummary;
  onPress?: () => void;
}

export function BoardCard({ board, onPress }: BoardCardProps) {
  const router = useRouter();
  const handlePress = () => {
    if (onPress) {
      onPress();
    } else {
      router.push({ pathname: '/(app)/board/[id]', params: { id: board._id as string } });
    }
  };

  return (
    <YStack
      width={160}
      backgroundColor="$surface"
      borderRadius="$4"
      borderWidth={1}
      borderColor="$borderColor"
      overflow="hidden"
      pressStyle={{ scale: 0.98, opacity: 0.9 }}
      onPress={handlePress}
      elevation={1}
    >
      <YStack height={100} backgroundColor="$backgroundHover" alignItems="center" justifyContent="center">
        {board.previewImage ? (
          <Image source={{ uri: board.previewImage }} width={160} height={100} resizeMode="cover" />
        ) : (
          <Text fontSize="$8" opacity={0.2}>♡</Text>
        )}
      </YStack>
      <YStack padding="$3" gap="$1">
        <Text fontSize="$3" fontWeight="700" numberOfLines={1}>{board.name}</Text>
        <Text fontSize="$2" color="$textSecondary">{board.itemCount} items</Text>
        <Text fontSize="$1" color="$textTertiary" numberOfLines={1}>{board.slug}</Text>
      </YStack>
    </YStack>
  );
}

export function BoardListCard({ board, onPress }: BoardCardProps) {
  const router = useRouter();
  const handlePress = () => {
    if (onPress) onPress();
    else router.push({ pathname: '/(app)/board/[id]', params: { id: board._id as string } });
  };
  return (
    <XStack
      backgroundColor="$surface"
      borderRadius="$3"
      borderWidth={1}
      borderColor="$borderColor"
      padding="$3"
      gap="$3"
      alignItems="center"
      pressStyle={{ backgroundColor: '$backgroundHover' }}
      onPress={handlePress}
    >
      <YStack width={56} height={56} borderRadius="$2" backgroundColor="$backgroundHover" overflow="hidden" alignItems="center" justifyContent="center">
        {board.previewImage ? (
          <Image source={{ uri: board.previewImage }} width={56} height={56} resizeMode="cover" />
        ) : (
          <Text fontSize="$5" opacity={0.3}>♡</Text>
        )}
      </YStack>
      <YStack flex={1} gap="$1">
        <Text fontWeight="600" numberOfLines={1}>{board.name}</Text>
        <Text fontSize="$2" color="$textSecondary">{board.itemCount} items • {board.slug}</Text>
      </YStack>
      <Text color="$primary" fontWeight="600" fontSize="$3">View</Text>
    </XStack>
  );
}
