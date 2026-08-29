import { FilterState, FilterStateSchema, SearchQuery } from '@app/core';
import { Modal, Button, BudgetSlider, CategoryChip, DEFAULT_BUDGET_BANDS, SearchBar } from '@app/ui-kit';
import React, { useState, useEffect } from 'react';
import { ScrollView } from 'react-native';
import { YStack, XStack, Text } from 'tamagui';

export interface SearchFilterOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  initialFilterState?: FilterState;
  initialSort?: SearchQuery['sort'];
  onApplyFilters: (filterState: FilterState, sort: SearchQuery['sort']) => void;
}

// Hardcoded facets for now, ideally passed from backend facets
const GENDERS = ['Men', 'Women', 'Unisex'];
const CATEGORIES = ['T-Shirts', 'Shirts', 'Jeans', 'Sneakers', 'Accessories'];
const BRANDS = ['Nike', 'Adidas', 'Zara', 'H&M', 'Puma'];

export function SearchFilterOverlay({
  isOpen,
  onClose,
  initialFilterState,
  initialSort = 'RELEVANCE',
  onApplyFilters,
}: SearchFilterOverlayProps) {
  const [localFilterState, setLocalFilterState] = useState<FilterState>(
    initialFilterState || FilterStateSchema.parse({ brandIds: [], categoryIds: [], colors: [], sizes: [], fitTypes: [], merchantNames: [], inStockOnly: false })
  );
  const [localSort, setLocalSort] = useState<SearchQuery['sort']>(initialSort);
  const [brandSearch, setBrandSearch] = useState('');

  // Sync when overlay opens
  useEffect(() => {
    if (isOpen) {
      setLocalFilterState(initialFilterState || FilterStateSchema.parse({ brandIds: [], categoryIds: [], colors: [], sizes: [], fitTypes: [], merchantNames: [], inStockOnly: false }));
      setLocalSort(initialSort);
    }
  }, [isOpen, initialFilterState, initialSort]);

  const handleApply = () => {
    try {
      const validatedState = FilterStateSchema.parse(localFilterState);
      onApplyFilters(validatedState, localSort);
      onClose();
    } catch (e) {
      console.error('Invalid filter state', e);
    }
  };

  const handleClear = () => {
    setLocalFilterState(FilterStateSchema.parse({}));
    setLocalSort('RELEVANCE');
  };

  const toggleGender = (gender: string) => {
    // We map gender to fitTypes for now, or just handle it as string arrays if that matches the API
    setLocalFilterState((prev) => {
      const isSelected = prev.fitTypes.includes(gender);
      return {
        ...prev,
        fitTypes: isSelected
          ? prev.fitTypes.filter((f) => f !== gender)
          : [...prev.fitTypes, gender],
      };
    });
  };

  const toggleCategory = (category: string) => {
    setLocalFilterState((prev) => {
      const isSelected = prev.categoryIds.includes(category);
      return {
        ...prev,
        categoryIds: isSelected
          ? prev.categoryIds.filter((c) => c !== category)
          : [...prev.categoryIds, category],
      };
    });
  };

  const toggleBrand = (brand: string) => {
    setLocalFilterState((prev) => {
      const isSelected = prev.brandIds.includes(brand);
      return {
        ...prev,
        brandIds: isSelected
          ? prev.brandIds.filter((b) => b !== brand)
          : [...prev.brandIds, brand],
      };
    });
  };

  const getSelectedBandId = () => {
    if (!localFilterState.priceRange) return null;
    const { min, max } = localFilterState.priceRange;
    const band = DEFAULT_BUDGET_BANDS.find(b => b.minValue === (min || 0) && b.maxValue === max);
    return band?.id || null;
  };

  const handleBandSelect = (bandId: string) => {
    const band = DEFAULT_BUDGET_BANDS.find(b => b.id === bandId);
    if (band) {
      setLocalFilterState(prev => ({
        ...prev,
        priceRange: {
          min: band.minValue,
          max: band.maxValue === null ? undefined : band.maxValue
        }
      }));
    }
  };

  const SORT_OPTIONS: { label: string, value: SearchQuery['sort'] }[] = [
    { label: 'Recommended', value: 'RELEVANCE' },
    { label: 'Price: Low to High', value: 'PRICE_ASC' },
    { label: 'Price: High to Low', value: 'PRICE_DESC' },
    { label: 'Newest', value: 'NEWEST' },
  ];

  return (
    <Modal open={isOpen} onClose={onClose} title="Filters" showCloseButton closeOnBackdrop>
      <ScrollView showsVerticalScrollIndicator={false}>
        <YStack gap="$4" paddingVertical="$2">
          {/* Gender */}
          <YStack gap="$2">
            <Text fontFamily="$heading" fontSize="$4" fontWeight="600">Gender</Text>
            <XStack gap="$2" flexWrap="wrap">
              {GENDERS.map((gender) => (
                <CategoryChip
                  key={gender}
                  label={gender}
                  selected={localFilterState.fitTypes.includes(gender)}
                  onToggle={() => toggleGender(gender)}
                />
              ))}
            </XStack>
          </YStack>

          {/* Categories */}
          <YStack gap="$2">
            <Text fontFamily="$heading" fontSize="$4" fontWeight="600">Categories</Text>
            <XStack gap="$2" flexWrap="wrap">
              {CATEGORIES.map((cat, index) => (
                <CategoryChip
                  key={cat}
                  label={`${cat} (${(index + 1) * 12})`}
                  selected={localFilterState.categoryIds.includes(cat)}
                  onToggle={() => toggleCategory(cat)}
                />
              ))}
            </XStack>
          </YStack>

          {/* Price Range */}
          <YStack gap="$2">
            <Text fontFamily="$heading" fontSize="$4" fontWeight="600">Price Range</Text>
            <BudgetSlider
              bands={DEFAULT_BUDGET_BANDS}
              selectedBandId={getSelectedBandId()}
              onBandSelect={handleBandSelect}
              showVisualSlider={false}
            />
          </YStack>

          {/* Brands */}
          <YStack gap="$2">
            <Text fontFamily="$heading" fontSize="$4" fontWeight="600">Brands</Text>
            <SearchBar
              value={brandSearch}
              onChangeText={setBrandSearch}
              placeholder="Search brands..."
              marginBottom="$2"
            />
            <XStack gap="$2" flexWrap="wrap">
              {BRANDS.filter(b => b.toLowerCase().includes(brandSearch.toLowerCase())).map((brand) => (
                <CategoryChip
                  key={brand}
                  label={brand}
                  selected={localFilterState.brandIds.includes(brand)}
                  onToggle={() => toggleBrand(brand)}
                />
              ))}
            </XStack>
          </YStack>

          {/* Sort */}
          <YStack gap="$2">
            <Text fontFamily="$heading" fontSize="$4" fontWeight="600">Sort By</Text>
            <XStack gap="$2" flexWrap="wrap">
              {SORT_OPTIONS.map((opt) => (
                <CategoryChip
                  key={opt.value}
                  label={opt.label}
                  selected={localSort === opt.value}
                  onToggle={() => setLocalSort(opt.value)}
                />
              ))}
            </XStack>
          </YStack>
        </YStack>
      </ScrollView>

      {/* Footer */}
      <XStack gap="$2" paddingTop="$4" borderTopWidth={1} borderTopColor="$borderColor">
        <Button variant="outlined" flex={1} onPress={handleClear}>
          Clear All
        </Button>
        <Button variant="primary" flex={2} onPress={handleApply}>
          Apply Filters (24 results)
        </Button>
      </XStack>
    </Modal>
  );
}
