import 'react-native-gesture-handler';
import { config } from '@app/ui-kit';
import { api } from '@convex-api';
import { ConvexBetterAuthProvider } from '@convex-dev/better-auth/react';
import { ConvexReactClient, useQuery } from 'convex/react';
import React, { useState, useEffect } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { TamaguiProvider, Theme, YStack, Spinner } from 'tamagui';

import { DashboardLayout } from './components/DashboardLayout';
import { authAdapter } from './lib/auth';
import { JobsScreen } from './screens/JobsScreen';
import { LoginScreen } from './screens/LoginScreen';
import { OverviewScreen } from './screens/OverviewScreen';
import { ProductsScreen } from './screens/ProductsScreen';

// Initialize Convex Client
const convex = new ConvexReactClient(process.env.EXPO_PUBLIC_CONSUMER_APP_CONVEX_URL as string, {
  unsavedChangesWarning: false,
});

function Main() {
  // Use Convex Query to drive auth state, matching consumer-app pattern
  const user = useQuery(api.users.currentUser);
  const [activePage, setActivePage] = useState<'overview' | 'products' | 'jobs'>('overview');

  useEffect(() => {
    console.log('[Main] User state changed:', user);
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
      case 'overview':
        return <OverviewScreen />;
      case 'products':
        return <ProductsScreen />;
      case 'jobs':
        return <JobsScreen />;
      default:
        return <OverviewScreen />;
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
