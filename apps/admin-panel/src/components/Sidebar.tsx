import { Button } from '@app/ui-kit'; // Using UI Kit Button
import { Home, Box, Activity, LogOut, ChevronLeft, ChevronRight, Users, Shield, MessageSquare, PieChart, Folder } from '@tamagui/lucide-icons';
import React from 'react';
import { YStack, XStack, Text, Separator, Avatar } from 'tamagui';

import { authAdapter } from '../lib/auth';

type Page = 'overview' | 'products' | 'categories' | 'jobs' | 'users' | 'organizations' | 'feedback' | 'logs' | 'analytics';

interface SidebarProps {
  activePage: Page;
  onNavigate: (page: Page) => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  isAdmin: boolean;
}

export function Sidebar({
  activePage,
  onNavigate,
  isCollapsed,
  onToggleCollapse,
  isAdmin,
}: SidebarProps) {
  const menuItems = [
    { id: 'overview', icon: Home, label: 'Overview' },
    ...(isAdmin
      ? [
        { id: 'analytics', icon: PieChart, label: 'Analytics' },
        { id: 'products', icon: Box, label: 'Products' },
        { id: 'categories', icon: Folder, label: 'Categories' },
        { id: 'jobs', icon: Activity, label: 'Scraping Jobs' },
        { id: 'users', icon: Users, label: 'Users' },
        { id: 'organizations', icon: Shield, label: 'Organizations' },
        { id: 'feedback', icon: MessageSquare, label: 'Feedback' },
        { id: 'logs', icon: Activity, label: 'Logs' },
      ]
      : []),
  ];

  return (
    <YStack
      width={isCollapsed ? 80 : 260}
      backgroundColor="$surface"
      borderRightWidth={0.5}
      borderColor="$borderColor"
      paddingVertical="$5"
      paddingHorizontal="$1" // Reduced padding from previous version
    >
      {/* Header */}
      <XStack
        alignItems="center"
        justifyContent={isCollapsed ? 'center' : 'space-between'}
        marginBottom="$6"
      >
        {!isCollapsed && (
          <XStack alignItems="center" gap="$2" padding="$2">
            <Text fontSize="$6" fontWeight="bold" color="$color">
              StyleSwipe
            </Text>
          </XStack>
        )}
        <Button
          circular
          icon={
            isCollapsed ? (
              <ChevronRight size="$3" color="$color" />
            ) : (
              <ChevronLeft size="$3" color="$color" />
            )
          }
          onPress={onToggleCollapse}
          variant="ghost"
        />
      </XStack>

      {/* Navigation */}
      <YStack gap="$2" flex={1} alignItems={isCollapsed ? 'center' : 'stretch'}>
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = activePage === item.id;

          if (isCollapsed) {
            return (
              <Button
                key={item.id}
                variant={isActive ? 'primary' : 'ghost'}
                onPress={() => onNavigate(item.id as Page)}
                justifyContent="center"
                alignItems="center"
                icon={<Icon size="$3" color={isActive ? '$textInverse' : '$color'} />}
              />
            );
          }

          return (
            <Button
              key={item.id}
              variant={isActive ? 'primary' : 'ghost'}
              onPress={() => onNavigate(item.id as Page)}
              justifyContent="flex-start"
              icon={<Icon size="$3" color={isActive ? '$textInverse' : '$color'} />}
            >
              {item.label}
            </Button>
          );
        })}
      </YStack>

      {/* User / Logout */}
      <Separator marginVertical="$4" borderColor="$borderColor" />
      <YStack gap="$3" alignItems={isCollapsed ? 'center' : 'stretch'}>
        {!isCollapsed && (
          <XStack alignItems="center" gap="$2" paddingHorizontal="$1">
            <Avatar circular size="$3">
              <Avatar.Image src="https://github.com/shadcn.png" />
              <Avatar.Fallback backgroundColor="$primaryDark" />
            </Avatar>
            <YStack>
              <Text fontSize="$3" fontWeight="bold" color="$color">
                Admin
              </Text>
              <Text fontSize="$2" color="$color">
                admin@styleswipe.com
              </Text>
            </YStack>
          </XStack>
        )}

        <Button
          icon={LogOut}
          variant="ghost" // Using ghost for logout to be subtle
          onPress={() => authAdapter.signOut()}
          justifyContent={isCollapsed ? 'center' : 'flex-start'}
        >
          {!isCollapsed ? <Text>Sign Out</Text> : null}
        </Button>
      </YStack>
    </YStack>
  );
}
