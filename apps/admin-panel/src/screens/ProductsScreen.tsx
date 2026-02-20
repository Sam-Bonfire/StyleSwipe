import { useScrapedProducts, useSearchProducts, useRetriggerScrape } from '@app/infrastructure';
import { Button, useToast } from '@app/ui-kit';
import { RefreshCw, AlertCircle } from '@tamagui/lucide-icons';
import React, { useState } from 'react';
import { FlatList } from 'react-native';
import { YStack, XStack, Text, Spinner, Card, Image, Input, H3 } from 'tamagui';

import { useDebounce } from '../hooks/useDebounce';

export function ProductsScreen() {
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 300);
  const [pageSize, setPageSize] = useState(20);
  const { showToast } = useToast();
  const [isRefreshing, setIsRefreshing] = useState(false);

  const { results, status, loadMore } = useScrapedProducts(pageSize);
  const searchResults = useSearchProducts(debouncedSearch || undefined);
  const retrigger = useRetriggerScrape();

  const handleRetrigger = async (url: string) => {
    try {
      await retrigger({ url });
      showToast({
        variant: 'success',
        title: 'Scrape Scheduled',
        message: 'Product scrape has been scheduled successfully.',
      });
    } catch {
      showToast({
        variant: 'error',
        title: 'Failed to Schedule',
        message: 'Could not schedule scrape. Please try again.',
      });
    }
  };

  const displayResults = debouncedSearch ? (searchResults || []) : (results || []);
  const isLoading = status === 'LoadingFirstPage' || (!!debouncedSearch && !searchResults);
  const hasError = (!!debouncedSearch && searchResults === null) || (!debouncedSearch && results === null);

  if (hasError && !isLoading) {
    return (
      <YStack flex={1} justifyContent="center" alignItems="center" padding="$8" gap="$3">
        <YStack
          width={64}
          height={64}
          borderRadius="$4"
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
    <YStack space="$4" flex={1} padding="$4">
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

      <XStack gap="$2">
        <Input
          flex={1}
          placeholder="Search products..."
          value={search}
          onChangeText={setSearch}
        />
        <Button icon={RefreshCw} onPress={() => setIsRefreshing(!isRefreshing)}>
          Refresh
        </Button>
      </XStack>

      {isLoading ? (
        <Spinner size="large" />
      ) : (
        <FlatList
          data={displayResults}
          keyExtractor={(item) => item._id}
          numColumns={3} // Grid layout
          columnWrapperStyle={{ gap: 16 }}
          contentContainerStyle={{ gap: 16 }}
          ListEmptyComponent={
            <YStack alignItems="center" padding="$8" width="100%">
              <Text color="$color" opacity={0.5} fontSize="$5">
                No products found matching "{search}"
              </Text>
            </YStack>
          }
          renderItem={({ item }) => (
            <Card
              elevate
              bordered
              padding="$0"
              marginBottom="$3"
              flex={1}
              maxWidth="32%" // For 3 columns
              overflow="hidden"
            >
              <Card.Header padded paddingBottom="$0">
                <Image
                  source={{ uri: item.images?.[0] }}
                  width="100%"
                  height={200}
                  borderRadius="$2"
                  resizeMode="cover"
                />
              </Card.Header>
              <Card.Footer padded flexDirection="column" alignItems="flex-start" gap="$2">
                <Text fontWeight="bold" fontSize="$4" numberOfLines={1}>
                  {item.title}
                </Text>
                <XStack justifyContent="space-between" width="100%">
                  <Text color="$textSecondary">{item.brand}</Text>
                  <Text fontWeight="bold">₹{item.price}</Text>
                </XStack>
                <Button size="small" fullWidth onPress={() => handleRetrigger(item.url)}>
                  Retrigger Scrape
                </Button>
              </Card.Footer>
            </Card>
          )}
          onEndReached={() => status === 'CanLoadMore' && loadMore(10)}
        />
      )}
    </YStack>
  );
}
