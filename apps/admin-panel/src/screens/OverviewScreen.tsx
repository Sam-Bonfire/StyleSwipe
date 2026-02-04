import { api } from '@convex-api';
import { useQuery } from 'convex/react';
import React, { useEffect } from 'react';
import { YStack, Text, Card, XStack, H2, H3, Spinner, styled, Avatar, ScrollView } from 'tamagui';
import { Users, Package, Activity, TrendingUp, Clock, AlertCircle } from '@tamagui/lucide-icons';
import { useToast } from '@app/ui-kit';

const StatsCardStyled = styled(Card, {
  name: 'StatsCard',
  bordered: true,
  padding: '$5',
  minWidth: 250,
  flex: 1,
  backgroundColor: '$surface',
  borderColor: '$borderColor',
  borderRadius: '$4',

  hoverStyle: {
    scale: 1.02,
    borderColor: '$primary',
    shadowColor: '$shadowColor',
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
  },

  animation: 'quick',
});

const ActivityCard = styled(Card, {
  name: 'ActivityCard',
  flex: 1,
  padding: '$5',
  backgroundColor: '$surface',
  borderColor: '$borderColor',
  borderRadius: '$4',
  bordered: true,

  hoverStyle: {
    borderColor: '$borderColorHover',
  },
});

const ActivityItem = styled(XStack, {
  name: 'ActivityItem',
  padding: '$3',
  borderRadius: '$3',
  alignItems: 'center',
  gap: '$3',

  hoverStyle: {
    backgroundColor: '$backgroundHover',
  },

  animation: 'quick',
});

export function OverviewScreen() {
  const stats = useQuery(api.admin.getStats);
  const { showToast } = useToast();

  // Handle query errors with toast
  useEffect(() => {
    if (stats === null) {
      showToast({
        variant: 'error',
        title: 'Failed to Load Stats',
        message: 'Unable to fetch dashboard statistics. Please refresh the page.',
      });
    }
  }, [stats, showToast]);

  // Show loading state
  if (stats === undefined) {
    return (
      <YStack flex={1} justifyContent="center" alignItems="center">
        <Spinner size="large" color="$primary" />
        <Text marginTop="$3" color="$color" opacity={0.7}>Loading dashboard...</Text>
      </YStack>
    );
  }

  // Show error state with fallback UI
  if (stats === null) {
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
            Failed to Load Dashboard
          </Text>
          <Text fontSize="$3" color="$color" opacity={0.6} textAlign="center">
            There was an error loading the dashboard statistics.
          </Text>
          <Text fontSize="$2" color="$color" opacity={0.5} textAlign="center" marginTop="$2">
            Please refresh the page or try again later.
          </Text>
        </YStack>
      </YStack>
    );
  }

  return (
    <ScrollView flex={1} showsVerticalScrollIndicator={false}>
      <YStack space="$2" padding="$1" paddingBottom="$8">
        <YStack space="$2" marginBottom="$2">
          <H3 color="$color">Dashboard Overview</H3>
          <Text fontSize="$3" color="$color" opacity={0.6}>
            Monitor platform activity and key metrics
          </Text>
        </YStack>

        <XStack space="$2" flexWrap="wrap">
          <StatsCard
            title="Total Users"
            value={stats.totalUsers.toString()}
            change=""
            icon={<Users size={24} color="$primary" />}
            color="$primary"
          />
          <StatsCard
            title="Scraped Products"
            value={stats.totalProducts.toString()}
            change="Updated recently"
            icon={<Package size={24} color="#3b82f6" />}
            color="#3b82f6"
          />
          <StatsCard
            title="Active Jobs"
            value={stats.activeJobs.toString()}
            change="Processing"
            icon={<Activity size={24} color="#22c55e" />}
            color="#22c55e"
          />
        </XStack>

        <XStack space="$2" marginTop="$2" flexWrap="wrap">
          <ActivityCard>
            <XStack justifyContent="space-between" alignItems="center" marginBottom="$4">
              <H3 fontSize="$5" color="$color">Recent Activity</H3>
              <Clock size={20} color="$color" opacity={0.5} />
            </XStack>
            <YStack space="$2">
              {stats.recentUsers.length > 0 ? (
                stats.recentUsers.map((u: { _id: string; name?: string; email?: string; image?: string }) => (
                  <ActivityItem key={u._id}>
                    <Avatar circular size="$3">
                      <Avatar.Image src={u.image} />
                      <Avatar.Fallback backgroundColor="$primary">
                        <Users size={16} color="white" />
                      </Avatar.Fallback>
                    </Avatar>
                    <YStack flex={1}>
                      <Text fontSize="$3" fontWeight="500" color="$color">
                        New user joined
                      </Text>
                      <Text fontSize="$2" color="$color" opacity={0.6}>
                        {u.name || u.email}
                      </Text>
                    </YStack>
                    <TrendingUp size={16} color="#22c55e" />
                  </ActivityItem>
                ))
              ) : (
                <Text color="$color" opacity={0.5} textAlign="center" paddingVertical="$4">
                  No recent activity
                </Text>
              )}
            </YStack>
          </ActivityCard>
        </XStack>
      </YStack>
    </ScrollView>
  );
}

function StatsCard({
  title,
  value,
  change,
  icon,
  color
}: {
  title: string;
  value: string;
  change: string;
  icon: React.ReactNode;
  color: string;
}) {
  return (
    <StatsCardStyled>
      <XStack justifyContent="space-between" alignItems="flex-start" marginBottom="$3">
        <YStack flex={1}>
          <Text fontSize="$2" color="$color" opacity={0.6} textTransform="uppercase" fontWeight="600" letterSpacing={1}>
            {title}
          </Text>
        </YStack>
        <YStack
          backgroundColor="$backgroundHover"
          padding="$2"
          borderRadius="$3"
        >
          {icon}
        </YStack>
      </XStack>
      <H2 marginVertical="$2" color="$color" fontSize="$9">
        {value}
      </H2>
      <XStack alignItems="center" gap="$2">
        <TrendingUp size={14} color={color as any} />
        <Text fontSize="$2" color={color as any} fontWeight="500">
          {change}
        </Text>
      </XStack>
    </StatsCardStyled>
  );
}
