import type { Category, FilterState, SortOption } from '@app/core';

import { FilterStateSchema } from '@app/core';
import { BudgetSlider, Button, CategoryChip, DEFAULT_BUDGET_BANDS, SearchBar } from '@app/ui-kit';
import React, { useEffect, useState } from 'react';
import { ScrollView } from 'react-native';
import { Separator, Sheet, Switch, Text, XStack, YStack } from 'tamagui';

export interface SearchFilterDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialFilterState?: FilterState;
  initialSort?: SortOption;
  onApplyFilters: (filterState: FilterState, sort: SortOption) => void;
  categories?: Category[] | null;
}

const GENDERS: Array<{ label: string; value: 'men' | 'women' | 'unisex' }> = [
  { label: 'Men', value: 'men' },
  { label: 'Women', value: 'women' },
  { label: 'Unisex', value: 'unisex' },
];

const FALLBACK_BRANDS = ['Nike', 'Adidas', 'Zara', 'H&M', 'Puma', 'Levis', 'Myntra', 'Ajio'];

const SORT_OPTIONS: Array<{ label: string; value: SortOption }> = [
  { label: 'Recommended', value: 'RELEVANCE' },
  { label: 'Price: Low to High', value: 'PRICE_ASC' },
  { label: 'Price: High to Low', value: 'PRICE_DESC' },
  { label: 'Newest', value: 'NEWEST' },
];

const defaultState = (): FilterState =>
  FilterStateSchema.parse({
    brandIds: [],
    categoryIds: [],
    colors: [],
    sizes: [],
    fitTypes: [],
    merchantNames: [],
    inStockOnly: false,
    genders: [],
    onSale: false,
  });

export function SearchFilterDrawer({
  open,
  onOpenChange,
  initialFilterState,
  initialSort = 'RELEVANCE',
  onApplyFilters,
  categories,
}: SearchFilterDrawerProps) {
  const [localFilterState, setLocalFilterState] = useState<FilterState>(initialFilterState ?? defaultState());
  const [localSort, setLocalSort] = useState<SortOption>(initialSort);
  const [brandSearch, setBrandSearch] = useState('');

  useEffect(() => {
    if (open) {
      setLocalFilterState(initialFilterState ?? defaultState());
      setLocalSort(initialSort);
      setBrandSearch('');
    }
  }, [open, initialFilterState, initialSort]);

  const handleApply = () => {
    try {
      const validated = FilterStateSchema.parse(localFilterState);
      onApplyFilters(validated, localSort);
      onOpenChange(false);
    } catch (e) {
      console.error('Invalid filter state', e);
    }
  };

  const handleClear = () => {
    setLocalFilterState(defaultState());
    setLocalSort('RELEVANCE');
  };

  const toggleGender = (gender: 'men' | 'women' | 'unisex') => {
    setLocalFilterState((prev) => {
      const arr = (prev.genders ?? []) as string[];
      const isSelected = arr.includes(gender);
      return {
        ...prev,
        genders: isSelected ? arr.filter((g) => g !== gender) : [...arr, gender],
      } as FilterState;
    });
  };

  const toggleCategory = (catId: string) => {
    setLocalFilterState((prev) => {
      const isSelected = prev.categoryIds.includes(catId);
      return {
        ...prev,
        categoryIds: isSelected ? prev.categoryIds.filter((c) => c !== catId) : [...prev.categoryIds, catId],
      };
    });
  };

  const toggleBrand = (brand: string) => {
    setLocalFilterState((prev) => {
      const isSelected = prev.brandIds.includes(brand);
      return {
        ...prev,
        brandIds: isSelected ? prev.brandIds.filter((b) => b !== brand) : [...prev.brandIds, brand],
      };
    });
  };

  const getSelectedBandId = (): string | null => {
    if (!localFilterState.priceRange) return null;
    const { min, max } = localFilterState.priceRange;
    const band = DEFAULT_BUDGET_BANDS.find((b) => b.minValue === (min ?? 0) && b.maxValue === max);
    return band?.id ?? null;
  };

  const handleBandSelect = (bandId: string) => {
    const band = DEFAULT_BUDGET_BANDS.find((b) => b.id === bandId);
    if (band) {
      setLocalFilterState((prev) => ({
        ...prev,
        priceRange: {
          min: band.minValue,
          max: band.maxValue === null ? undefined : band.maxValue,
        },
      }));
    }
  };

  const visibleBrands = FALLBACK_BRANDS.filter((b) => b.toLowerCase().includes(brandSearch.toLowerCase()));

  const categoryItems = categories ?? [];

  return (
    <Sheet modal open={open} onOpenChange={onOpenChange} snapPoints={[85]} dismissOnSnapToBottom>
      <Sheet.Overlay backgroundColor="rgba(0,0,0,0.5)" />
      <Sheet.Frame backgroundColor="$background" borderTopLeftRadius="$5" borderTopRightRadius="$5" paddingBottom="$4">
        <Sheet.Handle backgroundColor="$borderColor" height={5} width={40} marginVertical="$3" alignSelf="center" />
        <YStack flex={1} paddingHorizontal="$4" gap="$3">
          <XStack justifyContent="space-between" alignItems="center">
            <Text fontFamily="$heading" fontSize="$6" fontWeight="700" color="$textPrimary">
              Filters
            </Text>
            <Button variant="ghost" size="small" onPress={handleClear}>
              Clear All
            </Button>
          </XStack>
          <Separator borderColor="$borderColor" />
          <ScrollView showsVerticalScrollIndicator={false} style={{ flex: 1 }}>
            <YStack gap="$5" paddingVertical="$2" paddingBottom="$6">
              {/* Gender */}
              <YStack gap="$2">
                <Text fontFamily="$heading" fontSize="$4" fontWeight="600" color="$textPrimary">
                  Gender
                </Text>
                <XStack gap="$2" flexWrap="wrap">
                  {GENDERS.map((g) => (
                    <CategoryChip
                      key={g.value}
                      label={g.label}
                      selected={(localFilterState.genders ?? []).includes(g.value)}
                      onToggle={() => toggleGender(g.value)}
                    />
                  ))}
                </XStack>
              </YStack>

              {/* Categories from categories.by_parent */}
              <YStack gap="$2">
                <Text fontFamily="$heading" fontSize="$4" fontWeight="600" color="$textPrimary">
                  Category
                </Text>
                {categoryItems.length === 0 ? (
                  <Text color="$textSecondary" fontSize="$3">
                    No categories available
                  </Text>
                ) : (
                  <XStack gap="$2" flexWrap="wrap">
                    {categoryItems.map((cat) => (
                      <CategoryChip
                        key={cat.id}
                        label={cat.name}
                        selected={localFilterState.categoryIds.includes(cat.slug ?? cat.id)}
                        onToggle={() => toggleCategory(cat.slug ?? cat.id)}
                      />
                    ))}
                  </XStack>
                )}
              </YStack>

              {/* Price slider budget.min/max */}
              <YStack gap="$2">
                <Text fontFamily="$heading" fontSize="$4" fontWeight="600" color="$textPrimary">
                  Price Range
                </Text>
                <BudgetSlider bands={DEFAULT_BUDGET_BANDS} selectedBandId={getSelectedBandId()} onBandSelect={handleBandSelect} showVisualSlider={false} />
              </YStack>

              {/* Brand typeahead */}
              <YStack gap="$2">
                <Text fontFamily="$heading" fontSize="$4" fontWeight="600" color="$textPrimary">
                  Brand
                </Text>
                <SearchBar value={brandSearch} onChangeText={setBrandSearch} placeholder="Search brands..." />
                <XStack gap="$2" flexWrap="wrap" marginTop="$2">
                  {visibleBrands.map((brand) => (
                    <CategoryChip key={brand} label={brand} selected={localFilterState.brandIds.includes(brand)} onToggle={() => toggleBrand(brand)} />
                  ))}
                </XStack>
              </YStack>

              {/* Gender alternative already above, On Sale toggle */}
              <YStack gap="$2">
                <XStack justifyContent="space-between" alignItems="center" backgroundColor="$neutral100" padding="$3" borderRadius="$3">
                  <YStack>
                    <Text fontWeight="600" color="$textPrimary">
                      On Sale
                    </Text>
                    <Text fontSize="$2" color="$textSecondary">
                      Show only discounted items
                    </Text>
                  </YStack>
                  <Switch
                    size="$3"
                    checked={(localFilterState as unknown as FilterState & { onSale?: boolean }).onSale ?? false}
                    onCheckedChange={(checked) => setLocalFilterState((prev) => ({ ...prev, onSale: checked }) as FilterState)}
                    backgroundColor="$borderColor"
                  >
                    <Switch.Thumb backgroundColor="white" />
                  </Switch>
                </XStack>
              </YStack>

              {/* Sort */}
              <YStack gap="$2">
                <Text fontFamily="$heading" fontSize="$4" fontWeight="600" color="$textPrimary">
                  Sort By
                </Text>
                <XStack gap="$2" flexWrap="wrap">
                  {SORT_OPTIONS.map((opt) => (
                    <CategoryChip key={opt.value} label={opt.label} selected={localSort === opt.value} onToggle={() => setLocalSort(opt.value)} />
                  ))}
                </XStack>
              </YStack>
            </YStack>
          </ScrollView>

          <XStack gap="$2" paddingTop="$3" borderTopWidth={1} borderTopColor="$borderColor">
            <Button variant="outlined" flex={1} onPress={handleClear}>
              Clear All
            </Button>
            <Button variant="primary" flex={2} onPress={handleApply}>
              Apply Filters
            </Button>
          </XStack>
        </YStack>
      </Sheet.Frame>
    </Sheet>
  );
}
