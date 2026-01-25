import React, { useEffect, useState, useMemo } from 'react';
import { YStack, ScrollView, Text, View } from 'tamagui';
import { useConvex } from 'convex/react';
import CartItemComponent from '@app/ui-kit/components/CartItem';
import PriceSummary from '@app/ui-kit/components/PriceSummary';
import { Cart, ManageCart } from '@app/core';
import { ConvexCartRepository } from '@app/infrastructure/src/commerce/ConvexCartRepository';

export const CartScreen = () => {
    const convex = useConvex();
    const [cart, setCart] = useState<Cart | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    // Initialize dependencies
    const manageCart = useMemo(() => {
        const repo = new ConvexCartRepository(convex);
        return new ManageCart(repo);
    }, [convex]);

    // TODO: Integrate with Auth Provider
    const userId = "user-1";

    const loadCart = async () => {
        setIsLoading(true);
        try {
            const c = await manageCart.getCart(userId);
            setCart(c);
        } catch (e) {
            console.error("Failed to load cart", e);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        loadCart();
    }, [userId]);

    const handleUpdateQuantity = async (productId: string, quantity: number) => {
        try {
            const updated = await manageCart.updateQuantity(userId, productId, quantity);
            setCart(updated);
        } catch (e) {
            console.error("Failed to update quantity", e);
        }
    };

    const handleRemove = async (productId: string) => {
        try {
            const updated = await manageCart.removeFromCart(userId, productId);
            setCart(updated);
        } catch (e) {
            console.error("Failed to remove item", e);
        }
    };

    if (isLoading && !cart) {
        return (
            <YStack flex={1} alignItems="center" justifyContent="center">
                <Text>Loading Bag...</Text>
            </YStack>
        );
    }

    if (!cart || cart.items.length === 0) {
        return (
            <YStack flex={1} alignItems="center" justifyContent="center" padding="$4">
                <Text fontSize="$5" fontWeight="600">Your bag is empty</Text>
                <Text color="$textSecondary" marginTop="$2">Start swiping to add items!</Text>
            </YStack>
        );
    }

    return (
        <ScrollView backgroundColor="$background">
            <YStack padding="$4" gap="$4" paddingBottom="$10">
                <Text fontSize="$6" fontWeight="bold" marginBottom="$2">Shopping Bag ({cart.items.length})</Text>

                <YStack gap="$3">
                    {cart.items.map(item => (
                        <CartItemComponent
                            key={item.productId}
                            imageUrl="https://placehold.co/100x120" // Placeholder, in real app get from Catalog lookup
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
                    subtotal={cart.total}
                    shipping={100} // Simple rule for now
                    freeShippingThreshold={1000}
                    currency="INR"
                />
            </YStack>
        </ScrollView>
    );
};

export default CartScreen;
