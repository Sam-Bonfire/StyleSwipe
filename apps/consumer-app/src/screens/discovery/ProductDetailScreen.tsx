import { ManageCart, CartItem } from '@app/core';
import { ConvexCartRepository } from '@app/infrastructure/src/commerce/ConvexCartRepository';
import { TopBarIconButton, RatingStars, SizeChipGroup, SizeField, Button } from '@app/ui-kit';
import { ImageGallery } from '@app/ui-kit/components/ImageGallery';
import { TransactionalFooter } from '@app/ui-kit/components/TransactionalFooter';
import { api } from '@convex-api';
import { useNavigation, useRoute } from '@react-navigation/native';
import { ChevronLeft } from '@tamagui/lucide-icons';
import { ConvexClient } from 'convex/browser';
import { useConvex, useQuery } from 'convex/react';
import React, { useMemo, useState } from 'react';
import { ScrollView, View, useWindowDimensions, Alert } from 'react-native';
import { Separator, Spacer, Text, YStack, XStack, Stack, useTheme, Spinner } from 'tamagui';

import { Id } from '../../../../../convex/_generated/dataModel';

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

  // FETCH REAL DATA
  // We cast productId to any because navigation params are strings, but Convex expects Id<"products">
  // In a real app, we'd validate this.
  const productData = useQuery(api.products.get, { id: productId as Id<'products'> });

  const [selectedSizes, setSelectedSizes] = useState<Record<string, string[]>>({});
  const [showSizeError, setShowSizeError] = useState(false);
  const [isAdded, setIsAdded] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const manageCart = useMemo(() => {
    const repo = new ConvexCartRepository(convex as unknown as ConvexClient);
    return new ManageCart(repo);
  }, [convex]);

  // Resolved: Use api.users.currentUser to get the authenticated user
  // Must be at the top level to avoid Rules of Hooks violation
  const user = useQuery(api.users.currentUser);
  const userId = user?._id ?? undefined;

  // -------------------------------------------------------------------------
  // 2. Data Mapping
  // -------------------------------------------------------------------------

  // Loading State
  if (productData === undefined) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: theme.background.val,
        }}
      >
        <Spinner size="large" color="$primary" />
      </View>
    );
  }

  // Not Found State
  if (productData === null) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: theme.background.val,
        }}
      >
        <Text fontSize="$6" color="$textSecondary">
          Product not found
        </Text>
        <Button variant="ghost" onPress={() => navigation.goBack()} marginTop="$4">
          Go Back
        </Button>
      </View>
    );
  }

  // 3. Process Attributes
  const rawAttributes = productData.attributes || {};

  // Normalize attributes for display (flatten arrays to strings)
  const displayAttributes: Record<string, string> = Object.entries(rawAttributes).reduce(
    (acc, [key, value]) => {
      if (key === 'size') return acc; // Skip size as key, handled separately in selector
      if (typeof value === 'string' || typeof value === 'number') {
        acc[key] = String(value);
      } else if (Array.isArray(value)) {
        acc[key] = value.join(', ');
      }
      return acc;
    },
    {} as Record<string, string>,
  );

  // Ensure core fields exist for consistent UI if needed, though UI maps dynamically now.
  // We don't enforce strict shape here to allow flexibility.

  const product = {
    id: productData._id,
    brand: productData.brand,
    title: productData.title,
    price: productData.price,
    originalPrice: productData.mrp,
    description:
      productData.description || `Experience premium quality with the ${productData.title}.`,
    rating: productData.rating || 4.5,
    reviewCount: productData.reviewCount || 128,
    platform: productData.platform || 'StyleSwipe Verified',
    images:
      productData.images && productData.images.length > 0
        ? productData.images
        : ['https://placehold.co/400x500/png?text=No+Image'],
    availableSizes: Array.isArray(rawAttributes.size) ? rawAttributes.size : ['S', 'M', 'L', 'XL'],
    attributes: {
      material: 'N/A', // Defaults
      fit: 'Regular',
      ...displayAttributes,
    },
  };

  // -------------------------------------------------------------------------
  // 3. Logic
  // -------------------------------------------------------------------------
  // manageCart moved to top level hook

  const sizeField: SizeField = {
    id: 'product_size',
    label: 'Select Size',
    helperText: 'Size guide available',
    multiSelect: false,
    options: product.availableSizes.map((size) => ({
      id: size,
      label: size,
    })),
  };

  const handleSizeChange = (fieldId: string, selectedIds: string[]) => {
    setSelectedSizes({ [fieldId]: selectedIds });
    setShowSizeError(false);
  };

  // Main Logic

  const handleAddToCart = async () => {
    if (isAdded) {
      // Navigate to the Main screen and switch to the 'cart' tab to show nav bars
      navigation.navigate('Main', { activeTab: 'cart' });
      return;
    }

    const selectedSize = selectedSizes['product_size']?.[0];

    if (!selectedSize) {
      setShowSizeError(true);
      return;
    }

    // Ensure we have a user ID before adding to cart
    if (!userId) {
      // In a real app, prompt for login here.
      // For now, we return or show a toast if we had one.
      Alert.alert('Authentication Required', 'User is not authenticated. Please log in.');
      return;
    }

    setIsLoading(true);
    try {
      const item = new CartItem(product.id, 1, product.price, {
        brand: product.brand,
        size: selectedSize,
        color: 'Black',
      });
      await manageCart.addToCart(userId, item);
      setIsAdded(true);
      Alert.alert('Success', 'Added to cart!');
    } catch (e: any) {
      console.error('Failed to add to cart', e);
      Alert.alert('Error', 'Failed to add to cart: ' + e.message);
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
            <Text fontSize="$3" color="$primary" fontWeight="500">
              {product.platform}
            </Text>
          </XStack>

          {/* Price */}
          <XStack alignItems="baseline" gap="$2" marginTop="$2">
            <Text fontSize="$6" color="$textPrimary" fontWeight="600">
              ₹{product.price}
            </Text>
            <Text fontSize="$4" color="$textTertiary" textDecorationLine="line-through">
              ₹{product.originalPrice}
            </Text>
            <Text fontSize="$4" color="$success" fontWeight="600">
              {Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)}%
              OFF
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
              <Text color="$error" fontSize="$3" marginTop="$1">
                Please select a size to continue
              </Text>
            )}
          </YStack>

          <Separator marginBottom="$4" borderColor="$borderColor" />

          {/* Description */}
          <Text fontSize="$4" fontWeight="600" marginBottom="$2">
            Description
          </Text>
          <Text fontSize="$3" color="$textSecondary" lineHeight="$5">
            {product.description}
          </Text>

          <Spacer size="$4" />

          {/* Attributes Grid */}
          <Text fontSize="$4" fontWeight="600" marginBottom="$3">
            Product Details
          </Text>
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
                  <Text
                    fontSize="$3"
                    color="$textSecondary"
                    textTransform="capitalize"
                    fontWeight="500"
                  >
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
