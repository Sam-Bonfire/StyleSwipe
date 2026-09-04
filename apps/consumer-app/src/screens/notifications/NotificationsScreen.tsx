import { useCurrentUser, useNotifications, useMarkAllRead } from '@app/infrastructure';
import { Button } from '@app/ui-kit';
import { useRouter } from 'expo-router';
import React from 'react';
import { SafeAreaView, FlatList } from 'react-native';
import { YStack, Text, H2, XStack, Separator } from 'tamagui';

type NotificationItem = {
  _id: string;
  type: string;
  title: string;
  body: string;
  isRead: boolean;
  createdAt: number;
  data?: Record<string, unknown>;
};

export function NotificationsScreen(): React.JSX.Element {
  const user = useCurrentUser();
  const userId: string | undefined = user?._id ?? (user as unknown as { id?: string })?.id;
  const notifications = useNotifications(userId, 20) as NotificationItem[] | undefined;
  const markAllRead = useMarkAllRead();
  const router = useRouter();

  const handlePress = (item: NotificationItem): void => {
    const data = item.data ?? {};
    if (item.type === 'PRICE_DROP' || item.type === 'BACK_IN_STOCK' || item.type === 'PARTNER_LIKED') {
      const pid = data.productId as string | undefined;
      if (pid) router.push(`/product/${pid}` as never);
    } else if (item.type === 'ORDER_UPDATE') {
      router.push('/(app)/orders' as never);
    } else if (item.type === 'PARTNER_INVITE' || item.type === 'PARTNER_MATCH') {
      const code = data.inviteCode as string | undefined;
      if (code) router.push(`/sync/${code}` as never);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: 'white' }}>
      <YStack flex={1} padding="$4" gap="$4">
        <XStack justifyContent="space-between" alignItems="center">
          <H2 fontSize="$6">Notifications</H2>
          <Button variant="ghost" onPress={() => userId && void markAllRead({ userId })}>
            Mark all read
          </Button>
        </XStack>

        {notifications === undefined ? (
          <Text color="$textSecondary">Loading…</Text>
        ) : notifications.length === 0 ? (
          <YStack flex={1} justifyContent="center" alignItems="center" gap="$3">
            <Text fontSize="$5">No notifications yet</Text>
            <Text color="$textSecondary" textAlign="center">
              Price drops, restocks and partner likes will appear here.
            </Text>
          </YStack>
        ) : (
          <FlatList
            data={notifications}
            keyExtractor={(item) => item._id}
            ItemSeparatorComponent={() => <Separator borderColor="$borderColor" />}
            renderItem={({ item }: { item: NotificationItem }) => (
              <YStack
                paddingVertical="$3"
                gap="$1"
                opacity={item.isRead ? 0.6 : 1}
                pressStyle={{ backgroundColor: '$backgroundHover' }}
                onPress={() => handlePress(item)}
              >
                <Text fontWeight={item.isRead ? '400' : '700'} fontSize="$3">
                  {item.title}
                </Text>
                <Text fontSize="$3" color="$textSecondary">
                  {item.body}
                </Text>
                <Text fontSize="$2" color="$textSecondary">
                  {new Date(item.createdAt).toLocaleString()}
                </Text>
              </YStack>
            )}
          />
        )}
      </YStack>
    </SafeAreaView>
  );
}
