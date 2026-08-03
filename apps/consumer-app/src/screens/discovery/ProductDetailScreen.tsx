
import { CartItem } from '@app/core';
import { useCurrentUser, useProduct, useAddToCart, useWishlist, useToggleWishlist, useAnalytics } from '@app/infrastructure';
import { TopBarIconButton, RatingStars, SizeChipGroup, SizeField, Button, CategoryChip } from '@app/ui-kit';
import { ImageGallery } from '@app/ui-kit/components/ImageGallery';
import { TransactionalFooter } from '@app/ui-kit/components/TransactionalFooter';
import { ChevronLeft, Heart, ShieldCheck, Truck, ArrowLeftRight, Leaf, TrendingUp, MapPin } from '@tamagui/lucide-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useState } from 'react';
import { ScrollView, View, useWindowDimensions, Alert } from 'react-native';
import { Separator, Spacer, Text, YStack, XStack, useTheme, Spinner } from 'tamagui';

// COMPLETE REWRITE OF COMPONENT TO FIX SCROLL ISSUES
export function ProductDetailScreen() {
  // -------------------------------------------------------------------------
  // 1. Hooks & State
  // -------------------------------------------------------------------------
  const { id: productId } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const theme = useTheme();
  const { height: windowHeight, width: windowWidth } = useWindowDimensions();
  const galleryHeight = windowWidth / 0.7;
  const sizeSelectorYRef = React.useRef(0);

  // FETCH REAL DATA
  // We cast productId to any because navigation params are strings, but Convex expects Id<"products">
  // In a real app, we'd validate this.
  const productData = useProduct(productId);

  const [selectedSizes, setSelectedSizes] = useState<Record<string, string[]>>({});
  const [showSizeError, setShowSizeError] = useState(false);
  const [isAdded, setIsAdded] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const addToCart = useAddToCart();
  const { trackEvent } = useAnalytics();

  const user = useCurrentUser();
  const userId = user?._id ?? undefined;
  const scrollViewRef = React.useRef<ScrollView>(null);

  const wishlist = useWishlist(userId);
  const toggleWishlist = useToggleWishlist();

  const isWishlisted = React.useMemo(() => {
    if (!wishlist || !wishlist.items) return false;
    return wishlist.items.some((item) => item.productId === productId);
  }, [wishlist, productId]);

  const handleWishlistToggle = async () => {
    if (!userId) {
      Alert.alert('Authentication Required', 'Please log in to wishlist items.');
      return;
    }
    try {
      await toggleWishlist(userId, productId);
    } catch (e) {
      console.error('Failed to toggle wishlist:', e);
    }
  };

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
        <Button
          variant="ghost"
          onPress={() => {
            if (router.canGoBack()) {
              router.back();
            } else {
              router.replace('/(app)/(tabs)');
            }
          }}
          marginTop="$4"
        >
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
      if (key === 'inventoryInfo') return acc; // Skip complex inventoryInfo array, handled separately below

      // Filter out empty values (empty strings, null, undefined)
      if (value === null || value === undefined || value === '') {
        return acc;
      }

      if (typeof value === 'string' || typeof value === 'number') {
        acc[key] = String(value);
      } else if (Array.isArray(value)) {
        const cleanArr = value.filter(val => val !== null && val !== undefined && val !== '');
        if (cleanArr.length > 0) {
          acc[key] = cleanArr.join(', ');
        }
      }
      return acc;
    },
    {} as Record<string, string>,
  );

  // Helper to generate dynamic description if core description is blank
  const getFallbackDescription = (data: typeof productData) => {
    const brand = data.brand || '';
    const raw = data.raw || {};
    const additionalInfo = raw.additionalInfo || '';
    const gender = raw.gender || data.gender || '';
    const color = data.attributes?.color || raw.primaryColour || '';
    const category = data.category || '';

    const parts: string[] = [];

    if (brand) {
      parts.push(`Experience premium fashion by ${brand}.`);
    }

    if (additionalInfo) {
      parts.push(`This product features a beautifully designed ${additionalInfo.toLowerCase()} style, perfect for elevated styling.`);
    } else if (category) {
      parts.push(`This high-quality ${category.toLowerCase()} is designed to be a versatile and stylish addition to your wardrobe.`);
    }

    const details: string[] = [];
    if (gender) {
      details.push(`tailored specifically for ${gender.toLowerCase()}`);
    }
    if (color) {
      details.push(`available in a stunning ${color.toLowerCase()} hue`);
    }

    if (details.length > 0) {
      parts.push(`It is ${details.join(' and ')}.`);
    } else {
      parts.push('Curated with care to ensure both exceptional comfort and durability.');
    }

    return parts.join(' ');
  };

  interface InventoryItem {
    available: boolean;
    brandSizeLabel: string;
    inventory: number;
    label: string;
    skuId: number;
  }

  // Human-readable size-level stock availability
  const inventorySizes = Array.isArray(rawAttributes.inventoryInfo)
    ? (rawAttributes.inventoryInfo as unknown as InventoryItem[])
        .filter((item: InventoryItem) => item.available && item.inventory > 0)
        .map((item: InventoryItem) => item.label)
    : [];

  const stockStatus = inventorySizes.length > 0
    ? `In Stock (${inventorySizes.join(', ')})`
    : 'Out of Stock';

  const product = {
    id: productData._id || productData.id || productData.externalId || productId || '',
    brand: productData.brand,
    title: productData.title,
    price: productData.price,
    originalPrice: productData.mrp,
    description:
      productData.description || getFallbackDescription(productData),
    rating: productData.rating || 4.5,
    reviewCount: productData.reviewCount || 128,
    platform: productData.platform || 'StyleSwipe Verified',
    images:
      productData.images && productData.images.length > 0
        ? productData.images
        : ['https://placehold.co/400x500/png?text=No+Image'],
    availableSizes: Array.isArray(rawAttributes.size) ? rawAttributes.size : ['S', 'M', 'L', 'XL'],
    trustBadges: productData.trustBadges || [],
    attributes: {
      ...displayAttributes,
      ...(inventorySizes.length > 0 ? { inventoryInfo: stockStatus } : {}),
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
      router.push('/(app)/(tabs)/cart');
      return;
    }

    const selectedSize = selectedSizes['product_size']?.[0];

    if (!selectedSize) {
      setShowSizeError(true);
      // Smoothly scroll the ScrollView exactly to the Size Selector Y offset so the red error message is immediately visible to the user
      const scrollY = Math.max(0, galleryHeight + sizeSelectorYRef.current - 40);
      scrollViewRef.current?.scrollTo({ y: scrollY, animated: true });
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
      await addToCart(userId, item);
      trackEvent('added_to_cart', undefined, { variant: 'macro_v1', productId: product.id });
      
      setIsAdded(true);
      Alert.alert('Success', 'Added to cart!');
    } catch (e) {
      console.error('Failed to add to cart', e);
      const message = e instanceof Error ? e.message : 'Unknown error';
      Alert.alert('Error', 'Failed to add to cart: ' + message);
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
        ref={scrollViewRef}
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
            <YStack height={16} width={1} backgroundColor="$borderColor" />
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

          {/* Highlights Badges */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ gap: 8, paddingVertical: 4 }}
            style={{ marginVertical: 4 }}
          >
            {productData.raw?.season && (
              <CategoryChip
                label={`${productData.raw.season} Collection`}
                size="small"
                selected={false}
              />
            )}
            {productData.raw?.isFastFashion && (
              <CategoryChip
                label="Trending"
                size="small"
                selected={true}
              />
            )}
            {product.platform && (
              <CategoryChip
                label={product.platform}
                size="small"
                selected={false}
              />
            )}
            {rawAttributes.subCategory && (
              <CategoryChip
                label={String(rawAttributes.subCategory)}
                size="small"
                selected={false}
              />
            )}
          </ScrollView>

          <Separator marginVertical="$4" borderColor="$borderColor" />

          {/* Trust UI Markers */}
          {product.trustBadges && product.trustBadges.length > 0 && (
            <XStack justifyContent="space-between" paddingVertical="$2" marginBottom="$4" backgroundColor="$surface" borderRadius="$3" padding="$3" borderColor="$borderColor" borderWidth={1}>
              {product.trustBadges.slice(0, 3).map((badgeStr: string) => {
                const config: Record<string, { icon: React.ElementType, label: string }> = {
                  authentic: { icon: ShieldCheck, label: '100% Authentic' },
                  free_delivery: { icon: Truck, label: 'Free Delivery' },
                  easy_returns: { icon: ArrowLeftRight, label: 'Easy Returns' },
                  sustainable: { icon: Leaf, label: 'Sustainable' },
                  top_seller: { icon: TrendingUp, label: 'Top Seller' },
                  vegan: { icon: Leaf, label: 'Vegan' },
                  locally_sourced: { icon: MapPin, label: 'Locally Sourced' }
                };
                
                const badgeConfig = config[badgeStr];
                if (!badgeConfig) return null;
                const Icon = badgeConfig.icon;
                
                return (
                  <YStack key={badgeStr} alignItems="center" gap="$1" flex={1}>
                    <Icon size={20} color="$primary" />
                    <Text fontSize="$2" color="$textSecondary" textAlign="center" fontWeight="500">{badgeConfig.label}</Text>
                  </YStack>
                );
              })}
            </XStack>
          )}

          {/* Size Selector */}
          <YStack
            marginBottom="$4"
            onLayout={(event) => {
              sizeSelectorYRef.current = event.nativeEvent.layout.y;
            }}
          >
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
            {Object.entries(product.attributes).map(([key, value]) => {
              const formatAttributeKey = (k: string) => {
                const keyMap: Record<string, string> = {
                  masterCategory: 'Category',
                  subCategory: 'Sub Category',
                  inventoryInfo: 'Stock Status',
                  care: 'Care Instructions',
                };
                if (keyMap[k]) return keyMap[k];
                return k
                  .replace(/([A-Z])/g, ' $1')
                  .replace(/^./, (str) => str.toUpperCase())
                  .trim();
              };

              return (
                <XStack
                  key={key}
                  alignItems="center"
                  backgroundColor="$surface"
                  padding="$3"
                  borderRadius="$3"
                  borderColor="$borderColor"
                  borderWidth={1}
                >
                  <YStack width="35%" flexShrink={0}>
                    <Text
                      fontSize="$3"
                      color="$textSecondary"
                      fontWeight="500"
                    >
                      {formatAttributeKey(key)}
                    </Text>
                  </YStack>
                  <YStack flex={1} paddingLeft="$2">
                    <Text fontSize="$3" color="$textPrimary" fontWeight="600" textAlign="right">
                      {value}
                    </Text>
                  </YStack>
                </XStack>
              );
            })}
          </YStack>
        </YStack>
      </ScrollView>

      {/* 3. Floating UI: Back Button */}
      <View style={{ position: 'absolute', top: 10, left: 10, zIndex: 100 }}>
        <TopBarIconButton
          onPress={() => {
            if (router.canGoBack()) {
              router.back();
            } else {
              router.replace('/(app)/(tabs)');
            }
          }}
          backgroundColor="$background"

          shadowColor="$shadowColor"
          shadowRadius={4}
          shadowOpacity={0.1}
        >
          <ChevronLeft size={24} color="$textPrimary" />
        </TopBarIconButton>
      </View>

      {/* Floating UI: Wishlist Button */}
      <View style={{ position: 'absolute', top: 10, right: 10, zIndex: 100 }}>
        <TopBarIconButton
          onPress={handleWishlistToggle}
          backgroundColor="$background"
          shadowColor="$shadowColor"
          shadowRadius={4}
          shadowOpacity={0.1}
        >
          <Heart
            size={24}
            color={isWishlisted ? '$primary' : '$textPrimary'}
            fill={isWishlisted ? '$primary' : 'transparent'}
          />
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
