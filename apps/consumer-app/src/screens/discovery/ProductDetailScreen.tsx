import {
  useAnalytics,
  useCurrentUser,
  useMarkHelpful,
  useProduct,
  useProductSourceUrl,
  useReviewBreakdown,
  useReviews,
  useAddReview,
  useSimilarProducts,
  useToggleWishlist,
  useTrackMerchantRedirect,
  useWishlist,
} from '@app/infrastructure';
import { Button, CategoryChip, RatingStars, SizeChipGroup, TopBarIconButton, type SizeField } from '@app/ui-kit';
import { ImageGallery } from '@app/ui-kit/components/ImageGallery';
import { ArrowLeftRight, ChevronLeft, ExternalLink, Heart, Leaf, MapPin, ShieldCheck, Truck, TrendingUp, Share2, Ruler } from '@tamagui/lucide-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { Alert, Linking, ScrollView, Share, View, useWindowDimensions } from 'react-native';
import { Separator, Spacer, Text, XStack, YStack, Spinner, useTheme } from 'tamagui';

import { ProductCarousel } from '../../components/ProductCarousel';
import { ReviewSection } from '../../components/ReviewSection';
import { SizeGuideSheet } from '../../components/SizeGuideSheet';

export function ProductDetailScreen() {
  const { id: productId } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const theme = useTheme();
  const { height: windowHeight } = useWindowDimensions();

  const productData = useProduct(productId);

  const [selectedSizes, setSelectedSizes] = useState<Record<string, string[]>>({});
  const [sizeGuideOpen, setSizeGuideOpen] = useState<boolean>(false);

  const { trackEvent } = useAnalytics();
  const trackMerchantRedirect = useTrackMerchantRedirect();

  const user = useCurrentUser();
  const userId = user?._id ?? undefined;

  const merchantUrl = useProductSourceUrl(productId);

  const wishlist = useWishlist(userId);
  const toggleWishlist = useToggleWishlist();

  const reviews = useReviews(productId);
  const breakdown = useReviewBreakdown(productId);
  const addReview = useAddReview();
  const markHelpful = useMarkHelpful();
  const { data: similarData, loading: similarLoading } = useSimilarProducts(productId, 10);

  const isWishlisted = React.useMemo<boolean>(() => {
    if (!wishlist || !wishlist.items) return false;
    return wishlist.items.some((item) => item.productId === productId);
  }, [wishlist, productId]);

  const handleWishlistToggle = useCallback(async (): Promise<void> => {
    if (!userId) {
      Alert.alert('Authentication Required', 'Please log in to wishlist items.');
      return;
    }
    try {
      await toggleWishlist(userId, productId as string);
    } catch (e) {
      console.error('Failed to toggle wishlist:', e);
    }
  }, [toggleWishlist, userId, productId]);

  const handleShare = useCallback(async (): Promise<void> => {
    if (!productData) return;
    try {
      await Share.share({ message: `${productData.title} by ${productData.brand} — ${productData.mrp ? `₹${productData.price}` : ''} https://styleswipe.app/product/${productId}` });
      trackEvent('product_share', undefined, { variant: 'pdp_v2', productId: productId as string });
    } catch (e) {
      console.error('Share failed', e);
    }
  }, [productData, productId, trackEvent]);

  if (productData === undefined) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: theme.background.val }}>
        <Spinner size="large" color="$primary" />
      </View>
    );
  }

  if (productData === null) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: theme.background.val }}>
        <Text fontSize="$6" color="$textSecondary">Product not found</Text>
        <Button
          variant="ghost"
          onPress={() => {
            if (router.canGoBack()) router.back();
            else router.replace('/(app)/(tabs)');
          }}
          marginTop="$4"
        >
          Go Back
        </Button>
      </View>
    );
  }

  const rawAttributes: Record<string, unknown> = (productData.attributes as Record<string, unknown>) || {};

  const displayAttributes: Record<string, string> = Object.entries(rawAttributes).reduce<Record<string, string>>((acc, [key, value]) => {
    if (key === 'size') return acc;
    if (key === 'inventoryInfo') return acc;
    if (key === 'sizeChart') return acc;
    if (value === null || value === undefined || value === '') return acc;
    if (typeof value === 'string' || typeof value === 'number') acc[key] = String(value);
    else if (Array.isArray(value)) {
      const cleanArr = (value as unknown[]).filter((val) => val !== null && val !== undefined && val !== '');
      if (cleanArr.length > 0) acc[key] = cleanArr.join(', ');
    }
    return acc;
  }, {});

  const getFallbackDescription = (data: typeof productData): string => {
    const brand = data.brand || '';
    const raw = (data as unknown as { raw?: Record<string, unknown> }).raw || {};
    const additionalInfo = (raw['additionalInfo'] as string) || '';
    const gender = (raw['gender'] as string) || (data.gender as string) || '';
    const color = (rawAttributes['color'] as string) || (raw['primaryColour'] as string) || '';
    const category = data.category || '';
    const parts: string[] = [];
    if (brand) parts.push(`Experience premium fashion by ${brand}.`);
    if (additionalInfo) parts.push(`This product features a beautifully designed ${additionalInfo.toLowerCase()} style, perfect for elevated styling.`);
    else if (category) parts.push(`This high-quality ${category.toLowerCase()} is designed to be a versatile and stylish addition to your wardrobe.`);
    const details: string[] = [];
    if (gender) details.push(`tailored specifically for ${String(gender).toLowerCase()}`);
    if (color) details.push(`available in a stunning ${String(color).toLowerCase()} hue`);
    if (details.length > 0) parts.push(`It is ${details.join(' and ')}.`);
    else parts.push('Curated with care to ensure both exceptional comfort and durability.');
    return parts.join(' ');
  };

  type InventoryItem = { available: boolean; brandSizeLabel: string; inventory: number; label: string; skuId: number };
  const inventorySizes: string[] = Array.isArray(rawAttributes['inventoryInfo'])
    ? (rawAttributes['inventoryInfo'] as unknown as InventoryItem[]).filter((item) => item.available && item.inventory > 0).map((item) => item.label)
    : [];

  const stockStatus: string = inventorySizes.length > 0 ? `In Stock (${inventorySizes.join(', ')})` : 'Out of Stock';

  const availableSizes: string[] = Array.isArray(rawAttributes['size']) ? (rawAttributes['size'] as string[]) : [];

  const realRating: number | undefined = breakdown && breakdown.count > 0 ? breakdown.average : productData.rating;
  const realCount: number | undefined = breakdown && breakdown.count > 0 ? breakdown.count : productData.reviewCount;
  const hasRealRating: boolean = (breakdown?.count ?? 0) > 0 || (productData.rating !== undefined && productData.rating !== null);

  const product = {
    id: (productData._id as string) || (productData as unknown as { id?: string }).id || (productData.externalId as string) || (productId as string) || '',
    brand: productData.brand,
    title: productData.title,
    price: productData.price,
    originalPrice: productData.mrp,
    description: productData.description || getFallbackDescription(productData),
    rating: realRating,
    reviewCount: realCount,
    platform: productData.platform || 'StyleSwipe Verified',
    images: productData.images && productData.images.length > 0 ? productData.images : ['https://placehold.co/400x500/png?text=No+Image'],
    availableSizes,
    trustBadges: productData.trustBadges || [],
    attributes: {
      ...displayAttributes,
      ...(inventorySizes.length > 0 ? { inventoryInfo: stockStatus } : {}),
    },
  };

  const sizeField: SizeField = {
    id: 'product_size',
    label: 'Select Size',
    helperText: availableSizes.length > 0 ? 'Size guide available' : 'One size',
    multiSelect: false,
    options: product.availableSizes.map((size) => ({ id: size, label: size })),
  };

  const handleSizeChange = (fieldId: string, selectedIds: string[]): void => {
    setSelectedSizes({ [fieldId]: selectedIds });
  };

  const handleMerchantRedirect = async (): Promise<void> => {
    if (!merchantUrl) {
      Alert.alert('Unavailable', 'The retailer link for this product is not available yet.');
      return;
    }
    try {
      if (userId) await trackMerchantRedirect(userId, productId as string);
      trackEvent('affiliate_redirect', undefined, { variant: 'macro_v1', productId: productId as string });
      await Linking.openURL(merchantUrl);
    } catch (e) {
      console.error('Failed to open merchant link', e);
      Alert.alert('Error', 'Could not open the retailer page.');
    }
  };

  const handleReviewSubmit = async (input: { rating: number; text: string }): Promise<void> => {
    await addReview({ productId: product.id, rating: input.rating, text: input.text });
    trackEvent('review_submitted', undefined, { variant: 'pdp_v2', productId: product.id });
  };

  const handleHelpful = async (reviewId: string): Promise<void> => {
    try {
      await markHelpful(reviewId);
    } catch (e) {
      console.error('mark helpful failed', e);
    }
  };

  const handleSimilarPress = (id: string): void => {
    router.push({ pathname: '/(app)/product/[id]', params: { id } });
  };

  return (
    <View style={{ height: windowHeight, backgroundColor: theme.background.val }}>
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 100 }} showsVerticalScrollIndicator nestedScrollEnabled>
        <ImageGallery images={product.images} />

        <YStack padding="$4" gap="$2">
          <Text fontSize="$3" color="$textSecondary" fontWeight="600" textTransform="uppercase">
            {product.brand}
          </Text>
          <Text fontSize="$6" color="$textPrimary" fontWeight="700" lineHeight="$6">
            {product.title}
          </Text>

          <XStack alignItems="center" gap="$2" marginTop="$1">
            {hasRealRating && product.rating !== undefined ? (
              <RatingStars rating={product.rating} reviewCount={product.reviewCount} />
            ) : (
              <Text fontSize="$3" color="$textSecondary">No ratings yet</Text>
            )}
            <YStack height={16} width={1} backgroundColor="$borderColor" />
            <Text fontSize="$3" color="$primary" fontWeight="500">
              {product.platform}
            </Text>
          </XStack>

          <XStack alignItems="baseline" gap="$2" marginTop="$2">
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

          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingVertical: 4 }} style={{ marginVertical: 4 }}>
            {(productData as unknown as { raw?: Record<string, unknown> }).raw?.['season'] && (
              <CategoryChip label={`${String((productData as unknown as { raw?: Record<string, unknown> }).raw?.['season'])} Collection`} size="small" selected={false} />
            )}
            {(productData as unknown as { raw?: Record<string, unknown> }).raw?.['isFastFashion'] && <CategoryChip label="Trending" size="small" selected />}
            {product.platform && <CategoryChip label={product.platform} size="small" selected={false} />}
            {rawAttributes['subCategory'] && <CategoryChip label={String(rawAttributes['subCategory'])} size="small" selected={false} />}
          </ScrollView>

          <Separator marginVertical="$4" borderColor="$borderColor" />

          {product.trustBadges && product.trustBadges.length > 0 && (
            <XStack justifyContent="space-between" paddingVertical="$2" marginBottom="$4" backgroundColor="$surface" borderRadius="$3" padding="$3" borderColor="$borderColor" borderWidth={1}>
              {product.trustBadges.slice(0, 3).map((badgeStr: string) => {
                const config: Record<string, { icon: React.ElementType; label: string }> = {
                  authentic: { icon: ShieldCheck, label: '100% Authentic' },
                  free_delivery: { icon: Truck, label: 'Free Delivery' },
                  easy_returns: { icon: ArrowLeftRight, label: 'Easy Returns' },
                  sustainable: { icon: Leaf, label: 'Sustainable' },
                  top_seller: { icon: TrendingUp, label: 'Top Seller' },
                  vegan: { icon: Leaf, label: 'Vegan' },
                  locally_sourced: { icon: MapPin, label: 'Locally Sourced' },
                };
                const badgeConfig = config[badgeStr];
                if (!badgeConfig) return null;
                const Icon = badgeConfig.icon;
                return (
                  <YStack key={badgeStr} alignItems="center" gap="$1" flex={1}>
                    <Icon size={20} color="$primary" />
                    <Text fontSize="$2" color="$textSecondary" textAlign="center" fontWeight="500">
                      {badgeConfig.label}
                    </Text>
                  </YStack>
                );
              })}
            </XStack>
          )}

          <XStack gap="$2" marginBottom="$2">
            <Button flex={1} size="small" variant="outlined" icon={Ruler} onPress={() => setSizeGuideOpen(true)}>
              <Text fontSize="$3">Size Guide</Text>
            </Button>
            <Button flex={1} size="small" variant="outlined" icon={Share2} onPress={handleShare}>
              <Text fontSize="$3">Share</Text>
            </Button>
          </XStack>

          {product.availableSizes.length > 0 ? (
            <YStack marginBottom="$4">
              <SizeChipGroup fields={[sizeField]} selectedSizes={selectedSizes} onSizeChange={handleSizeChange} />
              <Text onPress={() => setSizeGuideOpen(true)} color="$primary" fontSize="$3" marginTop="$2" fontWeight="500">
                Size guide available — Find my size →
              </Text>
            </YStack>
          ) : (
            <Text color="$textSecondary" fontSize="$3" marginBottom="$4">One size — no selection needed</Text>
          )}

          <Separator marginBottom="$4" borderColor="$borderColor" />

          <Text fontSize="$4" fontWeight="600" marginBottom="$2">Description</Text>
          <Text fontSize="$3" color="$textSecondary" lineHeight="$5">
            {product.description}
          </Text>

          <Spacer size="$4" />

          <Text fontSize="$4" fontWeight="600" marginBottom="$3">Product Details</Text>
          <YStack gap="$2" flexWrap="wrap">
            {Object.entries(product.attributes).map(([key, value]) => {
              const formatAttributeKey = (k: string): string => {
                const keyMap: Record<string, string> = { masterCategory: 'Category', subCategory: 'Sub Category', inventoryInfo: 'Stock Status', care: 'Care Instructions' };
                if (keyMap[k]) return keyMap[k];
                return k.replace(/([A-Z])/g, ' $1').replace(/^./, (str) => str.toUpperCase()).trim();
              };
              return (
                <XStack key={key} alignItems="center" backgroundColor="$surface" padding="$3" borderRadius="$3" borderColor="$borderColor" borderWidth={1}>
                  <YStack width="35%" flexShrink={0}>
                    <Text fontSize="$3" color="$textSecondary" fontWeight="500">{formatAttributeKey(key)}</Text>
                  </YStack>
                  <YStack flex={1} paddingLeft="$2">
                    <Text fontSize="$3" color="$textPrimary" fontWeight="600" textAlign="right">{value}</Text>
                  </YStack>
                </XStack>
              );
            })}
          </YStack>

          <Separator marginVertical="$4" borderColor="$borderColor" />

          <ReviewSection
            productId={product.id}
            reviews={reviews as unknown as React.ComponentProps<typeof ReviewSection>['reviews']}
            breakdown={breakdown as unknown as React.ComponentProps<typeof ReviewSection>['breakdown']}
            onSubmit={handleReviewSubmit}
            onHelpful={handleHelpful}
            isAuthenticated={Boolean(userId)}
          />

          <Separator marginVertical="$4" borderColor="$borderColor" />

          <Text fontSize="$4" fontWeight="600" marginBottom="$2">Similar to this</Text>
          <ProductCarousel data={similarData as unknown as Record<string, unknown>[]} isLoading={similarLoading} onProductPress={handleSimilarPress} emptyMessage="No similar items found" />
        </YStack>
      </ScrollView>

      <SizeGuideSheet open={sizeGuideOpen} onOpenChange={setSizeGuideOpen} attributes={rawAttributes} brand={product.brand} onSelectSize={(size) => setSelectedSizes({ product_size: [size] })} />

      <View style={{ position: 'absolute', top: 10, left: 10, zIndex: 100 }}>
        <TopBarIconButton onPress={() => { if (router.canGoBack()) router.back(); else router.replace('/(app)/(tabs)'); }} backgroundColor="$background" shadowColor="$shadowColor" shadowRadius={4} shadowOpacity={0.1}>
          <ChevronLeft size={24} color="$textPrimary" />
        </TopBarIconButton>
      </View>

      <View style={{ position: 'absolute', top: 10, right: 10, zIndex: 100 }}>
        <TopBarIconButton onPress={handleWishlistToggle} backgroundColor="$background" shadowColor="$shadowColor" shadowRadius={4} shadowOpacity={0.1}>
          <Heart size={24} color={isWishlisted ? '$primary' : '$textPrimary'} fill={isWishlisted ? '$primary' : 'transparent'} />
        </TopBarIconButton>
      </View>

      <XStack
        backgroundColor="$surface"
        padding="$3"
        borderTopWidth={1}
        borderColor="$borderColor"
        justifyContent="space-between"
        alignItems="center"
        position="absolute"
        bottom={0}
        left={0}
        right={0}
      >
        <YStack flex={1}>
          <Text fontSize="$2" color="$textSecondary" fontWeight="500">
            Price on merchant
          </Text>
          <Text fontSize="$5" color="$textPrimary" fontWeight="700">
            ₹{product.price}
          </Text>
        </YStack>
        <Button variant="primary" icon={ExternalLink} onPress={handleMerchantRedirect}>
          Shop on Merchant
        </Button>
      </XStack>
    </View>
  );
}
