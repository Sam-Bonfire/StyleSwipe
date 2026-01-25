import React, { useState } from 'react';
import { YStack } from 'tamagui';
import { NavigationBar } from '@app/ui-kit';
import { Home, Search, Layers, User, ShoppingCart } from '@tamagui/lucide-icons';
import { DiscoveryScreen } from '../discovery/DiscoveryScreen';
import { CartScreen } from '../commerce/CartScreen';
import { HomeScreen } from '../home/HomeScreen';
import { SearchScreen } from '../search/SearchScreen';
import { ProfileScreen } from '../profile/ProfileScreen';

export function MainScreen() {
    const [activeTab, setActiveTab] = useState('discovery');

    const navItems = [
        {
            key: 'home',
            label: 'Home',
            icon: <Home size={22} color="$textSecondary" />,
            activeIcon: <Home size={22} color="$primary" />
        },
        {
            key: 'search',
            label: 'Search',
            icon: <Search size={22} color="$textSecondary" />,
            activeIcon: <Search size={22} color="$primary" />
        },
        {
            key: 'discovery',
            label: 'Discover',
            icon: <Layers size={22} color="$textSecondary" />,
            activeIcon: <Layers size={22} color="$primary" />
        },
        {
            key: 'cart',
            label: 'Cart',
            icon: <ShoppingCart size={22} color="$textSecondary" />,
            activeIcon: <ShoppingCart size={22} color="$primary" />
        },
        {
            key: 'profile',
            label: 'Profile',
            icon: <User size={22} color="$textSecondary" />,
            activeIcon: <User size={22} color="$primary" />
        }
    ];

    const renderContent = () => {
        switch (activeTab) {
            case 'home':
                return <HomeScreen />;
            case 'search':
                return <SearchScreen />;
            case 'discovery':
                return <DiscoveryScreen />;
            case 'cart':
                return <CartScreen />;
            case 'profile':
                return <ProfileScreen />;
            default:
                return <DiscoveryScreen />;
        }
    };

    return (
        <YStack flex={1} backgroundColor="$background">
            <YStack flex={1}>
                {renderContent()}
            </YStack>
            <NavigationBar
                items={navItems}
                activeKey={activeTab}
                onItemPress={setActiveTab}
                elevated
            />
        </YStack>
    );
}
