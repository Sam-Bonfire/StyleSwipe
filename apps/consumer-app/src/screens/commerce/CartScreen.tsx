import { PriceEstimator, type Cart } from '@app/core';
import {
  useCurrentUser,
  useCart,
  useUpdateCartQuantity,
  useRemoveFromCart,
  useProductsByIds,
  useAnalytics,
  useGuestCart,
} from '@app/infrastructure';
import { Button } from '@app/ui-kit';
import CartItemComponent from '@app/ui-kit/components/CartItem';
import PriceSummary from '@app/ui-kit/components/PriceSummary';
import { ShoppingBag } from '@tamagui/lucide-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import { YStack, ScrollView, Text } from 'tamagui';

export const CartScreen = () => {
  const router = useRouter();
  const user = useCurrentUser();
  const userId = user?._id ?? undefined;

  const serverCart = useCart(userId);
  const guest = useGuestCart();
  const updateQuantity = useUpdateCartQuantity();
  const removeFromCart = useRemoveFromCart();
  const { trackEvent } = useAnalytics();

  // Unified cart: server cart if logged in, otherwise guest cart
  const cart: Cart | null = React.useMemo(() => {
    if (userId) return serverCart ?? null;
    if (guest.loading) return null;
    // Build Cart domain object from guest items
    const items = guest.items.map((g) => ({
      productId: g.productId,
      quantity: g.quantity,
      price: g.price,
      selectedAttributes: g.attributes,
    }));
    const subtotal = items.reduce((s, i) => s + i.price * i.quantity, 0);
    return {
      userId: 'guest',
      items,
      currency: 'INR',
      subtotal,
      discountTotal: 0,
      estimatedTax: Math.round(subtotal * 0.05),
      total: subtotal + Math.round(subtotal * 0.05),
      updatedAt: Date.now(),
    } as Cart;
  }, [userId, serverCart, guest.items, guest.loading]);

  const isLoading = userId ? serverCart === undefined : guest.loading;

  // Fetch full product items to display real images
  const productIds = React.useMemo(() => cart?.items.map((i) => i.productId) ?? [], [cart?.items]);
  const productsDocs = useProductsByIds(productIds);

  const productMap = React.useMemo(() => {
    if (!productsDocs) return new Map();
    return new Map(productsDocs.map((p) => [p._id, p]));
  }, [productsDocs]);

  const handleUpdateQuantity = async (productId: string, quantity: number) => {
    try {
      if (userId) {
        await updateQuantity(userId, productId, quantity);
      } else {
        await guest.updateQuantity(productId, quantity);
      }
    } catch (e) {
      console.error('Failed to update quantity', e);
    }
  };

  const handleRemove = async (productId: string) => {
    try {
      if (userId) {
        await removeFromCart(userId, productId);
      } else {
        await guest.remove(productId);
      }
    } catch (e) {
      console.error('Failed to remove item', e);
    }
  };

  const handleProceedToCheckout = () => {
    if (!cart || cart.items.length === 0) return;
    trackEvent('checkout_initiated', { cartItems: cart.items.length }, { variant: 'macro_v1' });
    router.push('/(app)/checkout');
  };

  if (isLoading) {
    return (
      <YStack flex={1} alignItems="center" justifyContent="center">
        <Text>Loading Bag...</Text>
      </YStack>
    );
  }

  if (!cart || cart.items.length === 0) {
    return (
      <YStack flex={1} alignItems="center" justifyContent="center" padding="$4">
        <Text fontSize="$5" fontWeight="600">
          Your bag is empty
        </Text>
        <Text color="$textSecondary" marginTop="$2">
          Start swiping to add items!
        </Text>
      </YStack>
    );
  }

  const priceBreakdown = PriceEstimator.estimate(cart);

  return (
    <YStack flex={1} backgroundColor="$background">
      <ScrollView backgroundColor="$background">
        <YStack padding="$4" gap="$4" paddingBottom="$10">
          <Text fontSize="$6" fontWeight="bold" marginBottom="$2">
            Shopping Bag ({cart.items.length})
          </Text>

          <YStack gap="$3">
            {cart.items.map((item) => {
              const product = productMap.get(item.productId);
              const imageUrl = product?.images?.[0] || 'https://placehold.co/100x120';
              const title = product?.title || `Product ${item.productId}`;
              const brand = product?.brand || item.selectedAttributes?.['brand'] || 'Brand';
              const originalPrice = product?.mrp || item.price;

              return (
                <CartItemComponent
                  key={item.productId}
                  imageUrl={imageUrl}
                  brand={brand}
                  title={title}
                  price={item.price}
                  originalPrice={originalPrice}
                  quantity={item.quantity}
                  currency="INR"
                  size={item.selectedAttributes?.['size']}
                  onQuantityChange={(qty) => handleUpdateQuantity(item.productId, qty)}
                  onRemove={() => handleRemove(item.productId)}
                />
              );
            })}
          </YStack>

          <PriceSummary
            subtotal={priceBreakdown.subtotal}
            shipping={priceBreakdown.shipping}
            tax={priceBreakdown.tax}
            freeShippingThreshold={1000}
            currency="INR"
          />

          <Button
            backgroundColor="$primary"
            onPress={handleProceedToCheckout}
            marginTop="$4"
            size="large"
            borderRadius="$3"
            icon={ShoppingBag}
          >
            <Text color="white" fontWeight="bold">
              Proceed to Checkout
            </Text>
          </Button>

          {!userId ? (
            <Text fontSize="$2" color="$textSecondary" textAlign="center" marginTop="$2">
              Sign in to save your bag and get faster checkout
            </Text>
          ) : null}
        </YStack>
      </ScrollView>
    </YStack>
  );
};

export default CartScreen;
