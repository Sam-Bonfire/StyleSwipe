/**
 * ProductTile Component
 * 
 * PRD Source: Grid-based Shop mode product listing
 * Features: Product image, brand name, title, price with discount, rating badge, sale badge
 */

import React from 'react';
import { styled, GetProps, Stack, Text, Image, YStack, XStack } from 'tamagui';
import { Star, Heart } from '@tamagui/lucide-icons';

const TileFrame = styled(Stack, {
    name: 'ProductTile',
    backgroundColor: '$surface',
    borderRadius: '$3',
    overflow: 'hidden',
    cursor: 'pointer',

    hoverStyle: {
        elevation: 4,
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
    aspectRatio: 0.75,
    backgroundColor: '$neutral100',
});

const ProductImage = styled(Image, {
    name: 'ProductTileImage',
    width: '100%',
    height: '100%',
});

const WishlistButton = styled(Stack, {
    name: 'ProductTileWishlistButton',
    position: 'absolute',
    top: '$1.5',
    right: '$1.5',
    width: 32,
    height: 32,
    borderRadius: '$full',
    backgroundColor: '$surface',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 2,

    hoverStyle: {
        scale: 1.1,
    },

    pressStyle: {
        scale: 0.9,
    },
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

export const ProductTile = React.forwardRef<typeof TileFrame, ProductTileProps>(
    ({
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
        ...props
    }, ref) => {
        const formatPrice = (amount: number) => {
            return new Intl.NumberFormat('en-IN', {
                style: 'currency',
                currency,
                minimumFractionDigits: 0,
                maximumFractionDigits: 0,
            }).format(amount);
        };

        const handleWishlistPress = (e: any) => {
            e.stopPropagation();
            if (onWishlistToggle) {
                onWishlistToggle();
            }
        };

        return (
            <TileFrame ref={ref} onPress={onPress} {...props}>
                <ImageContainer>
                    <ProductImage
                        source={{ uri: imageUrl }}
                        resizeMode="cover"
                    />

                    {isOnSale && (
                        <SaleBadge>
                            <SaleBadgeText>Sale</SaleBadgeText>
                        </SaleBadge>
                    )}

                    <WishlistButton onPress={handleWishlistPress}>
                        <Heart
                            size={18}
                            color={isWishlisted ? '$primary' : '$textSecondary'}
                            fill={isWishlisted ? '$primary' : 'transparent'}
                        />
                    </WishlistButton>
                </ImageContainer>

                <ContentContainer>
                    <BrandText>{brand}</BrandText>
                    <TitleText>{title}</TitleText>

                    <PriceRow>
                        <PriceText>{formatPrice(price)}</PriceText>

                        {originalPrice && originalPrice > price && (
                            <OriginalPriceText>
                                {formatPrice(originalPrice)}
                            </OriginalPriceText>
                        )}

                        {discountPercentage && discountPercentage > 0 && (
                            <DiscountText>{discountPercentage}% OFF</DiscountText>
                        )}
                    </PriceRow>

                    {rating !== undefined && rating > 0 && (
                        <RatingRow>
                            <RatingBadge>
                                <Star size={10} color="$textInverse" fill="$textInverse" />
                                <RatingText>{rating.toFixed(1)}</RatingText>
                            </RatingBadge>

                            {reviewCount !== undefined && reviewCount > 0 && (
                                <ReviewCountText>({reviewCount})</ReviewCountText>
                            )}
                        </RatingRow>
                    )}
                </ContentContainer>
            </TileFrame>
        );
    }
);

ProductTile.displayName = 'ProductTile';

export default ProductTile;
