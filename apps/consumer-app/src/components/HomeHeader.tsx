/**
 * HomeHeader Component
 *
 * Custom header for the Home screen implementing the design requirements:
 * - Shuble Logo on the left
 * - Plus, Bell (with badge), Bag (with badge) on the right
 */

import { TopBar, TopBarIconButton, TopBarBadgeCount, TopBarBadgeText } from '@app/ui-kit';
import { Plus, Bell, ShoppingBag } from '@tamagui/lucide-icons';
import React from 'react';

import { AppLogo } from './AppLogo';

export const HomeHeader = () => {
  // Mock counts for now as per design
  const notificationCount = 8;
  const bagCount = 2;

  const handlePlusPress = () => {
    console.log('Plus pressed');
  };

  const handleNotificationPress = () => {
    console.log('Notification pressed');
  };

  const handleBagPress = () => {
    console.log('Bag pressed');
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
            {/* Plus icon - check if circle around it is needed. In design it's a plus within a square/circle box? 
                            The design shows a plus icon inside a rounded square or circle. TopBarIconButton is circular.
                        */}
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
