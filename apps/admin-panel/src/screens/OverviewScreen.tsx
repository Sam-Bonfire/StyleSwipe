
import { api } from '@convex-api';
import { useQuery } from 'convex/react';
import React from 'react';
import { YStack, Text, Card, XStack, H2, H4, Spinner } from 'tamagui';

export function OverviewScreen() {
    const stats = useQuery(api.admin.getStats);

    if (!stats) {
        return <Spinner size="large" color="$primary" />;
    }

    return (
        <YStack space="$4">

            <XStack space="$4" flexWrap="wrap">
                <StatsCard title="Total Users" value={stats.totalUsers.toString()} change="+12% this week" />
                <StatsCard title="Scraped Products" value={stats.totalProducts.toString()} change="Updated recently" />
                <StatsCard title="Active Jobs" value={stats.activeJobs.toString()} change="Processing" />
            </XStack>

            <XStack space="$4" marginTop="$4">
                {/* Recent Activity / Charts Placeholder - In a real App we'd use Victory Native or Skia */}
                <Card flex={1} padding="$5" backgroundColor="$surface" shadowColor="$shadowColor" shadowOpacity={0.1} shadowRadius={5}>
                    <H4 marginBottom="$4">Recent Activity</H4>
                    <YStack space="$2">
                        {stats.recentUsers.map((u: { _id: string; name?: string; email?: string }) => (
                            <Text key={u._id} color="$color">New user joined: {u.name || u.email}</Text>
                        ))}
                    </YStack>
                </Card>
            </XStack>
        </YStack>
    );
}

function StatsCard({ title, value, change }: { title: string, value: string, change: string }) {
    return (
        <Card
            bordered
            padding="$5"
            minWidth={250}
            flex={1}
            backgroundColor="$surface" // Surface color from dark theme
            borderColor="$borderColor"
            animation="bouncy"
            hoverStyle={{ scale: 1.02, borderColor: "$primary" }}
        >
            <Text fontSize="$3" color="$color" textTransform="uppercase" fontWeight="bold">{title}</Text>
            <H2 marginVertical="$2" color="$color">{value}</H2>
            <Text fontSize="$3" color="$primaryLight">{change}</Text>
        </Card>
    )
}
