/**
 * EmptyState Component
 * 
 * PRD Source: Empty cart, no results, first-time states
 * Features: Icon, title, description, action button
 */

import React from 'react';
import { styled, GetProps, YStack, Text, Stack } from 'tamagui';
import { ShoppingCart, Search, Heart, Package } from '@tamagui/lucide-icons';
import { Button } from './Button';

const EmptyFrame = styled(YStack, {
    name: 'EmptyState',
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: '$4',
    gap: '$3',
});

const IconContainer = styled(Stack, {
    name: 'EmptyStateIcon',
    width: 80,
    height: 80,
    borderRadius: '$full',
    backgroundColor: '$neutral100',
    alignItems: 'center',
    justifyContent: 'center',
});

const TitleText = styled(Text, {
    name: 'EmptyStateTitle',
    fontFamily: '$heading',
    fontSize: '$6',
    fontWeight: '700',
    color: '$textPrimary',
    textAlign: 'center',
});

const DescriptionText = styled(Text, {
    name: 'EmptyStateDescription',
    fontFamily: '$body',
    fontSize: '$4',
    fontWeight: '400',
    color: '$textSecondary',
    textAlign: 'center',
    maxWidth: 280,
});

const IconMap = {
    cart: ShoppingCart,
    search: Search,
    wishlist: Heart,
    orders: Package,
};

export type EmptyStateType = 'cart' | 'search' | 'wishlist' | 'orders' | 'custom';

export type EmptyStateProps = GetProps<typeof EmptyFrame> & {
    type?: EmptyStateType;
    icon?: React.ReactNode;
    title: string;
    description?: string;
    actionLabel?: string;
    onAction?: () => void;
};

export const EmptyState = React.forwardRef<typeof EmptyFrame, EmptyStateProps>(
    ({
        type = 'custom',
        icon,
        title,
        description,
        actionLabel,
        onAction,
        ...props
    }, ref) => {
        const IconComponent = type !== 'custom' ? IconMap[type] : null;

        return (
            <EmptyFrame ref={ref} {...props}>
                <IconContainer>
                    {icon || (IconComponent && <IconComponent size={36} color="$textSecondary" />)}
                </IconContainer>

                <TitleText>{title}</TitleText>

                {description && <DescriptionText>{description}</DescriptionText>}

                {actionLabel && onAction && (
                    <Button
                        variant="primary"
                        size="large"
                        onPress={onAction}
                        marginTop="$2"
                    >
                        {actionLabel}
                    </Button>
                )}
            </EmptyFrame>
        );
    }
);

EmptyState.displayName = 'EmptyState';

export default EmptyState;
