/**
 * RatingStars Component
 * 
 * Displays a star rating (0-5) with support for partial stars and review counts.
 */

import { Star, StarHalf } from '@tamagui/lucide-icons';
import React from 'react';
import { styled, GetProps, XStack, Text } from 'tamagui';

const RatingContainer = styled(XStack, {
    name: 'RatingStarsContainer',
    alignItems: 'center',
    gap: '$1',
});

const ReviewCountText = styled(Text, {
    name: 'RatingReviewCount',
    fontFamily: '$body',
    fontSize: '$3',
    color: '$textSecondary',
    marginLeft: '$1',
});

export type RatingStarsProps = Omit<GetProps<typeof RatingContainer>, 'size'> & {
    rating: number; // 0 to 5
    maxRating?: number;
    reviewCount?: number;
    showCount?: boolean;
    starSize?: number; // Size of stars
};

export const RatingStars = React.forwardRef<any, RatingStarsProps>(
    (props, ref) => {
        const {
            rating = 0,
            maxRating = 5,
            reviewCount,
            showCount = true,
            starSize = 16,
            ...rest
        } = props;

        // Render stars logic
        const renderStars = () => {
            const stars = [];
            const fullStars = Math.floor(rating);
            const hasHalfStar = rating % 1 >= 0.5;

            // Full Stars
            for (let i = 0; i < fullStars; i++) {
                stars.push(<Star key={`full-${i}`} size={starSize as any} color="$warning" fill="currentColor" />);
            }

            // Half Star
            if (hasHalfStar) {
                stars.push(<StarHalf key="half" size={starSize as any} color="$warning" fill="currentColor" />);
            }

            // Empty Stars
            const emptyStars = maxRating - stars.length;
            for (let i = 0; i < emptyStars; i++) {
                stars.push(<Star key={`empty-${i}`} size={starSize as any} color="$neutral300" />);
            }

            return stars;
        };

        return (
            <RatingContainer ref={ref} {...rest}>
                {renderStars()}
                {showCount && reviewCount !== undefined && (
                    <ReviewCountText>({reviewCount})</ReviewCountText>
                )}
            </RatingContainer>
        );
    }
);

RatingStars.displayName = 'RatingStars';
