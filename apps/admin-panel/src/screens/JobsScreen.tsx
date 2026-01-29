
import React from 'react';
import { YStack, Text, Card, H2, Button, XStack, Spinner, ScrollView } from 'tamagui';
import { useQuery } from 'convex/react';
import { api } from '@convex-api';

export function JobsScreen() {
    const jobs = useQuery(api.admin.getScrapingJobs, {
        paginationOpts: { numItems: 20, cursor: null }
    });

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
                        {jobs.page.length === 0 ? (
                            <Text padding="$4" color="$color10">No scraping jobs found.</Text>
                        ) : (
                            jobs.page.map((job: any) => (
                                <XStack key={job._id} padding="$4" borderBottomWidth={1} borderColor="$borderColor" justifyContent="space-between">
                                    <YStack flex={1}>
                                        <Text fontWeight="bold" numberOfLines={1}>{job.query}</Text>
                                        <Text fontSize="$2" color="$color10">{new Date(job.createdAt).toLocaleString()}</Text>
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
    let bg = "$color4";
    if (status === 'completed') bg = "$green4";
    if (status === 'processing') bg = "$blue4";
    if (status === 'failed') bg = "$red4";

    return (
        <XStack backgroundColor={bg} paddingHorizontal="$2" paddingVertical="$1" borderRadius="$4">
            <Text fontSize="$2" textTransform="capitalize">{status}</Text>
        </XStack>
    )
}
