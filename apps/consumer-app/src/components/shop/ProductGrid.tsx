import React from 'react';
import { FlatList, RefreshControl } from 'react-native';
import { FashionCard } from '@app/ui-kit/components/FashionCard';
import { YStack, Text, Spinner } from 'tamagui';

interface ProductGridProps {
    products: any[];
    isLoading: boolean;
    onRefresh?: () => void;
    onEndReached?: () => void;
}

export function ProductGrid({ products, isLoading, onRefresh, onEndReached }: ProductGridProps) {
    if (isLoading && products.length === 0) {
        return (
            <YStack flex={1} justifyContent="center" alignItems="center">
                <Spinner size="large" />
            </YStack>
        );
    }

    if (!isLoading && products.length === 0) {
        return (
            <YStack flex={1} justifyContent="center" alignItems="center" padding="$4">
                <Text>No products found matching your criteria.</Text>
            </YStack>
        );
    }

    return (
        <FlatList
            data={products}
            keyExtractor={(item) => item._id}
            numColumns={2}
            contentContainerStyle={{ padding: 8 }}
            columnWrapperStyle={{ justifyContent: 'space-between' }}
            renderItem={({ item }) => (
                <YStack flex={1} padding="$1.5" maxWidth="50%">
                    <FashionCard
                        image={item.images[0]}
                        title={item.title}
                        price={item.price}
                        brand={item.brand}
                        badge={item.onSale ? "SALE" : undefined}
                    />
                </YStack>
            )}
            onEndReached={onEndReached}
            onEndReachedThreshold={0.5}
            refreshControl={
                onRefresh ? <RefreshControl refreshing={isLoading} onRefresh={onRefresh} /> : undefined
            }
            ListFooterComponent={isLoading && products.length > 0 ? <Spinner /> : null}
        />
    );
}
