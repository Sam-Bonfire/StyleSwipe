/**
 * LoadingSkeleton Component
 *
 * PRD Source: Loading states for content
 * Features: Shimmer animation, various preset shapes
 */

import React from 'react';
import { styled, GetProps, Stack, XStack, YStack } from 'tamagui';

const SkeletonBase = styled(Stack, {
  name: 'LoadingSkeleton',
  backgroundColor: '$neutral200',
  overflow: 'hidden',
  borderRadius: '$2',
});

export type LoadingSkeletonProps = GetProps<typeof SkeletonBase> & {
  width?: number | string;
  height?: number | string;
  circle?: boolean;
};

export const LoadingSkeleton = React.forwardRef<typeof SkeletonBase, LoadingSkeletonProps>(
  (props: LoadingSkeletonProps, ref) => {
    const { width = '100%', height = 20, circle = false, ...rest } = props as any;
    return (
      <SkeletonBase
        ref={ref as any}
        width={width}
        height={height}
        borderRadius={(circle ? '$full' : '$2') as any}
        {...rest}
      />
    );
  },
);

LoadingSkeleton.displayName = 'LoadingSkeleton';

// Preset skeleton layouts
export const ProductTileSkeleton = () => (
  <YStack width={180} gap="$1.5">
    <LoadingSkeleton height={240} borderRadius="$3" />
    <LoadingSkeleton width={80} height={14} />
    <LoadingSkeleton width="100%" height={16} />
    <LoadingSkeleton width={100} height={18} />
  </YStack>
);

export const FashionCardSkeleton = () => (
  <YStack width={320} height={480} borderRadius="$4" overflow="hidden">
    <LoadingSkeleton width="100%" height="100%" borderRadius="$4" />
  </YStack>
);

export const CartItemSkeleton = () => (
  <XStack gap="$2" padding="$2">
    <LoadingSkeleton width={100} height={120} borderRadius="$2" />
    <YStack flex={1} gap="$1">
      <LoadingSkeleton width={80} height={14} />
      <LoadingSkeleton width="100%" height={16} />
      <LoadingSkeleton width={60} height={12} />
      <XStack justifyContent="space-between" marginTop="auto">
        <LoadingSkeleton width={80} height={20} />
        <LoadingSkeleton width={100} height={32} borderRadius="$2" />
      </XStack>
    </YStack>
  </XStack>
);

export default LoadingSkeleton;
