import { useCurrentUser, useActivePartnerSync } from '@app/infrastructure';
import { TopBar, TopBarIconButton } from '@app/ui-kit';
import { BlendSlider } from '@app/ui-kit/components/BlendSlider';
import { Button } from '@app/ui-kit/components/Button';
import { SlidersHorizontal, Users } from '@tamagui/lucide-icons';
import React, { useState } from 'react';
import { SafeAreaView, View } from 'react-native';
import { YStack, XStack, Text } from 'tamagui';

import { SwipeDeck } from '../../components/SwipeDeck';
import { useFilterStore } from '../../store/useFilterStore';
import { SearchFilterOverlay } from '../search/SearchFilterOverlay';
import { GridDiscovery } from './GridDiscovery';

type ViewMode = 'deck' | 'grid';

export function DiscoveryScreen() {
  const { filterState, setFilterState, sort, setSort } = useFilterStore();
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  const user = useCurrentUser();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const activeSyncs = useActivePartnerSync(user?._id) as any[];

  const activeSession = activeSyncs && activeSyncs.length > 0 ? activeSyncs[0] : null;
  const [influenceRatio, setInfluenceRatio] = useState<number>(50);
  const [viewMode, setViewMode] = useState<ViewMode>('deck');

  const handleRatioChange = (val: number) => {
    setInfluenceRatio(val);
  };

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
        {activeSession && (
          <YStack gap="$4" marginBottom="$2">
            <XStack
              alignItems="center"
              justifyContent="center"
              gap="$2"
              backgroundColor="$primaryLight"
              padding="$2"
              borderRadius="$full"
            >
              <YStack width={8} height={8} borderRadius={4} backgroundColor="$success" />
              <Text fontSize="$3" fontWeight="600" color="$primary">
                Partner Syncing with {activeSession.partnerName || 'Partner'}
              </Text>
              <Users size={16} color="$primary" />
            </XStack>

            <BlendSlider
              value={influenceRatio}
              onChange={handleRatioChange}
              partnerName={activeSession.partnerName || 'Partner'}
            />
          </YStack>
        )}
        <XStack justifyContent="center" alignItems="center" gap="$2" paddingBottom="$2">
          <Button variant={viewMode === 'deck' ? 'primary' : 'outlined'} onPress={() => setViewMode('deck')}>
            Deck
          </Button>
          <Button variant={viewMode === 'grid' ? 'primary' : 'outlined'} onPress={() => setViewMode('grid')}>
            Grid
          </Button>
        </XStack>

        <View style={{ flex: 1, display: viewMode === 'deck' ? 'flex' : 'none' }}>
          <SwipeDeck
            filterState={filterState}
            partnerId={activeSession?.partnerId || activeSession?.initiatorId}
            influenceRatio={activeSession ? influenceRatio / 100 : undefined}
          />
        </View>
        <View style={{ flex: 1, display: viewMode === 'grid' ? 'flex' : 'none' }}>
          <GridDiscovery />
        </View>
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
