/**
 * HomeHeader Component
 *
 * Custom header for the Home screen implementing the design requirements:
 * - Shuble Logo on the left
 * - Plus, Bell (with badge) on the right
 */

import { useCurrentUser, useUnreadCount } from '@app/infrastructure';
import { TopBar, TopBarIconButton, TopBarBadgeCount, TopBarBadgeText, useToast } from '@app/ui-kit';
import { Plus, Bell } from '@tamagui/lucide-icons';
import { useRouter } from 'expo-router';
import React from 'react';

import { AppLogo } from './AppLogo';

export const HomeHeader = () => {
  const router = useRouter();
  const { showToast } = useToast();

  // Fetch User
  const user = useCurrentUser();
  const userId = user?._id;

  // Dynamic Counts
  const unread = useUnreadCount(userId);
  const notificationCount: number = unread ?? 0;

  const handlePlusPress = (): void => {
    console.log('Plus pressed');
  };

  const handleNotificationPress = (): void => {
    if (notificationCount > 0) {
      router.push('/(app)/notifications' as never);
      return;
    }
    showToast({
      title: 'No new notifications',
      message: 'Price drops & partner likes will appear here.',
      variant: 'info',
    });
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
        </>
      }
    />
  );
};
