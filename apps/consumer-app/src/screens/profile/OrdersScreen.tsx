import { useCurrentUser, useOrders } from '@app/infrastructure';
import { Button, TopBarIconButton } from '@app/ui-kit';
import { ChevronLeft, Package, ShoppingBag } from '@tamagui/lucide-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import { SafeAreaView } from 'react-native';
import { YStack, ScrollView, Text, XStack, Separator } from 'tamagui';

const STATUS_COLOR: Record<string, string> = {
  pending: '#f59e0b',
  paid: '#3b82f6',
  shipped: '#8b5cf6',
  delivered: '#10b981',
  returned: '#ef4444',
  cancelled: '#6b7280',
  PENDING: '#f59e0b',
  PAID: '#3b82f6',
  SHIPPED: '#8b5cf6',
  DELIVERED: '#10b981',
  RETURNED: '#ef4444',
  CANCELLED: '#6b7280',
};

export function OrdersScreen() {
  const router = useRouter();
  const user = useCurrentUser();
  const userId = user?._id ?? undefined;

  const orders = useOrders(userId);

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const formatCurrency = (n: number) =>
    new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(n);

  const renderContent = () => {
    if (userId && orders === undefined) {
      return (
        <YStack flex={1} alignItems="center" justifyContent="center">
          <Text>Loading orders...</Text>
        </YStack>
      );
    }

    const page = orders?.results ?? [];
    if (!page || page.length === 0) {
      return (
        <YStack flex={1} alignItems="center" justifyContent="center" padding="$4" gap="$3">
          <ShoppingBag size={48} color="$textSecondary" opacity={0.5} />
          <Text fontSize="$5" fontWeight="600">No orders yet</Text>
          <Text color="$textSecondary" textAlign="center" paddingHorizontal="$4">
            Your real orders will appear here after checkout. Cart → Checkout → Orders.
          </Text>
          <Button marginTop="$4" backgroundColor="$primary" onPress={() => router.push('/(app)/(tabs)/discover')}>
            <Text color="white" fontWeight="600">Discover Products</Text>
          </Button>
        </YStack>
      );
    }

    return (
      <ScrollView>
        <YStack padding="$4" gap="$4" paddingBottom="$10">
          <YStack gap="$4">
            {page.map((order: unknown) => {
              const o = order as {
                _id: string;
                orderNumber: string;
                status: string;
                createdAt: number;
                pricing: { totalAmount: number };
                items: { brand?: string; title?: string }[];
                tracking?: { carrier: string; trackingNumber: string };
                trackingId?: string;
              };
              const color = STATUS_COLOR[o.status] ?? '#6b7280';
              return (
                <YStack
                  key={o._id}
                  backgroundColor="$surface"
                  padding="$3"
                  borderRadius="$3"
                  borderWidth={1}
                  borderColor="$borderColor"
                  gap="$3"
                  pressStyle={{ scale: 0.98 }}
                  onPress={() => router.push(`/(app)/orders/${o._id}` as never)}
                >
                  <XStack justifyContent="space-between" alignItems="center">
                    <YStack>
                      <Text fontSize="$2" fontWeight="700" color="$textPrimary">{o.orderNumber}</Text>
                      <Text fontSize="$2" color="$textSecondary">{formatDate(o.createdAt)} • {o.items.length} item{o.items.length > 1 ? 's' : ''}</Text>
                    </YStack>
                    <YStack backgroundColor={color as never} paddingHorizontal="$2" paddingVertical="$1" borderRadius="$2">
                      <Text fontSize="$1" color="white" fontWeight="700" textTransform="uppercase">{o.status}</Text>
                    </YStack>
                  </XStack>

                  <Separator borderColor="$borderColor" />

                  <YStack gap="$1">
                    <Text fontSize="$2" color="$textSecondary" numberOfLines={2}>{o.items[0]?.brand ?? ''} {o.items[0]?.title ?? ''}{o.items.length > 1 ? ` +${o.items.length - 1} more` : ''}</Text>
                    <Text fontSize="$3" fontWeight="bold">{formatCurrency(o.pricing.totalAmount)}</Text>
                    {o.trackingId || o.tracking?.trackingNumber ? (
                      <XStack gap="$2" alignItems="center">
                        <Package size={14} color="$textSecondary" />
                        <Text fontSize="$1" color="$textSecondary">{o.tracking?.carrier ?? 'Carrier'} • {o.tracking?.trackingNumber ?? o.trackingId}</Text>
                      </XStack>
                    ) : null}
                  </YStack>
                </YStack>
              );
            })}
          </YStack>

          {orders?.status === 'CanLoadMore' ? (
            <Button variant="outlined" onPress={() => orders.loadMore(20)}>Load more</Button>
          ) : null}
        </YStack>
      </ScrollView>
    );
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: 'white' }}>
      <XStack alignItems="center" gap="$2" padding="$2" borderBottomWidth={1} borderColor="$borderColor">
        <TopBarIconButton
          onPress={() => router.back()}
          backgroundColor="$background"
          shadowColor="$shadowColor"
          shadowRadius={4}
          shadowOpacity={0.1}
        >
          <ChevronLeft size={24} color="$textPrimary" />
        </TopBarIconButton>
        <Text fontSize="$5" fontWeight="bold">Your Orders</Text>
      </XStack>

      {renderContent()}
    </SafeAreaView>
  );
}

export default OrdersScreen;
