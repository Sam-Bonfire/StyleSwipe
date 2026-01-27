/**
 * TopBar Component
 * 
 * PRD Source: Top navigation with address, search, shortlist, cart icons
 * Features: Left slot (address), Right slot (icon group), optional title center
 */

import { MapPin, Search, Heart, ShoppingCart, ChevronDown } from '@tamagui/lucide-icons';
import React from 'react';
import { styled, GetProps, XStack, YStack, Text, Stack } from 'tamagui';

const TopBarFrame = styled(XStack, {
    name: 'TopBar',
    backgroundColor: '$surface',
    paddingHorizontal: '$1',
    paddingVertical: '$1',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: '$borderColor',
    minHeight: 56,

    variants: {
        transparent: {
            true: {
                backgroundColor: 'transparent',
                borderBottomWidth: 0,
            },
        },
        elevated: {
            true: {
                elevation: 4,
                shadowColor: '$shadowColor',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.1,
                shadowRadius: 4,
                borderBottomWidth: 0,
            },
        },
    } as const,
});

const LeftSection = styled(XStack, {
    name: 'TopBarLeftSection',
    flex: 1,
    alignItems: 'center',
    gap: '$1',
});

const CenterSection = styled(XStack, {
    name: 'TopBarCenterSection',
    flex: 2,
    alignItems: 'center',
    justifyContent: 'center',
});

const RightSection = styled(XStack, {
    name: 'TopBarRightSection',
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: '$1.5',
});

const AddressButton = styled(XStack, {
    name: 'TopBarAddressButton',
    alignItems: 'center',
    gap: '$0.5',
    paddingVertical: '$1',
    paddingHorizontal: '$1',
    borderRadius: '$2',
    cursor: 'pointer',

    hoverStyle: {
        backgroundColor: '$backgroundHover',
    },

    pressStyle: {
        scale: 0.98,
    },
});

const AddressLabel = styled(Text, {
    name: 'TopBarAddressLabel',
    fontFamily: '$body',
    fontSize: '$2',
    fontWeight: '400',
    color: '$textSecondary',
});

const AddressText = styled(Text, {
    name: 'TopBarAddressText',
    fontFamily: '$body',
    fontSize: '$4',
    fontWeight: '600',
    color: '$textPrimary',
    maxWidth: 160,
    numberOfLines: 1,
});

const TitleText = styled(Text, {
    name: 'TopBarTitle',
    fontFamily: '$heading',
    fontSize: '$6',
    fontWeight: '700',
    color: '$textPrimary',
});

export const TopBarIconButton = styled(Stack, {
    name: 'TopBarIconButton',
    width: 40,
    height: 40,
    borderRadius: '$full',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    position: 'relative',

    hoverStyle: {
        backgroundColor: '$backgroundHover',
    },

    pressStyle: {
        scale: 0.95,
    },
});

export const TopBarBadgeCount = styled(Stack, {
    name: 'TopBarBadgeCount',
    position: 'absolute',
    top: 4,
    right: 4,
    minWidth: 16,
    height: 16,
    borderRadius: '$full',
    backgroundColor: '$primary',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
});

export const TopBarBadgeText = styled(Text, {
    name: 'TopBarBadgeText',
    fontFamily: '$body',
    fontSize: 10,
    fontWeight: '700',
    color: '$textInverse',
});

export type TopBarProps = GetProps<typeof TopBarFrame> & {
    // Address section
    showAddress?: boolean;
    addressLabel?: string;
    addressValue?: string;
    onAddressPress?: () => void;

    // Title (center)
    title?: string;

    // Action buttons
    showSearch?: boolean;
    onSearchPress?: () => void;
    showWishlist?: boolean;
    wishlistCount?: number;
    onWishlistPress?: () => void;
    showCart?: boolean;
    cartCount?: number;
    onCartPress?: () => void;

    // Custom slots
    leftContent?: React.ReactNode;
    centerContent?: React.ReactNode;
    rightContent?: React.ReactNode;
};

export const TopBar = React.forwardRef<typeof TopBarFrame, TopBarProps>(
    (props: TopBarProps, ref) => {
        const {
            showAddress = true,
            addressLabel = 'Deliver to',
            addressValue,
            onAddressPress,
            title,
            showSearch = true,
            onSearchPress,
            showWishlist = true,
            wishlistCount = 0,
            onWishlistPress,
            showCart = true,
            cartCount = 0,
            onCartPress,
            leftContent,
            centerContent,
            rightContent,
            ...rest
        } = props as any;

        return (
            <TopBarFrame ref={ref as any} {...rest}>
                {
                    (
                        <>
                            <LeftSection>
                                {leftContent ?? (showAddress && (
                                    <AddressButton onPress={onAddressPress}>
                                        {(<MapPin size={18} color="$primary" />) as any}
                                        <YStack>
                                            <AddressLabel>{addressLabel}</AddressLabel>
                                            <XStack alignItems="center" gap="$0.5">
                                                <AddressText>
                                                    {addressValue || 'Select Address'}
                                                </AddressText>
                                                {(<ChevronDown size={14} color="$textSecondary" />) as any}
                                            </XStack>
                                        </YStack>
                                    </AddressButton>
                                ))}
                            </LeftSection>

                            <CenterSection>
                                {centerContent ?? (title && <TitleText>{title}</TitleText>)}
                            </CenterSection>

                            <RightSection>
                                {rightContent ?? (
                                    <>
                                        {showSearch && (
                                            <TopBarIconButton onPress={onSearchPress}>
                                                {(<Search size={22} color="$textPrimary" />) as any}
                                            </TopBarIconButton>
                                        )}

                                        {showWishlist && (
                                            <TopBarIconButton onPress={onWishlistPress}>
                                                {(<Heart size={22} color="$textPrimary" />) as any}
                                                {(wishlistCount as number) > 0 && (
                                                    <TopBarBadgeCount>
                                                        <TopBarBadgeText>
                                                            {(wishlistCount as number) > 99 ? '99+' : `${wishlistCount}`}
                                                        </TopBarBadgeText>
                                                    </TopBarBadgeCount>
                                                )}
                                            </TopBarIconButton>
                                        )}

                                        {showCart && (
                                            <TopBarIconButton onPress={onCartPress}>
                                                {(<ShoppingCart size={22} color="$textPrimary" />) as any}
                                                {(cartCount as number) > 0 && (
                                                    <TopBarBadgeCount>
                                                        <TopBarBadgeText>
                                                            {(cartCount as number) > 99 ? '99+' : `${cartCount}`}
                                                        </TopBarBadgeText>
                                                    </TopBarBadgeCount>
                                                )}
                                            </TopBarIconButton>
                                        )}
                                    </>
                                )}
                            </RightSection>
                        </>
                    ) as any
                }
            </TopBarFrame>
        );
    }
);

TopBar.displayName = 'TopBar';

export default TopBar;
