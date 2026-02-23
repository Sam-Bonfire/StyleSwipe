import { Heart } from '@tamagui/lucide-icons';
import React from 'react';

import { Button, ButtonProps } from './Button';

export type WishlistButtonProps = Omit<ButtonProps, 'children'> & {
  isWishlisted?: boolean;
  onWishlistPress?: () => void;
};

/**
 * WishlistButton
 * A specific circular toggle button for favoriting items.
 * Dimensions: 32x32px (overrides default small size of 36px)
 */
export const WishlistButton = React.forwardRef<HTMLButtonElement, WishlistButtonProps>(
  ({ isWishlisted, onWishlistPress, ...props }, ref) => {
    return (
      <Button
        ref={ref}
        circular
        borderRadius="$full"
        variant="ghost"
        backgroundColor="$surface"
        // Override standard sizes to match original design (32px)
        width="$4"
        height="$4"
        minWidth="$4"
        maxWidth="$4"
        minHeight="$4"
        maxHeight="$4"
        padding={0}
        aspectRatio={1}
        onPress={(e) => {
          e.stopPropagation();
          if (onWishlistPress) {
            (onWishlistPress as any)();
          }
        }}
        icon={
          <Heart
            size={18}
            color={isWishlisted ? '$primary' : '$textSecondary'}
            fill={isWishlisted ? '$primary' : 'transparent'}
          />
        }
        hoverStyle={{ scale: 1.1, backgroundColor: '$surface' }}
        pressStyle={{ scale: 0.9, backgroundColor: '$surface' }}
        elevation={2}
        {...props}
      />
    );
  },
);

WishlistButton.displayName = 'WishlistButton';
