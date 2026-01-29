import { Button } from '@app/ui-kit';
import { api } from '@convex-api';
import { usePaginatedQuery, useMutation } from 'convex/react';
import React, { useState } from 'react';
import { YStack, Text, Card, H2, XStack, ScrollView, Spinner, Image, Input } from 'tamagui';

import { Id } from '../../../../convex/_generated/dataModel';

export function ProductsScreen() {
    const [search, setSearch] = useState("");
    const [pageSize, setPageSize] = useState(20);
    const { results, status, loadMore } = usePaginatedQuery(
        api.admin.getScrapedProducts,
        {},
        { initialNumItems: pageSize }
    );

    const retrigger = useMutation(api.admin.retriggerScrape);

    const handleRetrigger = async (id: Id<"products">) => {
        await retrigger({ productId: id });
        alert("Scrape scheduled!");
    };

    return (
        <YStack space="$4" flex={1}>
            <XStack justifyContent="space-between" alignItems="center">
                <H2>Scraped Products</H2>
                <XStack space="$2" alignItems="center">
                    <Text color="$textSecondary">Items per page:</Text>
                    {[20, 50, 100].map(size => (
                        <Button
                            key={size}
                            size="small"
                            variant={pageSize === size ? "primary" : "ghost"}
                            onPress={() => setPageSize(size)}
                        >
                            {size.toString()}
                        </Button>
                    ))}
                </XStack>
            </XStack>

            <XStack space="$4">
                <Input
                    placeholder="Search products..."
                    flex={1}
                    value={search}
                    onChangeText={setSearch}
                />
                <Button variant="secondary">Filter</Button>
            </XStack>

            <ScrollView contentContainerStyle={{ flexDirection: 'row', flexWrap: 'wrap', gap: 16 }}>
                {status === "LoadingFirstPage" ? (
                    <Spinner />
                ) : (
                    results?.map((product: { _id: Id<"products">; title: string; brand?: string; price: number; images?: string[] }) => (
                        <Card key={product._id} width={300} bordered backgroundColor="$surface" overflow="hidden">
                            <Card.Header padded paddingBottom="$0">
                                <Image source={{ uri: product.images?.[0] }} width="100%" height={200} borderRadius="$2" resizeMode="cover" />
                            </Card.Header>
                            <Card.Footer padded flexDirection="column" alignItems="flex-start" gap="$2">
                                <Text fontWeight="bold" fontSize="$4" numberOfLines={1}>{product.title}</Text>
                                <XStack justifyContent="space-between" width="100%">
                                    <Text color="$textSecondary">{product.brand}</Text>
                                    <Text fontWeight="bold">₹{product.price}</Text>
                                </XStack>
                                <Button size="small" width="100%" onPress={() => handleRetrigger(product._id)}>
                                    Retrigger Scrape
                                </Button>
                            </Card.Footer>
                        </Card>
                    ))
                )}
                {status === "CanLoadMore" && (
                    <Button onPress={() => loadMore(pageSize)} width="100%">
                        Load More
                    </Button>
                )}
            </ScrollView>
        </YStack>
    )
}
