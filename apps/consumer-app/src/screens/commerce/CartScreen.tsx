import { PriceEstimator } from '@app/core';
import {
  useCurrentUser,
  useCart,
  useUpdateCartQuantity,
  useRemoveFromCart,
  useTrackPurchaseClick,
  useProductsByIds,
  useAnalytics,
} from '@app/infrastructure';
import { Button } from '@app/ui-kit';
import CartItemComponent from '@app/ui-kit/components/CartItem';
import PriceSummary from '@app/ui-kit/components/PriceSummary';
import { ExternalLink, ShoppingBag } from '@tamagui/lucide-icons';
import React, { useState } from 'react';
import { Linking } from 'react-native';
import { YStack, ScrollView, Text, Sheet, XStack, Image, Separator } from 'tamagui';

export const CartScreen = () => {
  const [modalOpen, setModalOpen] = useState(false);

  const user = useCurrentUser();
  const userId = user?._id ?? undefined;

  const cart = useCart(userId);
  const updateQuantity = useUpdateCartQuantity();
  const removeFromCart = useRemoveFromCart();
  const trackPurchaseClick = useTrackPurchaseClick();
  const { trackEvent } = useAnalytics();

  // Fetch full product items to display real images and fetch original checkout links
  const productIds = React.useMemo(() => cart?.items.map((i) => i.productId) ?? [], [cart?.items]);
  const productsDocs = useProductsByIds(productIds);

  const productMap = React.useMemo(() => {
    if (!productsDocs) return new Map();
    return new Map(productsDocs.map((p) => [p._id, p]));
  }, [productsDocs]);

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

  const handleRedirect = async (productId: string, originalUrl?: string) => {
    if (!userId) return;
    try {
      await trackPurchaseClick(userId, productId);
      trackEvent('checkout_initiated', undefined, { variant: 'macro_v1', productId });
      
      if (originalUrl) {
        await Linking.openURL(originalUrl);
      }
    } catch (err) {
      console.error('Error handling external checkout redirect:', err);
    } finally {
      if (cart && cart.items.length <= 1) {
        setModalOpen(false);
      }
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
              const brand = product?.brand || item.attributes?.['brand'] || 'Brand';
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
                  size={item.attributes?.['size']}
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
            onPress={() => setModalOpen(true)}
            marginTop="$4"
            size="large"
            borderRadius="$3"
            icon={ShoppingBag}
          >
            <Text color="white" fontWeight="bold">
              Proceed to Buy
            </Text>
          </Button>
        </YStack>
      </ScrollView>

      {/* Modern Dialog Bottom Sheet for Sourced Items */}
      <Sheet
        modal
        open={modalOpen}
        onOpenChange={setModalOpen}
        dismissOnSnapToBottom
        snapPoints={[65]}
              >
        <Sheet.Overlay backgroundColor="rgba(0,0,0,0.5)" />
        <Sheet.Frame backgroundColor="$background" borderTopLeftRadius="$5" borderTopRightRadius="$5">
          <Sheet.Handle backgroundColor="$borderColor" height={5} width={40} marginVertical="$3" alignSelf="center" />
          <YStack flex={1} padding="$4" gap="$4">
            <YStack gap="$1" alignItems="center">
              <Text fontSize="$5" fontWeight="bold" textAlign="center" color="$textPrimary">
                Purchase from Original Store
              </Text>
              <Text fontSize="$2" color="$textSecondary" textAlign="center" paddingHorizontal="$2">
                Since we do not process checkouts directly for external platforms, you will be redirected to complete your purchase.
              </Text>
            </YStack>

            <Separator borderColor="$borderColor" />

            <ScrollView flex={1}>
              <YStack gap="$3">
                {cart.items.map((item) => {
                  const product = productMap.get(item.productId);
                  if (!product) return null;

                  const imageUrl = product.images?.[0] || 'https://placehold.co/80x100';
                  const title = product.title;
                  const brand = product.brand;
                  const originalUrl = product.meta?.originalUrl || product.meta?.url || '';

                  const platform = originalUrl.toLowerCase().includes('myntra')
                    ? 'Myntra'
                    : originalUrl.toLowerCase().includes('ajio')
                    ? 'Ajio'
                    : 'Original Store';

                  return (
                    <YStack
                      key={item.productId}
                      backgroundColor="$surface"
                      padding="$3"
                      borderRadius="$3"
                      gap="$3"
                      borderWidth={1}
                      borderColor="$borderColor"
                    >
                      <XStack gap="$3" alignItems="center">
                        <Image source={{ uri: imageUrl }} width={60} height={75} borderRadius="$2" resizeMode="cover" />
                        <YStack flex={1} gap="$1">
                          <Text fontSize="$2" fontWeight="600" textTransform="uppercase" color="$textPrimary">
                            {brand}
                          </Text>
                          <Text fontSize="$3" numberOfLines={2} color="$textSecondary">
                            {title}
                          </Text>
                          <Text fontSize="$3" fontWeight="bold" color="$primary">
                            {new Intl.NumberFormat('en-IN', {
                              style: 'currency',
                              currency: 'INR',
                              minimumFractionDigits: 0,
                              maximumFractionDigits: 0,
                            }).format(item.price)}
                          </Text>
                        </YStack>
                      </XStack>

                      <Button
                        backgroundColor="$primary"
                        size="small"
                        borderRadius="$2"
                        onPress={() => handleRedirect(item.productId, originalUrl)}
                        icon={ExternalLink}
                        width="100%"
                      >
                        <Text color="white" fontWeight="600" fontSize="$2">
                          Buy on {platform}
                        </Text>
                      </Button>
                    </YStack>
                  );
                })}
              </YStack>
            </ScrollView>
          </YStack>
        </Sheet.Frame>
      </Sheet>
    </YStack>
  );
};

export default CartScreen;
