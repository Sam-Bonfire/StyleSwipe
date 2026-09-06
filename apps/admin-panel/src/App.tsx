import 'react-native-gesture-handler';
import { useCurrentUser, ConvexReactClient } from '@app/infrastructure';
import { Button, StyleSwipeProvider } from '@app/ui-kit';
import { ConvexBetterAuthProvider } from '@convex-dev/better-auth/react';
import React, { useState } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { YStack, Spinner, Text } from 'tamagui';

import { DashboardLayout } from './components/DashboardLayout';
import { GlobalErrorBoundary } from './components/GlobalErrorBoundary';
import { authAdapter } from './lib/auth';
import { AffiliatesScreen } from './screens/AffiliatesScreen';
import { AnalyticsScreen } from './screens/AnalyticsScreen';
import { CategoriesScreen } from './screens/CategoriesScreen';
import { FeedbackScreen } from './screens/FeedbackScreen';
import { JobsScreen } from './screens/JobsScreen';
import { LoginScreen } from './screens/LoginScreen';
import { LogsScreen } from './screens/LogsScreen';
import { OrganizationsScreen } from './screens/OrganizationsScreen';
import { OverviewScreen } from './screens/OverviewScreen';
import { ProductsScreen } from './screens/ProductsScreen';
import { SettingsScreen } from './screens/SettingsScreen';
import { UsersScreen } from './screens/UsersScreen';

const convex = new ConvexReactClient(process.env.EXPO_PUBLIC_CONSUMER_APP_CONVEX_URL as string, {
  unsavedChangesWarning: false,
});


function Main() {
  const user = useCurrentUser();
  const [activePage, setActivePage] = useState<'overview' | 'products' | 'categories' | 'affiliates' | 'settings' | 'jobs' | 'users' | 'organizations' | 'feedback' | 'logs' | 'analytics'>('overview');


  // undefined = loading, null = not logged in, object = logged in
  if (user === undefined) {
    return (
      <YStack flex={1} justifyContent="center" alignItems="center" backgroundColor="$background">
        <Spinner size="large" color="$primary" />
      </YStack>
    );
  }

  if (user === null || !user.isCoreMember) {
    if (user !== null && !user.isCoreMember) {
      return (
        <YStack
          flex={1}
          justifyContent="center"
          alignItems="center"
          backgroundColor="$background"
          padding="$6"
        >
          <Text fontSize="$6" fontWeight="bold" color="$color" textAlign="center">
            Access Denied
          </Text>
          <Text fontSize="$4" color="$color" textAlign="center" marginTop="$2" marginBottom="$4">
            You do not have permission to access this application.
          </Text>
          <Button onPress={() => authAdapter.signOut()}>Sign Out</Button>
        </YStack>
      );
    }
    return <LoginScreen />;
  }

  const renderContent = () => {
    switch (activePage) {
      case 'overview':
        return <OverviewScreen />;
      case 'analytics':
        return user.isCoreAdmin ? <AnalyticsScreen /> : <OverviewScreen />;
      case 'products':
        return user.isCoreAdmin ? <ProductsScreen /> : <OverviewScreen />;
      case 'categories':
        return user.isCoreAdmin ? <CategoriesScreen /> : <OverviewScreen />;
      case 'affiliates':
        return user.isCoreAdmin ? <AffiliatesScreen /> : <OverviewScreen />;
      case 'jobs':
        return user.isCoreAdmin ? <JobsScreen /> : <OverviewScreen />;
      case 'users':
        return user.isCoreAdmin ? <UsersScreen /> : <OverviewScreen />;
      case 'organizations':
        return user.isCoreAdmin ? <OrganizationsScreen /> : <OverviewScreen />;
      case 'feedback':
        return user.isCoreAdmin ? <FeedbackScreen /> : <OverviewScreen />;
      case 'logs':
        return user.isCoreAdmin ? <LogsScreen /> : <OverviewScreen />;
      case 'settings':
        return user.isCoreAdmin ? <SettingsScreen /> : <OverviewScreen />;
      default:
        return <OverviewScreen />;
    }
  };

  return (
    <DashboardLayout activePage={activePage} onNavigate={setActivePage} isAdmin={user.isCoreAdmin}>
      {renderContent()}
    </DashboardLayout>
  );
}

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <ConvexBetterAuthProvider client={convex} authClient={authAdapter.client}>
          <StyleSwipeProvider theme="BrandIdentityLight">
            <GlobalErrorBoundary>
              <Main />
            </GlobalErrorBoundary>
          </StyleSwipeProvider>
        </ConvexBetterAuthProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
