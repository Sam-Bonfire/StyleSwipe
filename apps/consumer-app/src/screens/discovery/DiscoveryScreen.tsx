import { TopBar, TopBarIconButton } from '@app/ui-kit';
import { SlidersHorizontal } from '@tamagui/lucide-icons';
import React from 'react';
import { useState } from 'react';
import { SafeAreaView } from 'react-native';
import { YStack } from 'tamagui';

import { SwipeDeck } from '../../components/SwipeDeck';
import { useFilterStore } from '../../store/useFilterStore';
import { SearchFilterOverlay } from '../search/SearchFilterOverlay';

export function DiscoveryScreen() {
  const { filterState, setFilterState, sort, setSort } = useFilterStore();
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  // const [filterState, setFilterState] = useState<FilterState>();
  // const [sort, setSort] = useState<SearchQuery['sort']>('RELEVANCE');

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: 'white' }}>
      <TopBar
        title="Discovery"
        showSearch={false}
        showWishlist={false}
        showCart={false}
        showAddress={false}
        rightContent={
          <TopBarIconButton onPress={() => setIsFilterOpen(true)}>
            <SlidersHorizontal size={22} color="$textPrimary" />
          </TopBarIconButton>
        }
      />
      <YStack flex={1} padding="$4" gap="$4">
        <SwipeDeck filterState={filterState} />
      </YStack>

      <SearchFilterOverlay
        isOpen={isFilterOpen}
        onClose={() => setIsFilterOpen(false)}
        initialFilterState={filterState}
        initialSort={sort}
        onApplyFilters={(newFilterState, newSort) => {
          setFilterState(newFilterState);
          setSort(newSort);
          // Normally would refetch feed here with new filters
        }}
      />
    </SafeAreaView>
  );
}
