import 'react-native-gesture-handler';
import React, { useState, useEffect } from 'react';
import { ConvexReactClient, useQuery } from 'convex/react';
import { ConvexBetterAuthProvider } from "@convex-dev/better-auth/react";
import { config, Button } from '@app/ui-kit';
import { TamaguiProvider, Theme, YStack, Text, Card, Spinner, Label, H3, XStack, Image, Input } from 'tamagui';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { authAdapter } from './lib/auth';
import { api } from "@convex-api";
import { PieChart } from '@tamagui/lucide-icons';

import { DashboardLayout } from './components/DashboardLayout';
import { OverviewScreen } from './screens/OverviewScreen';
import { ProductsScreen } from './screens/ProductsScreen';
import { JobsScreen } from './screens/JobsScreen';
import { LoginScreen } from './screens/LoginScreen';

// Initialize Convex Client
const convex = new ConvexReactClient(process.env.EXPO_PUBLIC_CONSUMER_APP_CONVEX_URL as string, {
    unsavedChangesWarning: false,
});



function Main() {
    // Use Convex Query to drive auth state, matching consumer-app pattern
    const user = useQuery(api.users.currentUser);
    const [activePage, setActivePage] = useState<'overview' | 'products' | 'jobs'>('overview');

    useEffect(() => {
        console.log("[Main] User state changed:", user);
    }, [user]);

    // undefined = loading, null = not logged in, object = logged in
    if (user === undefined) {
        return (
            <YStack flex={1} justifyContent="center" alignItems="center" backgroundColor="$background">
                <Spinner size="large" color="$primary" />
            </YStack>
        );
    }

    if (user === null) {
        return <LoginScreen />;
    }

    const renderContent = () => {
        switch (activePage) {
            case 'overview': return <OverviewScreen />;
            case 'products': return <ProductsScreen />;
            case 'jobs': return <JobsScreen />;
            default: return <OverviewScreen />;
        }
    };

    return (
        <DashboardLayout activePage={activePage} onNavigate={setActivePage}>
            {renderContent()}
        </DashboardLayout>
    );
}

export default function App() {
    return (
        <SafeAreaProvider>
            <ConvexBetterAuthProvider client={convex} authClient={authAdapter.client}>
                <TamaguiProvider config={config}>
                    {/* Switching to Light Theme as requested */}
                    <Theme name="BrandIdentityLight">
                        <Main />
                    </Theme>
                </TamaguiProvider>
            </ConvexBetterAuthProvider>
        </SafeAreaProvider>
    );
}
