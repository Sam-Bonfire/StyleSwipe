/**
 * FashionCard Component
 * 
 * PRD Source: Tinder-style Discover Mode swipe cards [cite: 16, 18, 19]
 * Features: Full-bleed image, gradient overlay, brand title, price tag, Add to Cart overlay button
 * Animation Ready: Accepts style prop for gesture transforms
 */

import React from 'react';
import { styled, GetProps, Stack, Text, Image, YStack, XStack } from 'tamagui';
import { LinearGradient } from 'tamagui/linear-gradient';

const CardFrame = styled(Stack, {
    name: 'FashionCard',
    position: 'relative',
    borderRadius: '$4',
    overflow: 'hidden',
    backgroundColor: '$surface',
    elevation: 4,
    shadowColor: '$shadowColor',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,

    variants: {
        size: {
            standard: {
                width: 320,
                height: 480,
            },
            compact: {
                width: 280,
                height: 400,
            },
            full: {
                width: '100%',
                aspectRatio: 0.67,
            },
        },
    } as const,

    defaultVariants: {
        size: 'standard',
    },
});

const CardImage = styled(Image, {
    name: 'FashionCardImage',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: '100%',
    height: '100%',
});

const CardOverlay = styled(YStack, {
    name: 'FashionCardOverlay',
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: '$3',
    paddingTop: '$6',
});

const BrandText = styled(Text, {
    name: 'FashionCardBrand',
    fontFamily: '$heading',
    fontSize: '$3',
    fontWeight: '500',
    color: '$textInverse',
    opacity: 0.9,
    textTransform: 'uppercase',
    letterSpacing: 1,
});

const TitleText = styled(Text, {
    name: 'FashionCardTitle',
    fontFamily: '$heading',
    fontSize: '$6',
    fontWeight: '700',
    color: '$textInverse',
    marginTop: '$0.5',
    numberOfLines: 2,
});

const PriceContainer = styled(XStack, {
    name: 'FashionCardPriceContainer',
    alignItems: 'center',
    gap: '$1.5',
    marginTop: '$1',
});

const PriceText = styled(Text, {
    name: 'FashionCardPrice',
    fontFamily: '$body',
    fontSize: '$5',
    fontWeight: '700',
    color: '$textInverse',
});

const OriginalPriceText = styled(Text, {
    name: 'FashionCardOriginalPrice',
    fontFamily: '$body',
    fontSize: '$4',
    fontWeight: '400',
    color: '$textInverse',
    opacity: 0.7,
    textDecorationLine: 'line-through',
});

const DiscountBadge = styled(Stack, {
    name: 'FashionCardDiscountBadge',
    backgroundColor: '$success',
    paddingHorizontal: '$1',
    paddingVertical: '$0.5',
    borderRadius: '$1',
});

const DiscountText = styled(Text, {
    name: 'FashionCardDiscountText',
    fontFamily: '$body',
    fontSize: '$2',
    fontWeight: '600',
    color: '$textInverse',
});

const ActionButton = styled(Stack, {
    name: 'FashionCardActionButton',
    // Removed absolute positioning
    backgroundColor: '$primary',
    paddingHorizontal: '$2',
    paddingVertical: '$1',
    borderRadius: '$full',
    flexDirection: 'row',
    alignItems: 'center',
    gap: '$1',

    hoverStyle: {
        backgroundColor: '$primaryDark',
        scale: 1.05,
    },

    pressStyle: {
        scale: 0.95,
    },
});

const ActionButtonText = styled(Text, {
    name: 'FashionCardActionButtonText',
    fontFamily: '$body',
    fontSize: '$3',
    fontWeight: '600',
    color: '$textInverse',
});

export type FashionCardProps = GetProps<typeof CardFrame> & {
    imageUrl: string;
    brand: string;
    title: string;
    price: number;
    originalPrice?: number;
    discountPercentage?: number;
    currency?: string;
    onAddToCart?: () => void;
    onPress?: () => void;
};

export const FashionCard = React.forwardRef<typeof CardFrame, FashionCardProps>(
    ({
        imageUrl,
        brand,
        title,
        price,
        originalPrice,
        discountPercentage,
        currency = 'INR',
        onAddToCart,
        onPress,
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

        return (
            <CardFrame ref={ref} onPress={onPress} {...props}>
                <CardImage
                    source={{ uri: imageUrl }}
                    // @ts-ignore
                    src={imageUrl}
                    resizeMode="cover"
                />

                <LinearGradient
                    colors={['transparent', 'rgba(0,0,0,0.8)']}
                    start={[0, 0]}
                    end={[0, 1]}
                    style={{
                        position: 'absolute',
                        bottom: 0,
                        left: 0,
                        right: 0,
                        height: '60%', // Increased gradient height slightly for better readability
                    }}
                />

                <CardOverlay>
                    <BrandText>{brand}</BrandText>
                    <TitleText marginBottom="$2">{title}</TitleText>

                    <XStack alignItems="center" justifyContent="space-between" gap="$2">
                        <PriceContainer flex={1} flexWrap="wrap">
                            <PriceText>{formatPrice(price)}</PriceText>

                            {originalPrice && originalPrice > price && (
                                <OriginalPriceText>
                                    {formatPrice(originalPrice)}
                                </OriginalPriceText>
                            )}

                            {discountPercentage && discountPercentage > 0 && (
                                <DiscountBadge>
                                    <DiscountText>{discountPercentage}% OFF</DiscountText>
                                </DiscountBadge>
                            )}
                        </PriceContainer>

                        {onAddToCart && (
                            <ActionButton onPress={(e) => {
                                e.stopPropagation();
                                onAddToCart();
                            }}>
                                <ActionButtonText>Add</ActionButtonText>
                            </ActionButton>
                        )}
                    </XStack>
                </CardOverlay>
            </CardFrame>
        );
    }
);

FashionCard.displayName = 'FashionCard';

export default FashionCard;
