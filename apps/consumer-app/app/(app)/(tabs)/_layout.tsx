import { NavigationBar } from '@app/ui-kit';
import { Home, Search, Layers, User, ShoppingCart } from '@tamagui/lucide-icons';
import { Tabs, usePathname, useRouter } from 'expo-router';
import React from 'react';
import { YStack } from 'tamagui';

import { HomeHeader } from '../../../src/components/HomeHeader';

export default function TabsLayout() {
  const pathname = usePathname();
  const router = useRouter();

  // Extract the active tab from the pathname
  const segment = pathname.split('/').filter(Boolean).pop();
  let activeKey = 'discovery';
  if (segment === '(tabs)' || segment === 'discover') activeKey = 'discovery';
  else if (segment === 'search') activeKey = 'search';
  else if (segment === 'cart') activeKey = 'cart';
  else if (segment === 'profile') activeKey = 'profile';
  else if (segment === 'index' || !segment) activeKey = 'home';

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
      key: 'cart',
      label: 'Cart',
      icon: <ShoppingCart size={22} color="$textSecondary" />,
      activeIcon: <ShoppingCart size={22} color="$primary" />,
    },
    {
      key: 'profile',
      label: 'Profile',
      icon: <User size={22} color="$textSecondary" />,
      activeIcon: <User size={22} color="$primary" />,
    },
  ];

  const handleTabPress = (key: string) => {
    if (key === 'discovery') {
      router.push('/(app)/(tabs)/discover');
    } else if (key === 'home') {
      router.push('/(app)/(tabs)/');
    } else {
      router.push(`/(app)/(tabs)/${key}` as `/${string}`);
    }
  };

  return (
    <YStack flex={1} backgroundColor="$background">
      <HomeHeader />
      <Tabs
        screenOptions={{ headerShown: false }}
        tabBar={() => (
          <NavigationBar
            items={navItems}
            activeKey={activeKey}
            onItemPress={handleTabPress}
            elevated
          />
        )}
      >
        <Tabs.Screen name="index" options={{ title: 'Home' }} />
        <Tabs.Screen name="search" options={{ title: 'Search' }} />
        <Tabs.Screen name="discover" options={{ title: 'Discover' }} />
        <Tabs.Screen name="cart" options={{ title: 'Cart' }} />
        <Tabs.Screen name="profile" options={{ title: 'Profile' }} />
      </Tabs>
    </YStack>
  );
}
