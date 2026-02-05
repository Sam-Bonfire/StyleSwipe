import React, { useState } from 'react';
import { XStack, YStack } from 'tamagui';

import { Sidebar } from './Sidebar';
import { TopBar } from './TopBar';

type Page = 'overview' | 'products' | 'jobs' | 'users' | 'organizations';

interface DashboardLayoutProps {
  children: React.ReactNode;
  activePage: Page;
  onNavigate: (page: Page) => void;
  isAdmin: boolean;
}

export function DashboardLayout({
  children,
  activePage,
  onNavigate,
  isAdmin,
}: DashboardLayoutProps) {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  return (
    <XStack flex={1} height="100%" backgroundColor="$background">
      <Sidebar
        activePage={activePage}
        onNavigate={onNavigate}
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
        isAdmin={isAdmin}
      />

      <YStack flex={1} padding="$2" backgroundColor="$background">
        <TopBar />
        {children}
      </YStack>
    </XStack>
  );
}
