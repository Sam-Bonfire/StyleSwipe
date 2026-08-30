import { SearchProducts, Embedder, type SearchResult } from '@app/core';
import { useRecordProductView, createProductSearchRepositoryLayer, useConvexClient } from '@app/infrastructure';
import { ProductTile, Button } from '@app/ui-kit';
import { Search } from '@tamagui/lucide-icons';
import { SlidersHorizontal } from '@tamagui/lucide-icons';
import { Effect, Layer } from 'effect';
import { useRouter } from 'expo-router';
import { useState, useEffect } from 'react';
import { SafeAreaView, FlatList } from 'react-native';
import { YStack, Text, Input, XStack, Spinner } from 'tamagui';

import { OnnxEmbedder } from '../../infrastructure/adapters/OnnxEmbedder';
import { useFilterStore } from '../../store/useFilterStore';
import { SearchFilterOverlay } from './SearchFilterOverlay';

export function SearchScreen() {
  const convex = useConvexClient();
  const router = useRouter();
  const recordView = useRecordProductView();

  // State
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult['products']>([]);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const { filterState, setFilterState, sort, setSort } = useFilterStore();
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  // const [filterState, setFilterState] = useState<FilterState>();
  // const [sort, setSort] = useState<SearchQuery['sort']>('RELEVANCE');


  // Debounce Logic
  useEffect(() => {
    const timer = setTimeout(() => {
      if (query.length >= 3) {
        performSearch(query);
      } else {
        setResults([]);
      }

      if (query.length >= 1) {
        fetchSuggestions(query);
      } else {
        setSuggestions([]);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [query, filterState, sort]);


const performSearch = async (text: string) => {
    // Note: The actual SearchProducts usecase doesn't currently accept filters/sort in its ports.
    // In a real implementation we would pass `currentFilters` and `currentSort` down into the layer.
    // We are simulating the update by relying on the usecase to just re-run for now.
    setLoading(true);
    try {
      const embedderLayer = Layer.succeed(Embedder, Embedder.of(new OnnxEmbedder()));
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const repoLayer = createProductSearchRepositoryLayer(convex as any);
      const layer = Layer.merge(embedderLayer, repoLayer);

      await Effect.runPromise(
        SearchProducts.execute(text, 10).pipe(
          Effect.tap((result) => Effect.sync(() => setResults(result.products))),
          Effect.provide(layer),
        ),
      );
    } catch (e) {
      console.error('Search failed', e);
    } finally {
      setLoading(false);
    }
  };

  const fetchSuggestions = async (text: string) => {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const repoLayer = createProductSearchRepositoryLayer(convex as any);
      await Effect.runPromise(
        SearchProducts.getSuggestions(text).pipe(
          Effect.tap((s: string[]) => Effect.sync(() => setSuggestions(s))),
          Effect.provide(repoLayer),
        ),
      );
    } catch (e) {
      console.error('Suggestions failed', e);
    }
  };

  const handleProductPress = (productId: string) => {
    recordView({ productId });
    // Navigate to details
    router.push({ pathname: '/(app)/product/[id]', params: { id: productId } });
  };

  const renderItem = ({ item }: { item: SearchResult['products'][number] }) => {
    const discount =
      item.mrp && item.price < item.mrp
        ? Math.round(((item.mrp - item.price) / item.mrp) * 100)
        : undefined;

    return (
      <YStack width="50%" padding="$1">
        <ProductTile
          imageUrl={item.images[0]}
          brand={item.brand}
          title={item.title}
          price={item.price}
          originalPrice={item.mrp}
          discountPercentage={discount}
          onPress={() => handleProductPress(item.id)}
          size="wide"
        />
      </YStack>
    );
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: 'white' }}>
      <YStack flex={1} padding="$2" gap="$4">
        <YStack gap="$2">
          <XStack gap="$2" alignItems="center">
            <Input
              flex={1}
              placeholder="Search for items..."
              borderWidth={1}
              value={query}
              onChangeText={setQuery}
            />
            <Button
              variant="outlined"
              size="medium"
              onPress={() => setIsFilterOpen(true)}
              icon={<SlidersHorizontal size={20} color="$textSecondary" />}
            />
          </XStack>
          {suggestions.length > 0 && (
            <XStack gap="$2" flexWrap="wrap">
              {suggestions.map((s, i) => (
                <Button key={i} size="small" onPress={() => setQuery(s)}>
                  {s}
                </Button>
              ))}
            </XStack>
          )}
        </YStack>

        {loading ? (
          <YStack flex={1} justifyContent="center" alignItems="center">
            <Spinner size="large" color="$color" />
          </YStack>
        ) : results.length > 0 ? (
          <FlatList
            data={results}
            renderItem={renderItem}
            keyExtractor={(item) => item.id}
            onEndReachedThreshold={0.5}
            contentContainerStyle={{ paddingBottom: 10 }}
            numColumns={2}
          />
        ) : (
          <YStack flex={1} justifyContent="center" alignItems="center">
            <Search size={48} color="$textTertiary" />
            <Text color="$textSecondary" marginTop="$4">
              {query.length > 0 ? 'No results found' : 'Browse the marketplace'}
            </Text>
          </YStack>
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
        }}
      />
    </SafeAreaView>
  );
}
