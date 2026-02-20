import { PriceEstimator } from '@app/core';
import { useCurrentUser, useCart, useUpdateCartQuantity, useRemoveFromCart } from '@app/infrastructure';
import CartItemComponent from '@app/ui-kit/components/CartItem';
import PriceSummary from '@app/ui-kit/components/PriceSummary';
import React from 'react';
import { YStack, ScrollView, Text } from 'tamagui';

export const CartScreen = () => {
  const user = useCurrentUser();
  const userId = user?._id ?? undefined;

  const cart = useCart(userId);
  const updateQuantity = useUpdateCartQuantity();
  const removeFromCart = useRemoveFromCart();

  const handleUpdateQuantity = async (productId: string, quantity: number) => {
    if (!userId) return;
    try {
      await updateQuantity(userId, productId, quantity);
    } catch (e) {
      console.error('Failed to update quantity', e);
    }
  };

  const handleRemove = async (productId: string) => {
    if (!userId) return;
    try {
      await removeFromCart(userId, productId);
    } catch (e) {
      console.error('Failed to remove item', e);
    }
  };

  if (userId && cart === undefined) {
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
    <ScrollView backgroundColor="$background">
      <YStack padding="$4" gap="$4" paddingBottom="$10">
        <Text fontSize="$6" fontWeight="bold" marginBottom="$2">
          Shopping Bag ({cart.items.length})
        </Text>

        <YStack gap="$3">
          {cart.items.map((item) => (
            <CartItemComponent
              key={item.productId}
              imageUrl="https://placehold.co/100x120" // Placeholder
              brand={item.attributes['brand'] || 'Brand'}
              title={`Product ${item.productId}`} // Placeholder
              price={item.price}
              quantity={item.quantity}
              currency="INR"
              size={item.attributes['size']}
              onQuantityChange={(qty) => handleUpdateQuantity(item.productId, qty)}
              onRemove={() => handleRemove(item.productId)}
            />
          ))}
        </YStack>

        <PriceSummary
          subtotal={priceBreakdown.subtotal}
          shipping={priceBreakdown.shipping}
          tax={priceBreakdown.tax}
          freeShippingThreshold={1000}
          currency="INR"
        />
      </YStack>
    </ScrollView>
  );
};

export default CartScreen;
