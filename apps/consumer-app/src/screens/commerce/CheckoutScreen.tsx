import { PriceEstimator, EventRepository } from '@app/core';
import {
  useCurrentUser,
  useCart,
  useAddresses,
  useDefaultAddress,
  useCreateAddress,
  usePlaceOrder,
  useProductsByIds,
  createEventRepositoryLayer,
} from '@app/infrastructure';
import { ConvexClient, useConvexClient } from '@app/infrastructure';
import { Button } from '@app/ui-kit';
import { AddressForm, type Address as FormAddress } from '@app/ui-kit/components/AddressForm';
import PriceSummary from '@app/ui-kit/components/PriceSummary';
import { CheckCircle, CreditCard, MapPin, Truck, Wallet } from '@tamagui/lucide-icons';
import { Effect } from 'effect';
import { useRouter } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { YStack, Text, XStack, ScrollView, Separator } from 'tamagui';

type CheckoutStep = 'ADDRESS' | 'SHIPPING' | 'PAYMENT' | 'CONFIRMATION';

export const CheckoutScreen = () => {
  const router = useRouter();
  const convex = useConvexClient();
  const [step, setStep] = useState<CheckoutStep>('ADDRESS');
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);
  const [pendingAddress, setPendingAddress] = useState<FormAddress | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<'COD' | 'RAZORPAY'>('COD');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [orderId, setOrderId] = useState<string | null>(null);
  const [orderNumber, setOrderNumber] = useState<string | null>(null);
  const [showNewForm, setShowNewForm] = useState<boolean>(false);

  const user = useCurrentUser();
  const userId = user?._id ?? undefined;

  const cart = useCart(userId);
  const addresses = useAddresses(userId);
  const defaultAddress = useDefaultAddress(userId);
  const createAddress = useCreateAddress();
  const placeOrder = usePlaceOrder();

  const productIds = useMemo(() => cart?.items.map((i) => i.productId) ?? [], [cart?.items]);
  const products = useProductsByIds(productIds);

  const priceBreakdown = useMemo(() => (cart ? PriceEstimator.estimate(cart) : null), [cart]);

  const resolvedAddress = useMemo((): FormAddress | null => {
    if (pendingAddress) return pendingAddress;
    if (selectedAddressId && addresses) {
      const found = addresses.find((a: { _id: string }) => a._id === selectedAddressId) as unknown as Record<string, unknown> | undefined;
      if (found) {
        const f = found as { fullName: string; phone: string; line1: string; line2?: string; city: string; state: string; pincode: string; country: string; isDefault: boolean };
        return {
          fullName: f.fullName,
          street: f.line1,
          line2: f.line2,
          city: f.city,
          state: f.state,
          zipCode: f.pincode,
          pincode: f.pincode,
          phone: f.phone,
          country: f.country,
          isDefault: f.isDefault,
        };
      }
    }
    if (defaultAddress) {
      const d = defaultAddress as unknown as { fullName: string; phone: string; line1: string; line2?: string; city: string; state: string; pincode: string; country: string; isDefault: boolean };
      return {
        fullName: d.fullName,
        street: d.line1,
        line2: d.line2,
        city: d.city,
        state: d.state,
        zipCode: d.pincode,
        pincode: d.pincode,
        phone: d.phone,
        country: d.country,
        isDefault: d.isDefault,
      };
    }
    return null;
  }, [pendingAddress, selectedAddressId, addresses, defaultAddress]);

  const shippingAddressForOrder = useMemo(() => {
    const a = resolvedAddress;
    if (!a) return null;
    return {
      name: a.fullName,
      line1: a.street,
      line2: a.line2,
      city: a.city,
      state: a.state,
      postalCode: a.pincode || a.zipCode,
      country: a.country || 'India',
      phone: a.phone,
    };
  }, [resolvedAddress]);

  const handleAddressSubmit = async (addr: FormAddress) => {
    if (!userId) return;
    try {
      const id = await createAddress({
        userId,
        fullName: addr.fullName,
        phone: addr.phone,
        line1: addr.street,
        line2: addr.line2,
        city: addr.city,
        state: addr.state,
        pincode: addr.pincode || addr.zipCode,
        country: addr.country,
        isDefault: addr.isDefault,
      });
      setSelectedAddressId(id as string);
      setPendingAddress(addr);
      setShowNewForm(false);
      setStep('SHIPPING');
    } catch (e) {
      console.error('Failed to save address', e);
    }
  };

  const handleSelectAddress = (id: string) => {
    setSelectedAddressId(id);
    setPendingAddress(null);
  };

  const handlePlaceOrder = async () => {
    if (!shippingAddressForOrder || !userId || !cart || !priceBreakdown) return;
    setIsProcessing(true);
    try {
      const items = cart.items.map((ci) => {
        const prod = products?.find((p: { _id: string }) => p._id === ci.productId) as unknown as { brand?: string; title?: string; images?: string[] } | undefined;
        return {
          productId: ci.productId,
          quantity: ci.quantity,
          price: ci.price,
          brand: (prod?.brand as string) ?? String(ci.selectedAttributes?.['brand'] ?? 'Unknown'),
          title: (prod?.title as string) ?? `Product ${ci.productId}`,
          image: prod?.images?.[0] ?? 'https://placehold.co/100x100',
          attributes: ci.selectedAttributes,
        };
      });

      const pricing = {
        subtotal: priceBreakdown.subtotal,
        shippingCost: priceBreakdown.shipping,
        discountAmount: priceBreakdown.discount,
        tax: priceBreakdown.tax,
        totalAmount: priceBreakdown.total,
      };

      // Persist order via convex orders API (real orders)
      const newId = await placeOrder({
        userId,
        items,
        pricing,
        deliveryAddress: shippingAddressForOrder,
        paymentMethod,
      });

      // Analytics event wired to Order domain via CheckoutService concept
      const eventLayer = createEventRepositoryLayer(convex as unknown as ConvexClient);
      await Effect.runPromise(
        Effect.gen(function* (_) {
          const repo = yield* _(EventRepository);
          return yield* _(
            repo.create({
              type: 'checkout_initiated',
              userId,
              timestamp: Date.now(),
              isSampled: true,
              metadata: {
                cartItems: cart.items.length,
                total: priceBreakdown.total,
                address: shippingAddressForOrder,
                paymentMethod,
              },
            })
          );
        }).pipe(Effect.provide(eventLayer))
      ).catch((err) => console.error('analytics failed', err));

      setOrderId(newId as unknown as string);
      setOrderNumber(newId as unknown as string);
      setStep('CONFIRMATION');
    } catch (e) {
      console.error('Checkout failed', e);
    } finally {
      setIsProcessing(false);
    }
  };

  const renderStepIndicator = () => (
    <XStack justifyContent="center" gap="$3" marginBottom="$6">
      {(['ADDRESS', 'SHIPPING', 'PAYMENT', 'CONFIRMATION'] as CheckoutStep[]).map((s) => {
        const active = step === s;
        const past = ['ADDRESS', 'SHIPPING', 'PAYMENT', 'CONFIRMATION'].indexOf(step) > ['ADDRESS', 'SHIPPING', 'PAYMENT', 'CONFIRMATION'].indexOf(s);
        const Icon = s === 'ADDRESS' ? MapPin : s === 'SHIPPING' ? Truck : s === 'PAYMENT' ? CreditCard : CheckCircle;
        return (
          <YStack key={s} alignItems="center" opacity={active || past ? 1 : 0.4}>
            <Icon size={20} color={active ? '$primary' : past ? '$success' : '$textSecondary'} />
            <Text fontSize="$1" textTransform="uppercase" fontWeight={active ? '700' : '400'}>
              {s}
            </Text>
          </YStack>
        );
      })}
    </XStack>
  );

  if (!userId) {
    return (
      <YStack flex={1} alignItems="center" justifyContent="center" padding="$4" gap="$3">
        <Text fontSize="$5" fontWeight="600">Sign in to checkout</Text>
        <Text color="$textSecondary" textAlign="center">Please sign in to place your order securely.</Text>
        <Button backgroundColor="$primary" onPress={() => router.push('/(auth)')}>Sign In</Button>
      </YStack>
    );
  }

  if (!cart) {
    return (
      <YStack flex={1} alignItems="center" justifyContent="center" padding="$4">
        <Text>Loading cart...</Text>
      </YStack>
    );
  }

  if (cart.items.length === 0 && step !== 'CONFIRMATION') {
    return (
      <YStack flex={1} alignItems="center" justifyContent="center" padding="$4" gap="$3">
        <Text fontSize="$5" fontWeight="600">Your cart is empty</Text>
        <Button backgroundColor="$primary" onPress={() => router.push('/(app)/(tabs)/cart')}>Go to Bag</Button>
      </YStack>
    );
  }

  if (step === 'CONFIRMATION') {
    return (
      <YStack flex={1} backgroundColor="$background" alignItems="center" justifyContent="center" padding="$4">
        <CheckCircle size={64} color="$success" />
        <Text fontSize="$6" fontWeight="bold" marginTop="$4">Order Placed!</Text>
        <Text fontSize="$4" color="$textSecondary" textAlign="center" marginTop="$2">
          {orderNumber ? `Your order ${orderNumber}` : `Order ${orderId ?? ''}`} has been placed successfully.
        </Text>
        <Text fontSize="$2" color="$textSecondary" marginTop="$1" textAlign="center">
          Payment: {paymentMethod === 'COD' ? 'Cash on Delivery' : 'Razorpay (Pending)'} • Tracking will be updated soon.
        </Text>
        <Button marginTop="$6" backgroundColor="$primary" onPress={() => router.push('/(app)/orders')}>
          View Orders
        </Button>
        <Button marginTop="$3" chromeless onPress={() => router.push('/(app)/(tabs)/discover')}>
          Continue Shopping
        </Button>
      </YStack>
    );
  }

  return (
    <ScrollView backgroundColor="$background" contentContainerStyle={{ padding: 20 }}>
      {renderStepIndicator()}

      {step === 'ADDRESS' && (
        <YStack gap="$4">
          <Text fontSize="$5" fontWeight="bold">Shipping Address</Text>

          {addresses && addresses.length > 0 ? (
            <YStack gap="$3">
              {addresses.map((addr: unknown) => {
                const a = addr as unknown as { _id: string; fullName: string; line1: string; city: string; state: string; pincode: string; isDefault: boolean; phone: string };
                const isSelected = selectedAddressId ? selectedAddressId === a._id : defaultAddress && (defaultAddress as unknown as { _id: string })._id === a._id;
                return (
                  <YStack
                    key={a._id}
                    borderWidth={2}
                    borderColor={isSelected ? '$primary' : '$borderColor'}
                    backgroundColor="$surface"
                    padding="$3"
                    borderRadius="$3"
                    pressStyle={{ scale: 0.98 }}
                    onPress={() => handleSelectAddress(a._id)}
                  >
                    <XStack justifyContent="space-between" alignItems="center">
                      <Text fontWeight="600">{a.fullName}</Text>
                      {a.isDefault ? <Text fontSize="$1" backgroundColor="$primary" color="white" paddingHorizontal="$2" paddingVertical="$1" borderRadius="$2">DEFAULT</Text> : null}
                    </XStack>
                    <Text fontSize="$3" color="$textSecondary">{a.line1}, {a.city}, {a.state} - {a.pincode}</Text>
                    <Text fontSize="$2" color="$textSecondary">{a.phone}</Text>
                  </YStack>
                );
              })}

              <Button
                backgroundColor={resolvedAddress ? '$primary' : '$borderColor'}
                disabled={!resolvedAddress}
                opacity={!resolvedAddress ? 0.5 : 1}
                onPress={() => setStep('SHIPPING')}
              >
                <Text color="white" fontWeight="600">Deliver Here</Text>
              </Button>

              <Separator marginVertical="$2" />

              {!showNewForm ? (
                <Button variant="outlined" onPress={() => setShowNewForm(true)}>+ Add New Address</Button>
              ) : (
                <YStack gap="$2">
                  <Text fontSize="$3" fontWeight="600">Add New Address</Text>
                  <AddressForm onSubmit={handleAddressSubmit} submitLabel="Save & Deliver Here" />
                  <Button chromeless onPress={() => setShowNewForm(false)}><Text color="$textSecondary">Cancel</Text></Button>
                </YStack>
              )}
            </YStack>
          ) : (
            <YStack gap="$2">
              <Text color="$textSecondary" fontSize="$3">No saved addresses. Add one to continue.</Text>
              <AddressForm onSubmit={handleAddressSubmit} />
            </YStack>
          )}
        </YStack>
      )}

      {step === 'SHIPPING' && (
        <YStack gap="$4">
          <Text fontSize="$5" fontWeight="bold">Shipping</Text>

          <YStack backgroundColor="$surface" padding="$4" borderRadius="$3" borderWidth={1} borderColor="$borderColor" gap="$2">
            <Text fontWeight="600">Deliver to:</Text>
            <Text fontSize="$3" color="$textSecondary">
              {resolvedAddress?.fullName}, {resolvedAddress?.street}, {resolvedAddress?.city}, {resolvedAddress?.state} - {resolvedAddress?.pincode}
            </Text>
            <Text fontSize="$2" color="$textSecondary">Phone: {resolvedAddress?.phone}</Text>
            <Text fontSize="$2" color="$success">✓ Pincode {resolvedAddress?.pincode} serviceable</Text>
          </YStack>

          {priceBreakdown && (
            <PriceSummary
              subtotal={priceBreakdown.subtotal}
              shipping={priceBreakdown.shipping}
              tax={priceBreakdown.tax}
              freeShippingThreshold={1000}
              currency="INR"
            />
          )}

          <Text fontSize="$2" color="$textSecondary">Estimated delivery 3-5 days • Free shipping over ₹1000</Text>

          <Button backgroundColor="$primary" onPress={() => setStep('PAYMENT')}>
            <Text color="white" fontWeight="600">Continue to Payment</Text>
          </Button>
          <Button chromeless onPress={() => setStep('ADDRESS')}><Text color="$textSecondary">Back to Address</Text></Button>
        </YStack>
      )}

      {step === 'PAYMENT' && (
        <YStack gap="$4">
          <Text fontSize="$5" fontWeight="bold">Payment Method</Text>

          <YStack
            backgroundColor="$surface"
            padding="$4"
            borderRadius="$3"
            borderWidth={paymentMethod === 'COD' ? 2 : 1}
            borderColor={paymentMethod === 'COD' ? '$primary' : '$borderColor'}
            pressStyle={{ scale: 0.98 }}
            onPress={() => setPaymentMethod('COD')}
          >
            <XStack gap="$3" alignItems="center">
              <Wallet size={22} color={paymentMethod === 'COD' ? '$primary' : '$textSecondary'} />
              <YStack>
                <Text fontWeight="600">Cash on Delivery</Text>
                <Text fontSize="$3" color="$textSecondary">Pay when you receive</Text>
              </YStack>
              <YStack flex={1} alignItems="flex-end">
                <Text fontSize="$2" color={paymentMethod === 'COD' ? '$primary' : '$textSecondary'}>{paymentMethod === 'COD' ? '● Selected' : '○'}</Text>
              </YStack>
            </XStack>
          </YStack>

          <YStack
            backgroundColor="$surface"
            padding="$4"
            borderRadius="$3"
            borderWidth={paymentMethod === 'RAZORPAY' ? 2 : 1}
            borderColor={paymentMethod === 'RAZORPAY' ? '$primary' : '$borderColor'}
            opacity={0.95}
            pressStyle={{ scale: 0.98 }}
            onPress={() => setPaymentMethod('RAZORPAY')}
          >
            <XStack gap="$3" alignItems="center">
              <CreditCard size={22} color={paymentMethod === 'RAZORPAY' ? '$primary' : '$textSecondary'} />
              <YStack flex={1}>
                <Text fontWeight="600">Razorpay (UPI / Card / Netbanking)</Text>
                <Text fontSize="$3" color="$textSecondary">Placeholder — will redirect to Razorpay checkout</Text>
                <Text fontSize="$1" color="$warning">MVP: order created as pending, payment via webhook</Text>
              </YStack>
              <Text fontSize="$2" color={paymentMethod === 'RAZORPAY' ? '$primary' : '$textSecondary'}>{paymentMethod === 'RAZORPAY' ? '● Selected' : '○'}</Text>
            </XStack>
          </YStack>

          <Text color="$textSecondary" fontSize="$3">Shipping to: {resolvedAddress?.fullName}, {resolvedAddress?.city} • {resolvedAddress?.pincode}</Text>

          {priceBreakdown && (
            <Text fontWeight="600" fontSize="$4">Total Payable: ₹{priceBreakdown.total}</Text>
          )}

          <Button backgroundColor="$primary" onPress={handlePlaceOrder} disabled={isProcessing} opacity={isProcessing ? 0.7 : 1}>
            <Text color="white" fontWeight="600">{isProcessing ? 'Placing Order...' : `Place Order • ${paymentMethod === 'COD' ? 'COD' : 'Razorpay'}`}</Text>
          </Button>

          <Button chromeless onPress={() => setStep('SHIPPING')} disabled={isProcessing}><Text color="$textSecondary">Back to Shipping</Text></Button>
        </YStack>
      )}
    </ScrollView>
  );
};

export default CheckoutScreen;
