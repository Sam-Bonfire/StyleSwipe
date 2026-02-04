import { Button, SearchBar, useToast } from '@app/ui-kit';
import { api } from '@convex-api';
import { usePaginatedQuery, useMutation, useQuery } from 'convex/react';
import React, { useState, useEffect } from 'react';
import { YStack, Text, Card, H3, XStack, ScrollView, Spinner, Image } from 'tamagui';
import { AlertCircle } from '@tamagui/lucide-icons';
import { useDebounce } from '../hooks/useDebounce';

import { Id } from '../../../../convex/_generated/dataModel';

export function ProductsScreen() {
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 300);
  const [pageSize, setPageSize] = useState(20);
  const { showToast } = useToast();

  const { results, status, loadMore } = usePaginatedQuery(
    api.admin.getScrapedProducts,
    {},
    { initialNumItems: pageSize },
  );

  // Use backend search when there's a search term
  const searchResults = useQuery(
    api.admin.searchProducts,
    debouncedSearch ? { query: debouncedSearch } : 'skip'
  );

  const retrigger = useMutation(api.admin.retriggerScrape);

  // Handle search errors
  useEffect(() => {
    if (searchResults === null && debouncedSearch) {
      showToast({
        variant: 'error',
        title: 'Search Error',
        message: 'Failed to search products. Please try again.',
      });
    }
  }, [searchResults, debouncedSearch, showToast]);

  const handleRetrigger = async (id: Id<'products'>) => {
    try {
      await retrigger({ productId: id });
      showToast({
        variant: 'success',
        title: 'Scrape Scheduled',
        message: 'Product scrape has been scheduled successfully.',
      });
    } catch (error) {
      showToast({
        variant: 'error',
        title: 'Failed to Schedule',
        message: 'Could not schedule scrape. Please try again.',
      });
    }
  };

  // Use search results if searching, otherwise use paginated results
  const displayResults = debouncedSearch ? (searchResults || []) : (results || []);
  const isLoading = status === 'LoadingFirstPage';
  const hasError = (debouncedSearch && searchResults === null) || (!debouncedSearch && results === null);

  // Show error state
  if (hasError && !isLoading) {
    return (
      <YStack flex={1} justifyContent="center" alignItems="center" padding="$8" gap="$3">
        <YStack
          width={64}
          height={64}
          borderRadius="$full"
          backgroundColor="$backgroundHover"
          alignItems="center"
          justifyContent="center"
        >
          <AlertCircle size={32} color="$error" />
        </YStack>
        <YStack gap="$1" alignItems="center">
          <Text fontSize="$5" fontWeight="600" color="$color">
            Failed to Load Products
          </Text>
          <Text fontSize="$3" color="$color" opacity={0.6} textAlign="center">
            There was an error loading the products.
          </Text>
        </YStack>
      </YStack>
    );
  }

  return (
    <YStack space="$4" flex={1}>
      <XStack justifyContent="space-between" alignItems="center">
        <H3>Scraped Products</H3>
        <XStack space="$2" alignItems="center">
          <Text color="$textSecondary">Items per page:</Text>
          {[20, 50, 100].map((size) => (
            <Button
              key={size}
              size="small"
              variant={pageSize === size ? 'primary' : 'ghost'}
              onPress={() => setPageSize(size)}
            >
              {size.toString()}
            </Button>
          ))}
        </XStack>
      </XStack>

      <XStack space="$4" alignItems="center">
        <SearchBar
          placeholder="Search products by title or brand..."
          value={search}
          onChangeText={setSearch}
        />
      </XStack>

      <ScrollView contentContainerStyle={{ flexDirection: 'row', flexWrap: 'wrap', gap: 16 }}>
        {isLoading ? (
          <Spinner />
        ) : (
          displayResults?.map(
            (product: {
              _id: Id<'products'>;
              title: string;
              brand?: string;
              price: number;
              images?: string[];
            }) => (
              <Card
                key={product._id}
                width={300}
                bordered
                backgroundColor="$surface"
                overflow="hidden"
              >
                <Card.Header padded paddingBottom="$0">
                  <Image
                    source={{ uri: product.images?.[0] }}
                    width="100%"
                    height={200}
                    borderRadius="$2"
                    resizeMode="cover"
                  />
                </Card.Header>
                <Card.Footer padded flexDirection="column" alignItems="flex-start" gap="$2">
                  <Text fontWeight="bold" fontSize="$4" numberOfLines={1}>
                    {product.title}
                  </Text>
                  <XStack justifyContent="space-between" width="100%">
                    <Text color="$textSecondary">{product.brand}</Text>
                    <Text fontWeight="bold">₹{product.price}</Text>
                  </XStack>
                  <Button size="small" fullWidth onPress={() => handleRetrigger(product._id)}>
                    Retrigger Scrape
                  </Button>
                </Card.Footer>
              </Card>
            ),
          )
        )}
        {status === 'CanLoadMore' && !debouncedSearch && (
          <Button onPress={() => loadMore(pageSize)} fullWidth>
            Load More
          </Button>
        )}
        {displayResults?.length === 0 && debouncedSearch && (
          <YStack alignItems="center" padding="$8" width="100%">
            <Text color="$color" opacity={0.5} fontSize="$5">
              No products found matching "{search}"
            </Text>
          </YStack>
        )}
      </ScrollView>
    </YStack>
  );
}
