/**
 * CartItem Component
 * 
 * PRD Source: Cart Tab item display with quantity controls [cite: 43, 99]
 * Features: Image, quantity +/- controls, price, remove action
 */

import { Minus, Plus, Trash2 } from '@tamagui/lucide-icons';
import React from 'react';
import { styled, GetProps, Stack, XStack, YStack, Text, Image } from 'tamagui';

const ItemFrame = styled(XStack, {
    name: 'CartItem',
    backgroundColor: '$surface',
    padding: '$2',
    borderRadius: '$3',
    gap: '$2',
    borderWidth: 1,
    borderColor: '$borderColor',
});

const ItemImage = styled(Image, {
    name: 'CartItemImage',
    width: 100,
    height: 120,
    borderRadius: '$2',
    backgroundColor: '$neutral100',
});

const ContentContainer = styled(YStack, {
    name: 'CartItemContent',
    flex: 1,
    justifyContent: 'space-between',
});

const BrandText = styled(Text, {
    name: 'CartItemBrand',
    fontFamily: '$body',
    fontSize: '$2',
    fontWeight: '600',
    color: '$textPrimary',
    textTransform: 'uppercase',
});

const TitleText = styled(Text, {
    name: 'CartItemTitle',
    fontFamily: '$body',
    fontSize: '$3',
    fontWeight: '400',
    color: '$textSecondary',
    numberOfLines: 2,
});

const DetailsRow = styled(XStack, {
    name: 'CartItemDetails',
    gap: '$2',
    marginTop: '$0.5',
});

const DetailText = styled(Text, {
    name: 'CartItemDetail',
    fontFamily: '$body',
    fontSize: '$2',
    fontWeight: '400',
    color: '$textTertiary',
});

const PriceRow = styled(XStack, {
    name: 'CartItemPriceRow',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: '$1',
});

const PriceText = styled(Text, {
    name: 'CartItemPrice',
    fontFamily: '$body',
    fontSize: '$5',
    fontWeight: '700',
    color: '$textPrimary',
});

const OriginalPriceText = styled(Text, {
    name: 'CartItemOriginalPrice',
    fontFamily: '$body',
    fontSize: '$3',
    fontWeight: '400',
    color: '$textTertiary',
    textDecorationLine: 'line-through',
    marginLeft: '$1',
});

const QuantityContainer = styled(XStack, {
    name: 'CartItemQuantity',
    alignItems: 'center',
    gap: '$1.5',
    backgroundColor: '$neutral100',
    borderRadius: '$2',
    paddingHorizontal: '$1',
    paddingVertical: '$0.5',
});

const QuantityButton = styled(Stack, {
    name: 'CartItemQuantityButton',
    width: 28,
    height: 28,
    borderRadius: '$full',
    backgroundColor: '$surface',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',

    hoverStyle: {
        backgroundColor: '$backgroundHover',
    },

    pressStyle: {
        scale: 0.95,
    },

    variants: {
        disabled: {
            true: {
                opacity: 0.4,
                cursor: 'not-allowed',
                pointerEvents: 'none',
            },
        },
    } as const,
});

const QuantityText = styled(Text, {
    name: 'CartItemQuantityText',
    fontFamily: '$body',
    fontSize: '$4',
    fontWeight: '600',
    color: '$textPrimary',
    minWidth: 24,
    textAlign: 'center',
});

const RemoveButton = styled(Stack, {
    name: 'CartItemRemoveButton',
    position: 'absolute',
    top: '$1',
    right: '$1',
    width: 32,
    height: 32,
    borderRadius: '$full',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',

    hoverStyle: {
        backgroundColor: '$backgroundHover',
    },

    pressStyle: {
        scale: 0.95,
    },
});

export type CartItemProps = GetProps<typeof ItemFrame> & {
    imageUrl: string;
    brand: string;
    title: string;
    size?: string;
    color?: string;
    price: number;
    originalPrice?: number;
    quantity: number;
    maxQuantity?: number;
    currency?: string;
    onQuantityChange: (quantity: number) => void;
    onRemove: () => void;
};

export const CartItem = React.forwardRef<typeof ItemFrame, CartItemProps>(
    ({
        imageUrl,
        brand,
        title,
        size,
        color,
        price,
        originalPrice,
        quantity,
        maxQuantity = 10,
        currency = 'INR',
        onQuantityChange,
        onRemove,
        ...props
    }, ref) => {
        const formatPrice = (amount: number) => {
            return new Intl.NumberFormat('en-IN', {
                style: 'currency',
                currency: currency as string,
                minimumFractionDigits: 0,
                maximumFractionDigits: 0,
            }).format(amount);
        };

        const handleDecrease = () => {
            if ((quantity as number) > 1) {
                (onQuantityChange as any)((quantity as number) - 1);
            }
        };

        const handleIncrease = () => {
            if ((quantity as number) < (maxQuantity as number)) {
                (onQuantityChange as any)((quantity as number) + 1);
            }
        };

        return (
            <ItemFrame ref={ref as any} {...props}>
                {
                    (
                        <ItemImage source={{ uri: imageUrl }} resizeMode="cover" />
                    ) as any
                }

                {
                    (
                        <ContentContainer>
                            <YStack>
                                <BrandText>{brand}</BrandText>
                                <TitleText>{title}</TitleText>

                                <DetailsRow>
                                    {size && <DetailText>Size: {size}</DetailText>}
                                    {color && <DetailText>Color: {color}</DetailText>}
                                </DetailsRow>
                            </YStack>

                            <PriceRow>
                                <XStack alignItems="baseline">
                                    <PriceText>{formatPrice((price as number) * (quantity as number))}</PriceText>
                                    {(originalPrice as number) && (originalPrice as number) > (price as number) && (
                                        <OriginalPriceText>
                                            {formatPrice((originalPrice as number) * (quantity as number))}
                                        </OriginalPriceText>
                                    )}
                                </XStack>

                                <QuantityContainer>
                                    <QuantityButton
                                        onPress={handleDecrease}
                                        disabled={(quantity as number) <= 1}
                                    >
                                        <Minus size={16} color="$textPrimary" />
                                    </QuantityButton>

                                    <QuantityText>{quantity}</QuantityText>

                                    <QuantityButton
                                        onPress={handleIncrease}
                                        disabled={(quantity as number) >= (maxQuantity as number)}
                                    >
                                        <Plus size={16} color="$textPrimary" />
                                    </QuantityButton>
                                </QuantityContainer>
                            </PriceRow>
                        </ContentContainer>
                    ) as any
                }

                {
                    (
                        <RemoveButton onPress={onRemove}>
                            <Trash2 size={18} color="$textSecondary" />
                        </RemoveButton>
                    ) as any
                }
            </ItemFrame>
        );
    }
);

CartItem.displayName = 'CartItem';

export default CartItem;
