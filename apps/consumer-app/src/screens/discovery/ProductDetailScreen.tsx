
import { ManageCart, CartItem } from '@app/core';
import { ConvexCartRepository } from '@app/infrastructure/src/commerce/ConvexCartRepository';
import { TopBarIconButton, RatingStars, SizeChipGroup, SizeField, Toast } from '@app/ui-kit';
import { ImageGallery } from '@app/ui-kit/components/ImageGallery';
import { TransactionalFooter } from '@app/ui-kit/components/TransactionalFooter';
import { useNavigation, useRoute } from '@react-navigation/native';
import { ChevronLeft } from '@tamagui/lucide-icons';
import { ConvexClient } from 'convex/browser';
import { useConvex } from 'convex/react';
import React, { useMemo, useState } from 'react';
import { ScrollView, View, useWindowDimensions } from 'react-native';
import { Separator, Spacer, Text, YStack, XStack, Stack, useTheme } from 'tamagui';

// COMPLETE REWRITE OF COMPONENT TO FIX SCROLL ISSUES
export function ProductDetailScreen() {
    // -------------------------------------------------------------------------
    // 1. Hooks & State
    // -------------------------------------------------------------------------
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const route = useRoute<any>();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const navigation = useNavigation<any>();
    const theme = useTheme();
    const convex = useConvex();
    const { height: windowHeight } = useWindowDimensions();

    const { productId } = route?.params || { productId: 'prod-1' };
    const [selectedSizes, setSelectedSizes] = useState<Record<string, string[]>>({});
    const [showSizeError, setShowSizeError] = useState(false);
    const [isAdded, setIsAdded] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    // -------------------------------------------------------------------------
    // 2. Data (Mock)
    // -------------------------------------------------------------------------
    const product = {
        id: productId,
        brand: 'Urban Monkey',
        title: 'Streetwear Oversized T-Shirt',
        price: 1499,
        originalPrice: 2499,
        description: 'Elevate your streetwear game with this premium cotton oversized t-shirt. Designed for the modern urban explorer, it features a heavy-weight fabric that drapes perfectly for a relaxed, boxy fit. \n\nThe graphic print is high-quality puff print that won\'t crack after washing. Whether you are skating, hanging out with friends, or just lounging, this tee delivers unmatched comfort and style. \n\nPair it with baggy jeans or cargos for the ultimate compassionate look. Available in multiple colors to match your vibe.',
        rating: 4.5,
        reviewCount: 128,
        platform: 'Urban Monkey Official',
        images: [
            'https://placehold.co/400x500/png?text=Front',
            'https://placehold.co/400x500/png?text=Back',
            'https://placehold.co/400x500/png?text=Detail',
            'https://placehold.co/400x500/png?text=Lifestyle'
        ],
        availableSizes: ['S', 'M', 'L', 'XL', 'XXL'],
        attributes: {
            material: '100% Heavyweight Cotton (240 GSM)',
            fit: 'Oversized / Boxy Fit',
            care: 'Machine Wash Cold, Do Not Tumble Dry',
            origin: 'Made in India',
            style: 'Streetwear / Graphic',
            sleeve: 'Drop Shoulder',
            neck: 'Ribbed Crew Neck',
            season: 'All Season',
            collection: 'Urban Explorer 2024'
        }
    };

    // -------------------------------------------------------------------------
    // 3. Logic
    // -------------------------------------------------------------------------
    const manageCart = useMemo(() => {
        const repo = new ConvexCartRepository(convex as unknown as ConvexClient);
        return new ManageCart(repo);
    }, [convex]);

    const sizeField: SizeField = {
        id: 'product_size',
        label: 'Select Size',
        helperText: 'Size guide available',
        multiSelect: false,
        options: product.availableSizes.map(size => ({
            id: size,
            label: size,
        }))
    };

    const handleSizeChange = (fieldId: string, selectedIds: string[]) => {
        setSelectedSizes({ [fieldId]: selectedIds });
        setShowSizeError(false);
    };

    const handleAddToCart = async () => {
        if (isAdded) {
            navigation.navigate('Cart');
            return;
        }

        const selectedSize = selectedSizes['product_size']?.[0];

        if (!selectedSize) {
            setShowSizeError(true);
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
                    size: selectedSize,
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

    // -------------------------------------------------------------------------
    // 4. Render
    // -------------------------------------------------------------------------
    return (
        <View style={{ height: windowHeight, backgroundColor: theme.background.val }}>
            <ScrollView
                style={{ flex: 1 }}
                contentContainerStyle={{ paddingBottom: 100 }}
                showsVerticalScrollIndicator={true}
                nestedScrollEnabled={true}
            >
                {/* 1. Gallery */}
                <ImageGallery images={product.images} />

                {/* 2. Content */}
                <YStack padding="$4" gap="$2">
                    {/* Brand & Title */}
                    <Text fontSize="$3" color="$textSecondary" fontWeight="600" textTransform="uppercase">
                        {product.brand}
                    </Text>
                    <Text fontSize="$6" color="$textPrimary" fontWeight="700" lineHeight="$6">
                        {product.title}
                    </Text>

                    {/* Ratings */}
                    <XStack alignItems="center" gap="$2" marginTop="$1">
                        <RatingStars rating={product.rating} reviewCount={product.reviewCount} />
                        <Stack height={16} width={1} backgroundColor="$borderColor" />
                        <Text fontSize="$3" color="$primary" fontWeight="500">{product.platform}</Text>
                    </XStack>

                    {/* Price */}
                    <XStack alignItems="baseline" gap="$2" marginTop="$2">
                        <Text fontSize="$6" color="$textPrimary" fontWeight="600">₹{product.price}</Text>
                        <Text fontSize="$4" color="$textTertiary" textDecorationLine="line-through">₹{product.originalPrice}</Text>
                        <Text fontSize="$4" color="$success" fontWeight="600">
                            {Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)}% OFF
                        </Text>
                    </XStack>

                    <Separator marginVertical="$4" borderColor="$borderColor" />

                    {/* Size Selector */}
                    <YStack marginBottom="$4">
                        <SizeChipGroup
                            fields={[sizeField]}
                            selectedSizes={selectedSizes}
                            onSizeChange={handleSizeChange}
                        />
                        {showSizeError && (
                            <Text color="$error" fontSize="$3" marginTop="$1">Please select a size to continue</Text>
                        )}
                    </YStack>

                    <Separator marginBottom="$4" borderColor="$borderColor" />

                    {/* Description */}
                    <Text fontSize="$4" fontWeight="600" marginBottom="$2">Description</Text>
                    <Text fontSize="$3" color="$textSecondary" lineHeight="$5">
                        {product.description}
                    </Text>

                    <Spacer size="$4" />

                    {/* Attributes Grid */}
                    <Text fontSize="$4" fontWeight="600" marginBottom="$3">Product Details</Text>
                    <YStack gap="$2" flexWrap="wrap">
                        {Object.entries(product.attributes).map(([key, value]) => (
                            <XStack
                                key={key}
                                alignItems="flex-start"
                                backgroundColor="$surface"
                                padding="$3"
                                borderRadius="$3"
                                borderColor="$borderColor"
                                borderWidth={1}
                            >
                                <Stack width="35%" flexShrink={0}>
                                    <Text fontSize="$3" color="$textSecondary" textTransform="capitalize" fontWeight="500">
                                        {key}
                                    </Text>
                                </Stack>
                                <Stack flex={1} paddingLeft="$2">
                                    <Text fontSize="$3" color="$textPrimary" fontWeight="600" textAlign="right">
                                        {value}
                                    </Text>
                                </Stack>
                            </XStack>
                        ))}
                    </YStack>
                </YStack>
            </ScrollView>

            {/* 3. Floating UI: Back Button */}
            <View style={{ position: 'absolute', top: 10, left: 10, zIndex: 100 }}>
                <TopBarIconButton
                    onPress={() => navigation.goBack()}
                    backgroundColor="$background"
                    elevation="$2"
                    shadowColor="$shadowColor"
                    shadowRadius={4}
                    shadowOpacity={0.1}
                >
                    <ChevronLeft size={24} color="$textPrimary" />
                </TopBarIconButton>
            </View>

            {/* 4. Footer */}
            <TransactionalFooter
                price={product.price}
                originalPrice={product.originalPrice}
                onAddToCart={handleAddToCart}
                isAdded={isAdded}
                isLoading={isLoading}
            />
        </View>
    );
}
