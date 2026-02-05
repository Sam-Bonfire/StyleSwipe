/**
 * ProductTile Component
 *
 * PRD Source: Grid-based Shop mode product listing
 * Features: Product image, brand name, title, price with discount, rating badge, sale badge
 */

import { Star } from '@tamagui/lucide-icons';
import React from 'react';
import { styled, GetProps, Stack, Text, Image, YStack, XStack, TamaguiElement } from 'tamagui';

import { WishlistButton } from './WishlistButton';

const TileFrame = styled(Stack, {
  name: 'ProductTile',
  backgroundColor: '$surface',
  borderRadius: '$3',
  overflow: 'hidden',
  cursor: 'pointer',

  hoverStyle: {
    shadowColor: '$shadowColor',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },

  pressStyle: {
    scale: 0.98,
  },

  variants: {
    size: {
      compact: {
        width: 156,
      },
      standard: {
        width: 180,
      },
      wide: {
        width: '100%',
      },
    },
  } as const,

  defaultVariants: {
    size: 'standard',
  },
});

const ImageContainer = styled(Stack, {
  name: 'ProductTileImageContainer',
  position: 'relative',
  width: '100%',
  aspectRatio: 0.75,
  backgroundColor: '$neutral100',
  overflow: 'hidden', // Ensure image stays within bounds
});

const ProductImage = styled(Image, {
  name: 'ProductTileImage',
  position: 'absolute',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  width: '100%',
  height: '100%',
});

const SaleBadge = styled(Stack, {
  name: 'ProductTileSaleBadge',
  position: 'absolute',
  top: '$1.5',
  left: '$1.5',
  backgroundColor: '$error',
  paddingHorizontal: '$1',
  paddingVertical: '$0.5',
  borderRadius: '$1',
});

const SaleBadgeText = styled(Text, {
  name: 'ProductTileSaleBadgeText',
  fontFamily: '$body',
  fontSize: '$1',
  fontWeight: '700',
  color: '$textInverse',
  textTransform: 'uppercase',
});

const ContentContainer = styled(YStack, {
  name: 'ProductTileContent',
  padding: '$1.5',
  gap: '$0.5',
});

const BrandText = styled(Text, {
  name: 'ProductTileBrand',
  fontFamily: '$body',
  fontSize: '$2',
  fontWeight: '600',
  color: '$textPrimary',
  textTransform: 'uppercase',
  letterSpacing: 0.5,
  numberOfLines: 1,
});

const TitleText = styled(Text, {
  name: 'ProductTileTitle',
  fontFamily: '$body',
  fontSize: '$3',
  fontWeight: '400',
  color: '$textSecondary',
  numberOfLines: 1,
});

const PriceRow = styled(XStack, {
  name: 'ProductTilePriceRow',
  alignItems: 'center',
  gap: '$1',
  marginTop: '$0.5',
});

const PriceText = styled(Text, {
  name: 'ProductTilePrice',
  fontFamily: '$body',
  fontSize: '$4',
  fontWeight: '700',
  color: '$textPrimary',
});

const OriginalPriceText = styled(Text, {
  name: 'ProductTileOriginalPrice',
  fontFamily: '$body',
  fontSize: '$3',
  fontWeight: '400',
  color: '$textTertiary',
  textDecorationLine: 'line-through',
});

const DiscountText = styled(Text, {
  name: 'ProductTileDiscount',
  fontFamily: '$body',
  fontSize: '$2',
  fontWeight: '600',
  color: '$success',
});

const RatingRow = styled(XStack, {
  name: 'ProductTileRatingRow',
  alignItems: 'center',
  gap: '$0.5',
  marginTop: '$0.5',
});

const RatingBadge = styled(XStack, {
  name: 'ProductTileRatingBadge',
  alignItems: 'center',
  gap: 2,
  backgroundColor: '$success',
  paddingHorizontal: '$0.5',
  paddingVertical: 2,
  borderRadius: '$1',
});

const RatingText = styled(Text, {
  name: 'ProductTileRatingText',
  fontFamily: '$body',
  fontSize: '$1',
  fontWeight: '600',
  color: '$textInverse',
});

const ReviewCountText = styled(Text, {
  name: 'ProductTileReviewCount',
  fontFamily: '$body',
  fontSize: '$2',
  fontWeight: '400',
  color: '$textTertiary',
});

export type ProductTileProps = GetProps<typeof TileFrame> & {
  imageUrl: string;
  brand: string;
  title: string;
  price: number;
  originalPrice?: number;
  discountPercentage?: number;
  rating?: number;
  reviewCount?: number;
  isOnSale?: boolean;
  isWishlisted?: boolean;
  currency?: string;
  onPress?: () => void;
  onWishlistToggle?: () => void;
};

export const ProductTile = React.forwardRef<TamaguiElement, ProductTileProps>(
  (props: ProductTileProps, ref) => {
    const {
      imageUrl,
      brand,
      title,
      price,
      originalPrice,
      discountPercentage,
      rating,
      reviewCount,
      isOnSale = false,
      isWishlisted = false,
      currency = 'INR',
      onPress,
      onWishlistToggle,
      ...rest
    } = props as any;

    const formatPrice = (amount: number) => {
      return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: currency as string,
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }).format(amount);
    };

    const handleWishlistPress = () => {
      if (onWishlistToggle) {
        onWishlistToggle();
      }
    };

    return (
      <TileFrame ref={ref as any} onPress={onPress} {...rest}>
        {
          (
            <>
              <ImageContainer>
                <ProductImage
                  source={{ uri: imageUrl }}
                  // @ts-ignore
                  src={imageUrl}
                  resizeMode="cover"
                  style={{ objectFit: 'cover' } as any}
                />

                {isOnSale && (
                  <SaleBadge>
                    <SaleBadgeText>Sale</SaleBadgeText>
                  </SaleBadge>
                )}

                <WishlistButton
                  isWishlisted={isWishlisted}
                  onWishlistPress={handleWishlistPress}
                  position="absolute"
                  top="$1.5"
                  right="$1.5"
                  hoverStyle={{ scale: 1.1 }}
                  pressStyle={{ scale: 0.9 }}
                />
              </ImageContainer>

              <ContentContainer>
                <BrandText>{brand}</BrandText>
                <TitleText>{title}</TitleText>

                <PriceRow>
                  <PriceText>{formatPrice(price as number)}</PriceText>

                  {originalPrice && (originalPrice as number) > (price as number) && (
                    <OriginalPriceText>{formatPrice(originalPrice as number)}</OriginalPriceText>
                  )}

                  {(discountPercentage as number) && (discountPercentage as number) > 0 && (
                    <DiscountText>{discountPercentage}% OFF</DiscountText>
                  )}
                </PriceRow>

                {(rating as number) !== undefined && (rating as number) > 0 && (
                  <RatingRow>
                    <RatingBadge>
                      {(<Star size={10} color="$textInverse" fill="$textInverse" />) as any}
                      <RatingText>{(rating as number).toFixed(1)}</RatingText>
                    </RatingBadge>

                    {(reviewCount as number) !== undefined && (reviewCount as number) > 0 && (
                      <ReviewCountText>({reviewCount})</ReviewCountText>
                    )}
                  </RatingRow>
                )}
              </ContentContainer>
            </>
          ) as any
        }
      </TileFrame>
    );
  },
);

ProductTile.displayName = 'ProductTile';

export default ProductTile;
