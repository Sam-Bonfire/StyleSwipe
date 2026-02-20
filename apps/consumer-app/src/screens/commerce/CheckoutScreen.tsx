import { Address, PriceEstimator } from '@app/core';
import { useCurrentUser, useCart, useClearCart, ConvexEventRepository } from '@app/infrastructure';
import { ConvexClient, useConvexClient } from '@app/infrastructure';
import { Button } from '@app/ui-kit';
import { AddressForm } from '@app/ui-kit/components/AddressForm';
import { CheckCircle, CreditCard, MapPin } from '@tamagui/lucide-icons';
import React, { useState, useMemo } from 'react';
import { YStack, Text, XStack, ScrollView } from 'tamagui';



// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const CheckoutScreen = ({ navigation }: any) => {
  const convex = useConvexClient();
  const [step, setStep] = useState<'ADDRESS' | 'PAYMENT' | 'CONFIRMATION'>('ADDRESS');
  const [address, setAddress] = useState<Address | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [orderId, setOrderId] = useState<string | null>(null);

  const user = useCurrentUser();
  const userId = user?._id ?? undefined;

  const cart = useCart(userId);
  const clearCart = useClearCart();

  const eventRepo = useMemo(() => {
    return new ConvexEventRepository(convex as unknown as ConvexClient);
  }, [convex]);

  const handleAddressSubmit = (addr: Address) => {
    setAddress(addr);
    setStep('PAYMENT');
  };

  const handlePlaceOrder = async () => {
    if (!address || !userId) return;
    setIsProcessing(true);
    try {
      // 1. Get current cart (already have it via hook!)
      if (!cart) throw new Error('No cart found');

      // 2. Log Checkout Event (replacing Order creation)
      await eventRepo.create({
        type: 'checkout_initiated',
        userId: userId,
        timestamp: Date.now(),
        isSampled: true,
        metadata: {
          cartItems: cart.items.length,
          total: PriceEstimator.estimate(cart).total,
          address,
        },
      });

      // 3. Generate a fake Order ID for display
      const newOrderId = `ORD-${Date.now()}`;
      setOrderId(newOrderId);

      // 4. Clear cart
      await clearCart(userId);

      setStep('CONFIRMATION');
    } catch (e) {
      console.error('Checkout failed', e);
      // Show error toast
    } finally {
      setIsProcessing(false);
    }
  };

  const renderStepIndicator = () => (
    <XStack justifyContent="center" gap="$4" marginBottom="$6">
      <YStack alignItems="center" opacity={step === 'ADDRESS' ? 1 : 0.5}>
        <MapPin size={24} color={step === 'ADDRESS' ? '$primary' : '$textSecondary'} />
        <Text fontSize="$2">Address</Text>
      </YStack>
      <YStack alignItems="center" opacity={step === 'PAYMENT' ? 1 : 0.5}>
        <CreditCard size={24} color={step === 'PAYMENT' ? '$primary' : '$textSecondary'} />
        <Text fontSize="$2">Payment</Text>
      </YStack>
      <YStack alignItems="center" opacity={step === 'CONFIRMATION' ? 1 : 0.5}>
        <CheckCircle size={24} color={step === 'CONFIRMATION' ? '$success' : '$textSecondary'} />
        <Text fontSize="$2">Done</Text>
      </YStack>
    </XStack>
  );

  if (step === 'CONFIRMATION') {
    return (
      <YStack
        flex={1}
        backgroundColor="$background"
        alignItems="center"
        justifyContent="center"
        padding="$4"
      >
        <CheckCircle size={64} color="$success" />
        <Text fontSize="$6" fontWeight="bold" marginTop="$4">
          Order Placed!
        </Text>
        <Text fontSize="$4" color="$textSecondary" textAlign="center" marginTop="$2">
          Your order #{orderId} has been successfully placed.
        </Text>
        <Button
          marginTop="$6"
          backgroundColor="$primary"
          color="white"
          onPress={() => navigation.navigate('Discovery')}
        >
          Continue Shopping
        </Button>
      </YStack>
    );
  }

  return (
    <ScrollView backgroundColor="$background" contentContainerStyle={{ padding: 20 }}>
      {renderStepIndicator()}

      {step === 'ADDRESS' && (
        <YStack>
          <Text fontSize="$5" fontWeight="bold" marginBottom="$4">
            Shipping Address
          </Text>
          <AddressForm onSubmit={handleAddressSubmit} />
        </YStack>
      )}

      {step === 'PAYMENT' && (
        <YStack gap="$4">
          <Text fontSize="$5" fontWeight="bold">
            Payment Method
          </Text>

          <YStack
            backgroundColor="$surface"
            padding="$4"
            borderRadius="$3"
            borderWidth={1}
            borderColor="$primary"
          >
            <XStack gap="$3" alignItems="center">
              <CreditCard size={24} color="$primary" />
              <YStack>
                <Text fontWeight="600">Cash on Delivery</Text>
                <Text fontSize="$3" color="$textSecondary">
                  Pay when you receive
                </Text>
              </YStack>
            </XStack>
          </YStack>

          {/* Mock Summary Reuse or simple text */}
          <Text color="$textSecondary" fontSize="$3">
            Shipping to: {address?.fullName}, {address?.city}
          </Text>

          <Button
            backgroundColor="$primary"
            onPress={handlePlaceOrder}
            disabled={isProcessing}
            opacity={isProcessing ? 0.7 : 1}
          >
            <Text color="white" fontWeight="600">
              {isProcessing ? 'Processing...' : 'Place Order'}
            </Text>
          </Button>

          <Button chromeless onPress={() => setStep('ADDRESS')} disabled={isProcessing}>
            <Text color="$textSecondary">Back to Address</Text>
          </Button>
        </YStack>
      )}
    </ScrollView>
  );
};

export default CheckoutScreen;
