import { useOrder, useCancelOrder, useReturnOrder, useProductsByIds } from '@app/infrastructure';
import { Button, TopBarIconButton } from '@app/ui-kit';
import { ChevronLeft, Truck, XCircle, RotateCcw } from '@tamagui/lucide-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useMemo } from 'react';
import { SafeAreaView } from 'react-native';
import { YStack, Text, XStack, ScrollView, Image } from 'tamagui';

export function OrderDetailScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ id: string }>();
  const orderId = params.id as string | undefined;

  const order = useOrder(orderId);
  const cancelOrder = useCancelOrder();
  const returnOrder = useReturnOrder();

  const productIds = useMemo(() => {
    const o = order as unknown as { items?: { productId: string }[] } | null | undefined;
    return o?.items?.map((i) => i.productId) ?? [];
  }, [order]);
  const products = useProductsByIds(productIds);

  const productMap = useMemo(() => {
    if (!products) return new Map<string, unknown>();
    return new Map((products as unknown as { _id: string }[]).map((p) => [p._id, p]));
  }, [products]);

  const canCancel = useMemo(() => {
    if (!order) return false;
    const o = order as unknown as { status: string; createdAt: number };
    const lower = o.status.toLowerCase();
    if (['shipped', 'delivered', 'cancelled', 'returned'].includes(lower)) return false;
    if (Date.now() - o.createdAt > 24 * 60 * 60 * 1000) return false;
    return true;
  }, [order]);

  const canReturn = useMemo(() => {
    if (!order) return false;
    const o = order as unknown as { status: string; statusHistory: { status: string; timestamp: number }[]; createdAt: number };
    const lower = o.status.toLowerCase();
    if (lower !== 'delivered' && lower !== 'shipped') return false;
    const last = [...o.statusHistory].reverse().find((h) => ['delivered', 'shipped'].includes(h.status.toLowerCase()));
    const base = last?.timestamp ?? o.createdAt;
    if (Date.now() - base > 7 * 24 * 60 * 60 * 1000) return false;
    return true;
  }, [order]);

  if (order === undefined) {
    return (
      <YStack flex={1} alignItems="center" justifyContent="center">
        <Text>Loading order...</Text>
      </YStack>
    );
  }

  if (!order) {
    return (
      <YStack flex={1} alignItems="center" justifyContent="center" padding="$4" gap="$3">
        <XCircle size={48} color="$textSecondary" />
        <Text fontSize="$5" fontWeight="600">Order not found</Text>
        <Button onPress={() => router.back()}>Go back</Button>
      </YStack>
    );
  }

  const o = order as unknown as {
    _id: string;
    orderNumber: string;
    status: string;
    statusHistory: { status: string; timestamp: number; reason?: string }[];
    pricing: { subtotal: number; shippingCost: number; discountAmount: number; tax: number; totalAmount: number };
    items: { productId: string; quantity: number; price: number; brand?: string; title?: string; image?: string }[];
    deliveryAddress: { name: string; line1: string; line2?: string; city: string; state: string; postalCode: string; country: string; phone: string };
    paymentInfo?: { method: string; paymentStatus: string };
    tracking?: { carrier: string; trackingNumber: string; estimatedDeliveryDate?: number };
    trackingId?: string;
    createdAt: number;
  };

  const formatCurrency = (n: number) =>
    new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(n);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: 'white' }}>
      <XStack alignItems="center" gap="$2" padding="$2" borderBottomWidth={1} borderColor="$borderColor">
        <TopBarIconButton onPress={() => router.back()} backgroundColor="$background">
          <ChevronLeft size={24} color="$textPrimary" />
        </TopBarIconButton>
        <Text fontSize="$5" fontWeight="bold">Order Detail</Text>
      </XStack>

      <ScrollView>
        <YStack padding="$4" gap="$4" paddingBottom="$10">
          <YStack gap="$1">
            <Text fontSize="$6" fontWeight="bold">{o.orderNumber}</Text>
            <Text fontSize="$2" color="$textSecondary">Placed on {new Date(o.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</Text>
            <YStack
              alignSelf="flex-start"
              backgroundColor={o.status.toLowerCase() === 'delivered' ? '$success' : o.status.toLowerCase() === 'cancelled' ? '$textSecondary' : '$primary'}
              paddingHorizontal="$3"
              paddingVertical="$1"
              borderRadius="$2"
              marginTop="$1"
            >
              <Text color="white" fontWeight="700" fontSize="$2" textTransform="uppercase">{o.status}</Text>
            </YStack>
          </YStack>

          <YStack backgroundColor="$surface" padding="$3" borderRadius="$3" borderWidth={1} borderColor="$borderColor" gap="$3">
            <Text fontWeight="600">Items ({o.items.length})</Text>
            {o.items.map((item) => {
              const prod = productMap.get(item.productId) as unknown as { images?: string[]; platform?: string; meta?: Record<string, string> } | undefined;
              const imageUrl = item.image || prod?.images?.[0] || 'https://placehold.co/80x100';
              const platformRaw = (prod?.platform as string) ?? (prod?.meta?.['platform'] as string) ?? '';
              const platform = platformRaw || 'StyleSwipe';
              return (
                <XStack key={item.productId} gap="$3" alignItems="center">
                  <Image source={{ uri: imageUrl }} width={64} height={80} borderRadius="$2" />
                  <YStack flex={1} gap="$1">
                    <Text fontSize="$2" fontWeight="600" textTransform="uppercase">{item.brand}</Text>
                    <Text fontSize="$3" numberOfLines={2}>{item.title}</Text>
                    <Text fontSize="$2" color="$textSecondary">Qty {item.quantity} • {formatCurrency(item.price)}</Text>
                    <Text fontSize="$1" color="$textSecondary">via {platform}</Text>
                  </YStack>
                </XStack>
              );
            })}
          </YStack>

          <YStack backgroundColor="$surface" padding="$3" borderRadius="$3" borderWidth={1} borderColor="$borderColor" gap="$2">
            <Text fontWeight="600">Payment</Text>
            <Text fontSize="$3" color="$textSecondary">Method: {o.paymentInfo?.method ?? 'COD'} • Status: {o.paymentInfo?.paymentStatus ?? 'PENDING'}</Text>
            <Text fontSize="$3" color="$textSecondary">Total: {formatCurrency(o.pricing.totalAmount)} (Subtotal {formatCurrency(o.pricing.subtotal)} + Shipping {formatCurrency(o.pricing.shippingCost)} + Tax {formatCurrency(o.pricing.tax)})</Text>
          </YStack>

          <YStack backgroundColor="$surface" padding="$3" borderRadius="$3" borderWidth={1} borderColor="$borderColor" gap="$2">
            <Text fontWeight="600">Delivery Address</Text>
            <Text fontSize="$3" color="$textSecondary">{o.deliveryAddress.name}</Text>
            <Text fontSize="$3" color="$textSecondary">{o.deliveryAddress.line1}{o.deliveryAddress.line2 ? `, ${o.deliveryAddress.line2}` : ''}</Text>
            <Text fontSize="$3" color="$textSecondary">{o.deliveryAddress.city}, {o.deliveryAddress.state} - {o.deliveryAddress.postalCode}</Text>
            <Text fontSize="$3" color="$textSecondary">{o.deliveryAddress.country} • {o.deliveryAddress.phone}</Text>
          </YStack>

          <YStack backgroundColor="$surface" padding="$3" borderRadius="$3" borderWidth={1} borderColor="$borderColor" gap="$3">
            <XStack gap="$2" alignItems="center">
              <Truck size={18} color="$primary" />
              <Text fontWeight="600">Tracking</Text>
            </XStack>
            {o.trackingId || o.tracking?.trackingNumber ? (
              <YStack gap="$1">
                <Text fontSize="$3">Carrier: {o.tracking?.carrier ?? 'Pending'}</Text>
                <Text fontSize="$3" color="$primary">ID: {o.tracking?.trackingNumber ?? o.trackingId}</Text>
                {o.tracking?.estimatedDeliveryDate ? (
                  <Text fontSize="$2" color="$textSecondary">Est. delivery: {new Date(o.tracking.estimatedDeliveryDate).toLocaleDateString('en-IN')}</Text>
                ) : null}
              </YStack>
            ) : (
              <Text fontSize="$3" color="$textSecondary">Tracking will be available once shipped. Via product platform fulfillment.</Text>
            )}
          </YStack>

          <YStack gap="$2">
            <Text fontWeight="600">Timeline</Text>
            {o.statusHistory.map((h, idx) => (
              <XStack key={`${h.status}-${idx}`} gap="$3" alignItems="flex-start">
                <YStack alignItems="center" width={24}>
                  <YStack
                    width={10}
                    height={10}
                    borderRadius={5}
                    backgroundColor={idx === o.statusHistory.length - 1 ? '$success' : '$borderColor'}
                    marginTop={4}
                  />
                  {idx < o.statusHistory.length - 1 ? <YStack width={2} flex={1} backgroundColor="$borderColor" marginTop="$1" /> : null}
                </YStack>
                <YStack flex={1} paddingBottom="$3">
                  <Text fontSize="$3" fontWeight="600" textTransform="capitalize">{h.status}</Text>
                  <Text fontSize="$2" color="$textSecondary">{new Date(h.timestamp).toLocaleString('en-IN')}</Text>
                  {h.reason ? <Text fontSize="$2" color="$textSecondary">Reason: {h.reason}</Text> : null}
                </YStack>
              </XStack>
            ))}
          </YStack>

          <YStack gap="$3" marginTop="$2">
            {canCancel ? (
              <Button
                backgroundColor="$error"
                onPress={async () => {
                  try {
                    await cancelOrder(o._id, 'User cancelled from detail');
                    router.replace('/(app)/orders' as never);
                  } catch (e) {
                    console.error(e);
                  }
                }}
                icon={XCircle}
              >
                <Text color="white" fontWeight="600">Cancel Order (24h window)</Text>
              </Button>
            ) : null}

            {canReturn ? (
              <Button
                variant="outlined"
                borderColor="$primary"
                onPress={async () => {
                  try {
                    await returnOrder(o._id, 'User requested return');
                    router.replace('/(app)/orders' as never);
                  } catch (e) {
                    console.error(e);
                  }
                }}
                icon={RotateCcw}
              >
                <Text color="$primary" fontWeight="600">Return Order (7 day window)</Text>
              </Button>
            ) : null}

            {!canCancel && !canReturn ? (
              <Text fontSize="$2" color="$textSecondary" textAlign="center">
                {o.status.toLowerCase() === 'cancelled'
                  ? 'This order was cancelled.'
                  : o.status.toLowerCase() === 'returned'
                    ? 'Return processed.'
                    : 'Cancel/Return not available for this status/window.'}
              </Text>
            ) : null}
          </YStack>
        </YStack>
      </ScrollView>
    </SafeAreaView>
  );
}

export default OrderDetailScreen;
