/**
 * HomeHeader Component
 *
 * Custom header for the Home screen implementing the design requirements:
 * - Shuble Logo on the left
 * - Plus, Bell (with badge), Bag (with badge) on the right
 */

import { TopBar, TopBarIconButton, TopBarBadgeCount, TopBarBadgeText, useToast } from '@app/ui-kit';
import { api } from '@convex-api';
import { useNavigation } from '@react-navigation/native';
import { Plus, Bell, ShoppingBag } from '@tamagui/lucide-icons';
import { useQuery } from 'convex/react';
import React from 'react';

import { AppLogo } from './AppLogo';

export const HomeHeader = () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const navigation = useNavigation<any>();
  const { showToast } = useToast();

  // Fetch User & Cart
  const user = useQuery(api.users.currentUser);
  const userId = user?._id;

  const cart = useQuery(api.cart.getCart, userId ? { userId } : 'skip');

  // Dynamic Counts
  const notificationCount = 0; // No notifications system yet
  const bagCount = cart?.items?.length ?? 0;

  const handlePlusPress = () => {
    console.log('Plus pressed');
  };

  const handleNotificationPress = () => {
    showToast({
      title: 'Hold your horses! 🐴',
      message: 'Notifications are still in the oven. Brace yourself!',
      variant: 'info',
    });
  };

  const handleBagPress = () => {
    // Navigate to Main with activeTab 'cart' to switch tabs
    // Note: Since we are already in Main, this might need a specific handling if Main doesn't listen to params update while mounted.
    // But we implemented useEffect in MainScreen to listen to params, so this works.
    navigation.navigate('Main', { activeTab: 'cart' });
  };

  return (
    <TopBar
      showAddress={false}
      showSearch={false}
      showWishlist={false} // We are building a custom right section
      showCart={false} // We are building a custom right section
      leftContent={<AppLogo />}
      rightContent={
        <>
          <TopBarIconButton onPress={handlePlusPress}>
            {/* Plus icon */}
            <Plus size={24} color="$textPrimary" />
          </TopBarIconButton>

          <TopBarIconButton onPress={handleNotificationPress}>
            <Bell size={24} color="$textPrimary" />
            {notificationCount > 0 && (
              <TopBarBadgeCount>
                <TopBarBadgeText>
                  {notificationCount > 99 ? '99+' : notificationCount}
                </TopBarBadgeText>
              </TopBarBadgeCount>
            )}
          </TopBarIconButton>

          <TopBarIconButton onPress={handleBagPress}>
            <ShoppingBag size={24} color="$textPrimary" />
            {bagCount > 0 && (
              <TopBarBadgeCount>
                <TopBarBadgeText>{bagCount > 99 ? '99+' : bagCount}</TopBarBadgeText>
              </TopBarBadgeCount>
            )}
          </TopBarIconButton>
        </>
      }
    />
  );
};
