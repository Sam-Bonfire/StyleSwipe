import { useCurrentUser, useActivePartnerSync, useFeatureFlag, useUpdateSyncInfluence } from '@app/infrastructure';
import { TopBar, TopBarIconButton } from '@app/ui-kit';
import { BlendSlider } from '@app/ui-kit/components/BlendSlider';
import { Button } from '@app/ui-kit/components/Button';
import { SlidersHorizontal, Users, X } from '@tamagui/lucide-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
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
  // Grid view is experimental — hidden unless the discover_grid flag is on.
  // Missing/disabled row means OFF, so deck is the default while loading too.
  const gridEnabled = useFeatureFlag('discover_grid') === true;
  const router = useRouter();
  const persistInfluence = useUpdateSyncInfluence();
  const persistTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Blend persists on the session (0 = your own feed, sticks across reloads).
  useEffect(() => {
    if (activeSession && typeof activeSession.influenceRatio === 'number') {
      setInfluenceRatio(Math.round(activeSession.influenceRatio * 100));
    }
  }, [activeSession?._id]);

  useEffect(() => {
    return () => {
      if (persistTimer.current) clearTimeout(persistTimer.current);
    };
  }, []);

  const handleRatioChange = (val: number) => {
    setInfluenceRatio(val);
    if (!activeSession) return;
    if (persistTimer.current) clearTimeout(persistTimer.current);
    persistTimer.current = setTimeout(() => {
      void persistInfluence(activeSession._id, val / 100).catch((e: unknown) =>
        console.error('Failed to persist blend ratio', e),
      );
    }, 800);
  };

  // One-time "session ended" notice: the banner vanishing alone (partner
  // stopped, invite expired) leaves users wondering where their blend went.
  // This also confirms a deliberate exit — you're back to your own feed.
  const lastSession = useRef<{ id: string; name: string } | null>(null);
  const [endedNotice, setEndedNotice] = useState<string | null>(null);
  useEffect(() => {
    if (activeSession) {
      lastSession.current = {
        id: activeSession._id as string,
        name: (activeSession.partnerName as string) || 'Partner',
      };
      setEndedNotice(null);
    } else if (lastSession.current) {
      setEndedNotice(
        `Back to your own feed — ${lastSession.current.name} is no longer syncing.`,
      );
      lastSession.current = null;
    }
  }, [activeSession]);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: 'white' }}>
      <TopBar
        title="Discovery"
        showSearch={false}
        showWishlist={false}
        showCart={false}
        showAddress={false}
        rightContent={
          <TopBarIconButton onPress={() => setIsFilterOpen(true)} testID="discover-filter-button" accessibilityLabel="Open filters">
            <SlidersHorizontal size={22} color="$textPrimary" />
          </TopBarIconButton>
        }
      />
      <YStack flex={1} padding="$4" gap="$4">
        {endedNotice && !activeSession && (
          <XStack
            backgroundColor="$surface"
            borderRadius="$3"
            borderWidth={1}
            borderColor="$borderColor"
            padding="$3"
            gap="$2"
            alignItems="center"
          >
            <YStack flex={1} gap="$2">
              <Text fontFamily="$body" fontSize="$3" color="$textPrimary">
                {endedNotice}
              </Text>
              <Text
                fontFamily="$body"
                fontSize="$3"
                fontWeight="600"
                color="$primary"
                onPress={() => {
                  setEndedNotice(null);
                  router.push('/(app)/partner-sync');
                }}
              >
                Sync again
              </Text>
            </YStack>
            <YStack
              onPress={() => setEndedNotice(null)}
              padding="$2"
              cursor="pointer"
              accessibilityLabel="Dismiss"
            >
              <X size={18} color="$textSecondary" />
            </YStack>
          </XStack>
        )}
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
              <Text fontFamily="$body" fontSize="$3" fontWeight="600" color="$primary">
                Partner Syncing with {activeSession.partnerName || 'Partner'}
              </Text>
              <Users size={16} color="$primary" />
            </XStack>

            <BlendSlider
              value={influenceRatio}
              onChange={handleRatioChange as unknown as never}
              partnerName={activeSession.partnerName || 'Partner'}
            />
          </YStack>
        )}
        {gridEnabled && (
          <XStack justifyContent="center" alignItems="center" gap="$2" paddingBottom="$2">
            <Button variant={viewMode === 'deck' ? 'primary' : 'outlined'} onPress={() => setViewMode('deck')}>
              Deck
            </Button>
            <Button variant={viewMode === 'grid' ? 'primary' : 'outlined'} onPress={() => setViewMode('grid')}>
              Grid
            </Button>
          </XStack>
        )}

        <View style={{ flex: 1, display: viewMode === 'deck' ? 'flex' : 'none' }}>
          <SwipeDeck
            filterState={filterState}
            sort={sort}
            partnerId={activeSession?.partnerId || activeSession?.initiatorId}
            influenceRatio={activeSession ? influenceRatio / 100 : undefined}
            sharedBoardId={activeSession?.sharedBoardId as string | undefined}
          />
        </View>
        {gridEnabled && (
          <View style={{ flex: 1, display: viewMode === 'grid' ? 'flex' : 'none' }}>
            <GridDiscovery />
          </View>
        )}
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
