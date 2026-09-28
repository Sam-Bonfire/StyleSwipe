import { SearchProducts, applyProductFilters, discountPercentage, sortProducts, type SearchResult } from '@app/core';
import {
  useAnalytics,
  useConvexClient,
  usePopularEvents,
  useRecordProductView,
  useRootCategories,
} from '@app/infrastructure';
import { Button, CategoryChip, EmptyState, ProductTile } from '@app/ui-kit';
import { Clock, Search, SlidersHorizontal, TrendingUp, X } from '@tamagui/lucide-icons';
import { Effect } from 'effect';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { FlatList, Pressable, SafeAreaView } from 'react-native';
import { Image, Input, ScrollView, Spinner, Text, XStack, YStack } from 'tamagui';

import { useRecentSearches } from '../../hooks/useRecentSearches';
import { makeSearchLayers, makeSuggestionLayers } from '../../lib/composition';
import { useFilterStore } from '../../store/useFilterStore';
import { SearchFilterDrawer } from './SearchFilterDrawer';

const TRENDING_FALLBACK = ['Oversized Tee', 'Korean Street', 'Sneakers', 'Cargo Pants', 'Linen Shirt', 'Summer Dress'];
const EMPTY_RECOVERY_SUGGESTIONS = ['Oversized Tee', 'Korean Street', 'Sneakers', 'Denim Jacket'];

function buildQueryParams(query: string, filterState: ReturnType<typeof useFilterStore.getState>['filterState'], sort: string): Record<string, string> {
  const params: Record<string, string> = {};
  if (query) params.q = query;
  if (filterState?.categoryIds?.length) params.category = filterState.categoryIds.join(',');
  if (filterState?.brandIds?.length) params.brand = filterState.brandIds.join(',');
  if (filterState?.priceRange?.min !== undefined) params.minPrice = String(filterState.priceRange.min);
  if (filterState?.priceRange?.max !== undefined) params.maxPrice = String(filterState.priceRange.max);
  const genders = (filterState as unknown as { genders?: string[] })?.genders;
  if (genders?.length) params.gender = genders.join(',');
  const onSale = (filterState as unknown as { onSale?: boolean })?.onSale;
  if (onSale) params.onSale = '1';
  if (sort && sort !== 'RELEVANCE') params.sort = sort;
  return params;
}

export function SearchScreen() {
  const convex = useConvexClient();
  const router = useRouter();
  const recordView = useRecordProductView();
  const { trackEvent } = useAnalytics();
  const params = useLocalSearchParams<{
    q?: string;
    brand?: string;
    category?: string;
    minPrice?: string;
    maxPrice?: string;
    gender?: string;
    onSale?: string;
    sort?: string;
  }>();

  const initialQuery = typeof params.q === 'string' ? params.q : '';

  const [query, setQuery] = useState<string>(initialQuery);
  const [results, setResults] = useState<SearchResult['products']>([]);
  const [submittedQuery, setSubmittedQuery] = useState<string>('');
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [trending, setTrending] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  const { filterState, setFilterState, sort, setSort } = useFilterStore();
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  const { recent, add: addRecent, remove: removeRecent, clear: clearRecent } = useRecentSearches();

  const categories = useRootCategories();
  const popularEvents = usePopularEvents(20);

  // Sync query from URL on mount / param change
  useEffect(() => {
    if (typeof params.q === 'string' && params.q !== query) {
      setQuery(params.q);
    }
  }, [params.q]);

  // Trending pills from popular search events (real user queries),
  // falling back to static topics. Never title-search results.
  const fetchTrending = useCallback(async () => {
    const fromEvents: string[] = (popularEvents ?? [])
      .map((e: { metadata?: { title?: string; query?: string } }) => (e.metadata?.title as string) || (e.metadata?.query as string) || '')
      .filter(Boolean)
      .slice(0, 6);
    setTrending(fromEvents.length > 0 ? fromEvents : TRENDING_FALLBACK);
  }, [popularEvents]);

  useEffect(() => {
    void fetchTrending();
  }, [fetchTrending]);

  const performSearch = useCallback(
    async (text: string) => {
      if (text.trim().length < 3) {
        setResults([]);
        setHasSearched(false);
        return;
      }
      setLoading(true);
      setHasSearched(true);
      setSubmittedQuery(text.trim());
      try {
        const result = await Effect.runPromise(
          SearchProducts.execute(text, 10).pipe(
            Effect.provide(makeSearchLayers(convex)),
          ),
        );
        // Client-side result shaping lives in core (applied after vector fetch)
        let filtered = result.products;
        if (filterState) {
          filtered = sortProducts(applyProductFilters(filtered, filterState), sort);
        }
        setResults(filtered);
        // Persist recent only for meaningful queries
        if (text.trim().length >= 2) void addRecent(text.trim());
        void trackEvent('search_performed', { query: text, resultCount: filtered.length, filters: filterState });
      } catch (e) {
        console.error('Search failed', e);
      } finally {
        setLoading(false);
      }
    },
    [convex, filterState, sort, addRecent, trackEvent],
  );

  const fetchSuggestions = useCallback(
    async (text: string) => {
    try {
      const s = await Effect.runPromise(
        SearchProducts.getSuggestions(text, 6).pipe(Effect.provide(makeSuggestionLayers(convex))),
      );
        setSuggestions(s);
      } catch (e) {
        console.error('Suggestions failed', e);
      }
    },
    [convex],
  );

  // Debounce query
  useEffect(() => {
    const timer = setTimeout(() => {
      if (query.length >= 3) {
        void performSearch(query);
      } else if (query.length === 0) {
        // Keep the last results visible (with a header + clear action)
        // instead of dropping back to the idle page.
        setHasSearched(false);
      } else {
        setResults([]);
      }
      if (query.length >= 1) {
        void fetchSuggestions(query);
      } else {
        setSuggestions([]);
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [query, performSearch, fetchSuggestions]);

  // Re-run search when filters change if query exists
  useEffect(() => {
    if (query.length >= 3) {
      void performSearch(query);
    }
  }, [filterState, sort]);

  const handleProductPress = useCallback(
    (productId: string) => {
      void recordView({ productId });
      router.push({ pathname: '/(app)/product/[id]', params: { id: productId } });
    },
    [recordView, router],
  );

  const handleApplyFilters = useCallback(
    (newFilterState: typeof filterState, newSort: typeof sort) => {
      setFilterState(newFilterState as never);
      setSort(newSort);
      const paramsToSet = buildQueryParams(query, newFilterState as never, newSort);
      // Persist to URL/query
      router.setParams(paramsToSet as never);
      void trackEvent('filter_applied', { filters: newFilterState, sort: newSort, query }, { variant: 'search_v1' });
    },
    [query, setFilterState, setSort, router, trackEvent],
  );

  const handleSuggestionPress = useCallback(
    (s: string) => {
      setQuery(s);
      void addRecent(s);
      router.setParams({ q: s } as never);
      void trackEvent('suggestion_clicked', { suggestion: s, query });
    },
    [addRecent, router, trackEvent, query],
  );

  const handleRecentPress = useCallback(
    (s: string) => {
      setQuery(s);
      router.setParams({ q: s } as never);
      void trackEvent('recent_search_clicked', { query: s });
    },
    [router, trackEvent],
  );

  const handleCategoryPress = useCallback(
    (cat: { id: string; slug: string; name: string }) => {
      const slug = cat.slug ?? cat.id;
      const newState = {
        ...(filterState ?? { brandIds: [], categoryIds: [], colors: [], sizes: [], fitTypes: [], merchantNames: [], inStockOnly: false }),
        categoryIds: [slug],
      } as unknown as typeof filterState;
      setFilterState(newState as never);
      router.setParams({ category: slug, q: cat.name } as never);
      setQuery(cat.name);
      void trackEvent('category_browse_clicked', { category: slug, name: cat.name });
    },
    [filterState, setFilterState, router, trackEvent],
  );

  const handleAlertCreate = useCallback(() => {
    void trackEvent('search_alert_created', { query });
  }, [trackEvent, query]);

  const renderItem = useCallback(
    ({ item }: { item: SearchResult['products'][number] }) => {
      const discount =
        discountPercentage(item.price as number, (item as unknown as { mrp?: number }).mrp ?? 0) || undefined;
      return (
        <YStack width="50%" padding="$1">
          <ProductTile
            imageUrl={(item.images as string[])[0]}
            brand={item.brand as string}
            title={item.title as string}
            price={item.price as number}
            originalPrice={(item as unknown as { mrp?: number }).mrp}
            discountPercentage={discount}
            onPress={() => handleProductPress(item.id as string)}
            size="wide"
          />
        </YStack>
      );
    },
    [handleProductPress],
  );

  const showRecent = query.length === 0 && results.length === 0 && recent.length > 0;
  const showBrowse = query.length === 0 && results.length === 0;
  const showEmptyRecovery = !loading && hasSearched && results.length === 0 && query.length >= 3;

  const trendingPills = useMemo(() => (suggestions.length > 0 && query.length >= 1 ? suggestions : trending), [suggestions, trending, query.length]);
  // Once results arrive, they own the space — suggestions collapse until the query changes with no results
  const showSuggestions = query.length >= 1 && suggestions.length > 0 && !(hasSearched && results.length > 0);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: 'white' }}>
      <YStack flex={1} padding="$2" gap="$4">
        <YStack gap="$2">
          <XStack gap="$2" alignItems="center">
            <Input
              flex={1}
              placeholder="Search for items..."
              borderWidth={1}
              borderColor="$borderColor"
              backgroundColor="$surface"
              value={query}
              onChangeText={(t) => {
                setQuery(t);
              }}
              returnKeyType="search"
              onSubmitEditing={() => {
                if (query.trim().length >= 2) void addRecent(query.trim());
              }}
            />
            <Button
              variant="outlined"
              size="medium"
              onPress={() => setIsFilterOpen(true)}
              icon={<SlidersHorizontal size={20} color="$textSecondary" />}
              accessibilityLabel="Open filters"
            />
          </XStack>

          {/* Suggestions pills — hidden once results take over */}
          {showSuggestions ? (
            <XStack gap="$2" flexWrap="wrap">
              {suggestions.map((s, i) => (
                <CategoryChip key={`${s}-${i}`} label={s} onToggle={() => handleSuggestionPress(s)} />
              ))}
            </XStack>
          ) : trendingPills.length > 0 && query.length === 0 && results.length === 0 ? (
            <XStack gap="$2" flexWrap="wrap" alignItems="center">
              <XStack alignItems="center" gap="$1" marginRight="$1">
                <TrendingUp size={14} color="$textSecondary" />
                <Text fontFamily="$body" fontSize="$2" color="$textSecondary" fontWeight="600">
                  Trending
                </Text>
              </XStack>
              {trendingPills.slice(0, 6).map((s, i) => (
                <CategoryChip key={`${s}-${i}`} label={s} variant="filter" onToggle={() => handleSuggestionPress(s)} />
              ))}
            </XStack>
          ) : null}
        </YStack>

        {/* Recent searches: store 5 items, show when query empty */}
        {showRecent && (
          <YStack gap="$2">
            <XStack justifyContent="space-between" alignItems="center">
              <XStack alignItems="center" gap="$1">
                <Clock size={14} color="$textSecondary" />
                <Text fontFamily="$body" fontSize="$3" fontWeight="600" color="$textPrimary">
                  Recent searches
                </Text>
              </XStack>
              <Pressable onPress={() => void clearRecent()}>
                <Text fontFamily="$body" fontSize="$2" color="$primary" fontWeight="600">
                  Clear
                </Text>
              </Pressable>
            </XStack>
            <XStack gap="$2" flexWrap="wrap">
              {recent.map((r) => (
                <XStack
                  key={r}
                  alignItems="center"
                  backgroundColor="$neutral100"
                  borderRadius="$full"
                  paddingLeft="$2"
                  paddingRight="$1"
                  height={32}
                  gap="$1"
                >
                  <Pressable onPress={() => handleRecentPress(r)}>
                    <Text fontFamily="$body" fontSize="$3" color="$textPrimary">
                      {r}
                    </Text>
                  </Pressable>
                  <Pressable
                    onPress={() => void removeRecent(r)}
                    style={{ padding: 4 }}
                    accessibilityLabel={`Remove ${r}`}
                  >
                    <X size={12} color="$textSecondary" />
                  </Pressable>
                </XStack>
              ))}
            </XStack>
          </YStack>
        )}

        {showBrowse && (
          <ScrollView flex={1} showsVerticalScrollIndicator={false}>
            <YStack gap="$4" paddingBottom="$6">
              {/* Category browse grid */}
              <YStack gap="$2">
                <Text fontFamily="$heading" fontSize="$5" fontWeight="700" color="$textPrimary">
                  Browse Categories
                </Text>
                {categories === undefined ? (
                  <XStack justifyContent="center" padding="$4">
                    <Spinner size="small" color="$primary" />
                  </XStack>
                ) : categories && categories.length > 0 ? (
                  <XStack flexWrap="wrap" gap="$2">
                    {categories.slice(0, 8).map((cat: { _id: string; name: string; image?: string }) => (
                      <Pressable key={cat._id} onPress={() => handleCategoryPress(cat as unknown as never)} style={{ width: '48%' }}>
                        <YStack
                          backgroundColor="$neutral100"
                          borderRadius="$3"
                          overflow="hidden"
                          borderWidth={1}
                          borderColor="$borderColor"
                        >
                          {cat.image ? (
                            <Image source={{ uri: cat.image }} src={cat.image} width="100%" height={90} resizeMode="cover" style={{ objectFit: 'cover' }} />
                          ) : (
                            <YStack height={90} backgroundColor="$neutral200" alignItems="center" justifyContent="center">
                              <Text fontFamily="$body" color="$textSecondary" fontSize="$3">
                                {cat.name}
                              </Text>
                            </YStack>
                          )}
                          <YStack padding="$2" backgroundColor="$surface">
                            <Text fontFamily="$body" fontWeight="600" fontSize="$3" color="$textPrimary" numberOfLines={1}>
                              {cat.name}
                            </Text>
                            <Text fontFamily="$body" fontSize="$2" color="$textSecondary">
                              Explore
                            </Text>
                          </YStack>
                        </YStack>
                      </Pressable>
                    ))}
                  </XStack>
                ) : (
                  <Text fontFamily="$body" color="$textSecondary">No categories yet</Text>
                )}
              </YStack>
            </YStack>
          </ScrollView>
        )}

        {!showBrowse && (
          <>
            {loading ? (
              <YStack flex={1} justifyContent="center" alignItems="center">
                <Spinner size="large" color="$primary" />
              </YStack>
            ) : showEmptyRecovery ? (
              <YStack flex={1} gap="$3">
                <EmptyState
                  type="search"
                  title={`No results for "${query}"`}
                  description="Try adjusting filters or search for something else"
                  actionLabel={`Create alert for "${query}"`}
                  onAction={handleAlertCreate}
                />
                <YStack gap="$2" paddingHorizontal="$2">
                  <Text fontFamily="$body" fontWeight="600" color="$textPrimary">
                    Try these searches
                  </Text>
                  <XStack gap="$2" flexWrap="wrap">
                    {EMPTY_RECOVERY_SUGGESTIONS.map((s) => (
                      <CategoryChip key={s} label={s} onToggle={() => handleSuggestionPress(s)} />
                    ))}
                  </XStack>
                  {filterState && (filterState.categoryIds.length > 0 || filterState.brandIds.length > 0) && (
                    <Button variant="ghost" size="small" onPress={() => handleApplyFilters({ brandIds: [], categoryIds: [], colors: [], sizes: [], fitTypes: [], merchantNames: [], inStockOnly: false } as never, 'RELEVANCE')}>
                      Clear filters
                    </Button>
                  )}
                </YStack>
              </YStack>
            ) : results.length > 0 ? (
              <>
                <XStack justifyContent="space-between" alignItems="center" paddingHorizontal="$2">
                  <Text fontFamily="$body" fontSize="$3" color="$textSecondary">
                    {results.length} result{results.length === 1 ? '' : 's'}
                    {submittedQuery ? ` for "${submittedQuery}"` : ''}
                  </Text>
                  <Pressable
                    onPress={() => {
                      setResults([]);
                      setHasSearched(false);
                      setSubmittedQuery('');
                    }}
                  >
                    <Text fontFamily="$body" fontSize="$2" color="$primary" fontWeight="600">
                      Clear
                    </Text>
                  </Pressable>
                </XStack>
                <FlatList
                  data={results}
                  renderItem={renderItem}
                  keyExtractor={(item) => String(item.id)}
                  numColumns={2}
                  onEndReachedThreshold={0.5}
                  contentContainerStyle={{ paddingBottom: 16 }}
                />
              </>
            ) : query.length >= 3 ? (
              <YStack flex={1} justifyContent="center" alignItems="center">
                <Search size={48} color="$textTertiary" />
                <Text fontFamily="$body" color="$textSecondary" marginTop="$4">
                  No results found
                </Text>
              </YStack>
            ) : query.length > 0 ? (
              <YStack flex={1} justifyContent="center" alignItems="center">
                <Text fontFamily="$body" color="$textSecondary">Type at least 3 characters to search</Text>
              </YStack>
            ) : null}
          </>
        )}
      </YStack>

      <SearchFilterDrawer
        open={isFilterOpen}
        onOpenChange={setIsFilterOpen}
        initialFilterState={filterState}
        initialSort={sort}
        categories={categories as unknown as never}
        onApplyFilters={handleApplyFilters}
      />
    </SafeAreaView>
  );
}
