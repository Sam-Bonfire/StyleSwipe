import { NavigationBar } from '@app/ui-kit';
import { useRoute } from '@react-navigation/native';
import { Home, Search, Layers, User } from '@tamagui/lucide-icons';
import React, { useState } from 'react';
import { YStack } from 'tamagui';

import { HomeHeader } from '../../components/HomeHeader';
import { DiscoveryScreen } from '../discovery/DiscoveryScreen';
import { HomeScreen } from '../home/HomeScreen';
import { ProfileScreen } from '../profile/ProfileScreen';
import { SearchScreen } from '../search/SearchScreen';

export function MainScreen() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const route = useRoute<any>();
  const initialTab = route.params?.activeTab || 'discovery';
  const [activeTab, setActiveTab] = useState(initialTab);

  // Sync state if params change while screen is mounted (optional but good for reuse)
  React.useEffect(() => {
    if (route.params?.activeTab) {
      setActiveTab(route.params.activeTab);
    }
  }, [route.params?.activeTab]);

  const navItems = [
    {
      key: 'home',
      label: 'Home',
      icon: <Home size={22} color="$textSecondary" />,
      activeIcon: <Home size={22} color="$primary" />,
    },
    {
      key: 'search',
      label: 'Search',
      icon: <Search size={22} color="$textSecondary" />,
      activeIcon: <Search size={22} color="$primary" />,
    },
    {
      key: 'discovery',
      label: 'Discover',
      icon: <Layers size={22} color="$textSecondary" />,
      activeIcon: <Layers size={22} color="$primary" />,
    },
    {
      key: 'profile',
      label: 'Profile',
      icon: <User size={22} color="$textSecondary" />,
      activeIcon: <User size={22} color="$primary" />,
    },
  ];

  const renderContent = () => {
    switch (activeTab) {
      case 'home':
        return <HomeScreen />;
      case 'search':
        return <SearchScreen />;
      case 'discovery':
        return <DiscoveryScreen />;
      case 'profile':
        return <ProfileScreen />;
      default:
        return <DiscoveryScreen />;
    }
  };

  return (
    <YStack
      backgroundColor="$background"
      position="absolute"
      top={0}
      left={0}
      right={0}
      bottom={0}
      overflow="hidden"
    >
      <HomeHeader />

      <YStack flex={1} overflow="hidden">
        {renderContent()}
      </YStack>

      <NavigationBar items={navItems} activeKey={activeTab} onItemPress={setActiveTab} elevated />
    </YStack>
  );
}
