import { Id, api } from '@app/convex';
import { SearchProducts } from '@app/core';
import { Product } from '@app/core';
import { ProductTile, Button } from '@app/ui-kit';
import { useNavigation } from '@react-navigation/native';
import { Search } from '@tamagui/lucide-icons';
import { useConvex, useMutation } from 'convex/react';
import { Effect } from 'effect';
import React, { useState, useEffect, useMemo } from 'react';
import { SafeAreaView, FlatList } from 'react-native';
import { YStack, Text, Input, XStack, Spinner } from 'tamagui';

import { ConvexProductAdapter } from '../../infrastructure/adapters/ConvexProductAdapter';
import { OnnxEmbedder } from '../../infrastructure/adapters/OnnxEmbedder';

export function SearchScreen() {
  const convex = useConvex();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const navigation = useNavigation<any>();
  const recordView = useMutation(api.discovery.recordProductView);

  // Dependencies
  const useCase = useMemo(() => {
    const embedder = new OnnxEmbedder();
    const repo = new ConvexProductAdapter(convex);
    return new SearchProducts(embedder, repo);
  }, [convex]);

  // State
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Product[]>([]);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

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
  }, [query]);

  const performSearch = async (text: string) => {
    setLoading(true);
    try {
      await Effect.runPromise(
        useCase
          .execute(text, 10)
          .pipe(Effect.tap((result) => Effect.sync(() => setResults(result.products)))),
      );
    } catch (e) {
      console.error('Search failed', e);
    } finally {
      setLoading(false);
    }
  };

  const fetchSuggestions = async (text: string) => {
    try {
      await Effect.runPromise(
        useCase.getSuggestions(text).pipe(Effect.tap((s) => Effect.sync(() => setSuggestions(s)))),
      );
    } catch (e) {
      console.error('Suggestions failed', e);
    }
  };

  const handleProductPress = (productId: string) => {
    // Record view event
    // Record view event
    recordView({ productId: productId as Id<'products'> });
    // Navigate to details
    navigation.navigate('ProductDetail', { productId });
  };

  const renderItem = ({ item }: { item: Product }) => {
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
      <YStack flex={1} padding="$2" space="$4">
        <YStack space="$2">
          <Input
            placeholder="Search for items..."
            borderWidth={1}
            value={query}
            onChangeText={setQuery}
          />
          {suggestions.length > 0 && (
            <XStack space="$2" flexWrap="wrap">
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
    </SafeAreaView>
  );
}
