import { ProductTile } from '@app/ui-kit';
import React from 'react';
import { ScrollView } from 'react-native';
import { YStack, Spinner, Text } from 'tamagui';

interface ProductCarouselProps {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    data?: Record<string, any>[];
    isLoading: boolean;
    onProductPress: (id: string) => void;
    emptyMessage?: string;
}

export const ProductCarousel = ({
    data,
    isLoading,
    onProductPress,
    emptyMessage = "No items found"
}: ProductCarouselProps) => {
    if (isLoading) {
        return (
            <YStack height={260} justifyContent="center" alignItems="center">
                <Spinner size="large" color="$primary" />
            </YStack>
        );
    }

    if (!data || data.length === 0) {
        return (
            <YStack height={100} justifyContent="center" alignItems="center" paddingHorizontal="$4">
                <Text color="$textSecondary" fontSize="$3">{emptyMessage}</Text>
            </YStack>
        );
    }

    return (
        <ScrollView
            horizontal
            showsHorizontalScrollIndicator={true}
            contentContainerStyle={{ paddingHorizontal: 16, gap: 12 }}
        >
            {data.map((product) => (
                <ProductTile
                    key={product._id}
                    title={product.title}
                    brand={product.brand}
                    price={product.price}
                    originalPrice={product.mrp}
                    imageUrl={product.images && product.images[0] ? product.images[0] : 'https://placehold.co/200x300'}
                    discountPercentage={product.mrp > product.price ? Math.round(((product.mrp - product.price) / product.mrp) * 100) : undefined}
                    onPress={() => onProductPress(product._id)}
                />
            ))}
        </ScrollView>
    );
};
