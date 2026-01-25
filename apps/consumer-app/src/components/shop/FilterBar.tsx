import React from 'react';
import { ScrollView } from 'react-native';
import { XStack, Button, Text } from 'tamagui';

export interface FilterState {
    gender?: 'men' | 'women' | 'unisex';
    priceTier?: 'budget' | 'mid' | 'premium' | 'luxury';
    onSale?: boolean;
}

interface FilterBarProps {
    filters: FilterState;
    onFilterChange: (newFilters: FilterState) => void;
}

export function FilterBar({ filters, onFilterChange }: FilterBarProps) {
    const toggleGender = (g: FilterState['gender']) => {
        onFilterChange({ ...filters, gender: filters.gender === g ? undefined : g });
    };

    const togglePrice = (p: FilterState['priceTier']) => {
        onFilterChange({ ...filters, priceTier: filters.priceTier === p ? undefined : p });
    };

    const toggleSale = () => {
        onFilterChange({ ...filters, onSale: !filters.onSale });
    };

    return (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexGrow: 0 }}>
            <XStack space="$2" paddingHorizontal="$4" paddingVertical="$2">
                {/* Gender Filters */}
                <Button
                    size="$2"
                    theme={filters.gender === 'men' ? "active" : undefined}
                    onPress={() => toggleGender('men')}
                >
                    Men
                </Button>
                <Button
                    size="$2"
                    theme={filters.gender === 'women' ? "active" : undefined}
                    onPress={() => toggleGender('women')}
                >
                    Women
                </Button>

                {/* Separator */}
                <Text color="$gray8">|</Text>

                {/* Price Filters */}
                <Button
                    size="$2"
                    theme={filters.priceTier === 'budget' ? "active" : undefined}
                    onPress={() => togglePrice('budget')}
                >
                    Budget ($)
                </Button>
                <Button
                    size="$2"
                    theme={filters.priceTier === 'luxury' ? "active" : undefined}
                    onPress={() => togglePrice('luxury')}
                >
                    Luxury ($$$)
                </Button>

                {/* Sale Filter */}
                <Button
                    size="$2"
                    theme={filters.onSale ? "active" : undefined} // Need to define 'active' theme or use bg color
                    backgroundColor={filters.onSale ? "$red8" : undefined}
                    onPress={toggleSale}
                >
                    On Sale
                </Button>
            </XStack>
        </ScrollView>
    );
}
