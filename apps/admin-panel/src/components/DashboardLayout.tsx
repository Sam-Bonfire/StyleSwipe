
import React, { useState } from 'react';
import { XStack, YStack } from 'tamagui';
import { Sidebar } from './Sidebar';
import { TopBar } from './TopBar';

type Page = 'overview' | 'products' | 'jobs';

interface DashboardLayoutProps {
    children: React.ReactNode;
    activePage: Page;
    onNavigate: (page: Page) => void;
}

export function DashboardLayout({ children, activePage, onNavigate }: DashboardLayoutProps) {
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

    return (
        <XStack flex={1} height="100%" backgroundColor="$background">
            <Sidebar
                activePage={activePage}
                onNavigate={onNavigate}
                isCollapsed={isSidebarCollapsed}
                onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
            />

            <YStack flex={1} padding="$6" backgroundColor="$background">
                <TopBar />
                {children}
            </YStack>
        </XStack>
    );
}
