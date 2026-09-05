import { PriceEstimator, type Cart } from '@app/core';
import {
  useCurrentUser,
  useCart,
  useUpdateCartQuantity,
  useRemoveFromCart,
  useProductsByIds,
  useAnalytics,
  useDirectShoppingEnabled,
  useGuestCart,
} from '@app/infrastructure';
import { Button } from '@app/ui-kit';
import CartItemComponent from '@app/ui-kit/components/CartItem';
import PriceSummary from '@app/ui-kit/components/PriceSummary';
import { ShoppingBag } from '@tamagui/lucide-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import { YStack, ScrollView, Text } from 'tamagui';

import { MerchantButton } from '../../components/MerchantButton';

/**
 * Direct-shopping checkout section. Rendered only when the
 * direct_shopping feature flag is enabled.
 */
const DirectCheckoutSection = ({ cart, onProceed }: { cart: Cart; onProceed: () => void }) => {
  const priceBreakdown = PriceEstimator.estimate(cart);
  return (
    <YStack gap="$3">
      <PriceSummary
        subtotal={priceBreakdown.subtotal}
        shipping={priceBreakdown.shipping}
        tax={priceBreakdown.tax}
        freeShippingThreshold={1000}
        currency="INR"
      />
      <Button
        backgroundColor="$primary"
        onPress={onProceed}
        marginTop="$4"
        size="large"
        borderRadius="$3"
        icon={ShoppingBag}
      >
        <Text color="white" fontWeight="bold">
          Proceed to Checkout
        </Text>
      </Button>
    </YStack>
  );
};

/**
 * Bag screen — the aggregator's cross-retailer saved-items list.
 * Each row hands off to the merchant; direct checkout renders only
 * when the direct_shopping feature flag is enabled.
 */
export const CartScreen = () => {
  const router = useRouter();
  const user = useCurrentUser();
  const userId = user?._id ?? undefined;

  const serverCart = useCart(userId);
  const guest = useGuestCart();
  const updateQuantity = useUpdateCartQuantity();
  const removeFromCart = useRemoveFromCart();
  const { trackEvent } = useAnalytics();
  const directShopping = useDirectShoppingEnabled();

  // Unified bag: server cart if logged in, otherwise guest cart
  const cart: Cart | null = React.useMemo(() => {
    if (userId) return serverCart ?? null;
    if (guest.loading) return null;
    const items = guest.items.map((g) => ({
      productId: g.productId,
      quantity: g.quantity,
      price: g.price,
      selectedAttributes: g.attributes,
    }));
    return {
      userId: 'guest',
      items,
      currency: 'INR',
      subtotal: 0,
      discountTotal: 0,
      estimatedTax: 0,
      total: 0,
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
                <YStack key={item.productId}>
                  <CartItemComponent
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
                  <MerchantButton productId={item.productId} />
                </YStack>
              );
            })}
          </YStack>

          {directShopping === true && cart ? (
            <DirectCheckoutSection cart={cart} onProceed={handleProceedToCheckout} />
          ) : null}

          {!userId ? (
            <Text fontSize="$2" color="$textSecondary" textAlign="center" marginTop="$2">
              Sign in to save your bag across devices
            </Text>
          ) : null}
        </YStack>
      </ScrollView>
    </YStack>
  );
};

export default CartScreen;
