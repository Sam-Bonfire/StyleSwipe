
import { api } from '@convex-api';
import { usePaginatedQuery } from 'convex/react';
import React from 'react';
import { YStack, Text, Card, H2, Button, XStack, Spinner, ScrollView, ColorTokens } from 'tamagui';

export function JobsScreen() {
    const jobs = usePaginatedQuery(api.admin.getScrapingJobs, {}, { initialNumItems: 20 });

    return (
        <YStack space="$4" flex={1}>
            <XStack justifyContent="space-between" alignItems="center">
                <H2>Scraping Jobs</H2>
                <Button themeInverse disabled>New Job (Auto)</Button>
            </XStack>

            <Card padding="$0" bordered backgroundColor="$surface" flex={1}>
                {!jobs ? (
                    <YStack padding="$4"><Spinner /></YStack>
                ) : (
                    <ScrollView>
                        {jobs.results.length === 0 ? (
                            <Text padding="$4" color="$textSecondary">No scraping jobs found.</Text>
                        ) : (
                            jobs.results.map((job: { _id: string; query: string; createdAt: number; status: string }) => (
                                <XStack key={job._id} padding="$4" borderBottomWidth={1} borderColor="$borderColor" justifyContent="space-between">
                                    <YStack flex={1}>
                                        <Text fontWeight="bold" numberOfLines={1}>{job.query}</Text>
                                        <Text fontSize="$2" color="$textSecondary">{new Date(job.createdAt).toLocaleString()}</Text>
                                    </YStack>
                                    <StatusChip status={job.status} />
                                </XStack>
                            ))
                        )}
                        <Button onPress={() => jobs.loadMore(10)} disabled={jobs.status !== "CanLoadMore"}>
                            Load More
                        </Button>
                    </ScrollView>
                )}
            </Card>
        </YStack>
    )
}

function StatusChip({ status }: { status: string }) {
    let bg: ColorTokens = "$neutral200";
    if (status === 'completed') bg = "$success";
    if (status === 'processing') bg = "$info";
    if (status === 'failed') bg = "$error";

    return (
        <XStack backgroundColor={bg} paddingHorizontal="$2" paddingVertical="$1" borderRadius="$4">
            <Text fontSize="$2" textTransform="capitalize" color="$textInverse">{status}</Text>
        </XStack>
    )
}
