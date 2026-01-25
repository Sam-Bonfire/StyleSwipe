import { ManageCart, CartItem } from '@app/core';
import { ConvexCartRepository } from '@app/infrastructure/src/commerce/ConvexCartRepository';
import { ImageGallery } from '@app/ui-kit/components/ImageGallery';
import { TransactionalFooter } from '@app/ui-kit/components/TransactionalFooter';
import { useRoute, useNavigation } from '@react-navigation/native';
import { ConvexClient } from 'convex/browser';
import { useConvex } from 'convex/react';
import React, { useState, useMemo } from 'react';
import { YStack, ScrollView, Text, XStack, Separator, Spacer } from 'tamagui';

export function ProductDetailScreen() {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const route = useRoute<any>();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const navigation = useNavigation<any>();
    const { productId } = route?.params || { productId: 'prod-1' }; // Mock param
    const convex = useConvex();
    const [isAdded, setIsAdded] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    // TODO: Ideally use a ProductRepository to fetch details. Mocking for now.
    const product = {
        id: productId,
        brand: 'Urban Monkey',
        title: 'Streetwear Oversized T-Shirt',
        price: 1499,
        originalPrice: 2499,
        description: 'Premium cotton oversized t-shirt with graphic print. Perfect for casual streetwear look.',
        images: [
            'https://placehold.co/400x500/png?text=Front',
            'https://placehold.co/400x500/png?text=Back',
            'https://placehold.co/400x500/png?text=Detail'
        ],
        attributes: {
            material: '100% Cotton',
            fit: 'Oversized',
            care: 'Machine Wash'
        }
    };

    const manageCart = useMemo(() => {
        const repo = new ConvexCartRepository(convex as unknown as ConvexClient);
        return new ManageCart(repo);
    }, [convex]);

    const handleAddToCart = async () => {
        if (isAdded) {
            navigation.navigate('Cart');
            return;
        }

        setIsLoading(true);
        try {
            const item = new CartItem(
                product.id,
                1,
                product.price,
                {
                    brand: product.brand,
                    size: 'M', // Default for now
                    color: 'Black'
                }
            );
            await manageCart.addToCart("user-1", item);
            setIsAdded(true);
        } catch (e) {
            console.error("Failed to add to cart", e);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <YStack flex={1} backgroundColor="$background">
            <ScrollView contentContainerStyle={{ paddingBottom: 100 }}>
                {/* Image Gallery */}
                <ImageGallery images={product.images} />

                <YStack padding="$4" gap="$2">
                    {/* Brand & Title */}
                    <Text fontSize="$3" color="$textSecondary" fontWeight="600" textTransform="uppercase">
                        {product.brand}
                    </Text>
                    <Text fontSize="$6" color="$textPrimary" fontWeight="700" lineHeight="$6">
                        {product.title}
                    </Text>

                    {/* Price & Discount */}
                    <XStack alignItems="baseline" gap="$2" marginTop="$1">
                        <Text fontSize="$6" color="$textPrimary" fontWeight="600">
                            ₹{product.price}
                        </Text>
                        <Text fontSize="$4" color="$textTertiary" textDecorationLine="line-through">
                            ₹{product.originalPrice}
                        </Text>
                        <Text fontSize="$4" color="$success" fontWeight="600">
                            {Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)}% OFF
                        </Text>
                    </XStack>

                    <Separator marginVertical="$4" borderColor="$borderColor" />

                    {/* Description */}
                    <Text fontSize="$4" fontWeight="600" marginBottom="$2">Description</Text>
                    <Text fontSize="$3" color="$textSecondary" lineHeight="$5">
                        {product.description}
                    </Text>

                    <Spacer size="$4" />

                    {/* Product Details */}
                    <Text fontSize="$4" fontWeight="600" marginBottom="$2">Product Details</Text>
                    <YStack gap="$1">
                        {Object.entries(product.attributes).map(([key, value]) => (
                            <XStack key={key} justifyContent="space-between">
                                <Text fontSize="$3" color="$textSecondary" textTransform="capitalize">{key}</Text>
                                <Text fontSize="$3" color="$textPrimary" fontWeight="500">{value}</Text>
                            </XStack>
                        ))}
                    </YStack>
                </YStack>
            </ScrollView>

            {/* Sticky Action Footer */}
            <TransactionalFooter
                price={product.price}
                onAddToCart={handleAddToCart}
                isAdded={isAdded}
                isLoading={isLoading}
            />
        </YStack>
    );
};

export default ProductDetailScreen;
