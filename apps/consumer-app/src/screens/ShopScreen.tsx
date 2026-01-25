import React, { useState } from 'react';
import { SafeAreaView } from 'react-native';
import { YStack, Input, XStack } from 'tamagui';
import { usePaginatedQuery } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { FilterBar, FilterState } from '../components/shop/FilterBar';
import { ProductGrid } from '../components/shop/ProductGrid';
import { Search } from '@tamagui/lucide-icons'; // Assuming UI kit exports or direct dep

export function ShopScreen() {
    const [queryText, setQueryText] = useState("");
    const [filters, setFilters] = useState<FilterState>({});

    const { results, status, loadMore } = usePaginatedQuery(
        api.catalog.searchProducts,
        {
            query: queryText || undefined,
            filters
        },
        { initialNumItems: 20 }
    );

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: 'white' }}>
            <YStack flex={1} space="$2">
                {/* Search Header */}
                <YStack paddingHorizontal="$4" paddingTop="$2">
                    <XStack alignItems="center" space="$2" borderBottomWidth={1} borderColor="$gray4" paddingBottom="$2">
                        <Search size={20} color="$gray10" />
                        <Input
                            flex={1}
                            placeholder="Search t-shirts, sneakers..."
                            borderWidth={0}
                            backgroundColor="transparent"
                            value={queryText}
                            onChangeText={setQueryText}
                        />
                    </XStack>
                </YStack>

                {/* Filter Bar */}
                <FilterBar filters={filters} onFilterChange={setFilters} />

                {/* Grid */}
                <ProductGrid
                    products={results}
                    isLoading={status === "LoadingMore" || status === "LoadingFirstPage"}
                    onEndReached={() => {
                        if (status === "CanLoadMore") loadMore(20);
                    }}
                />
            </YStack>
        </SafeAreaView>
    );
}
