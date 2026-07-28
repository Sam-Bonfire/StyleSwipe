import 'react-native-gesture-handler';
import { useCurrentUser, ConvexReactClient } from '@app/infrastructure';
import { Button, StyleSwipeProvider } from '@app/ui-kit';
import { ConvexBetterAuthProvider } from '@convex-dev/better-auth/react';
import { Stack, useRouter, useSegments } from 'expo-router';
import React from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { YStack, Spinner, Text } from 'tamagui';

import { GlobalErrorBoundary } from '../src/components/GlobalErrorBoundary';
import { authAdapter } from '../src/lib/auth';

const convex = new ConvexReactClient(process.env.EXPO_PUBLIC_CONSUMER_APP_CONVEX_URL as string, {
  unsavedChangesWarning: false,
});

/**
 * Auth guard: redirects users based on authentication state.
 */
function AuthGuard() {
  const user = useCurrentUser();
  const segments = useSegments();
  const router = useRouter();

  React.useEffect(() => {
    if (user === undefined) return;

    const inDashboard = segments[0] === '(dashboard)';

    if (!user) {
      if (inDashboard) {
        router.replace('/login');
      }
    } else if (!user.isCoreMember) {
      // Has account but no access — stay on access denied (handled in login route)
      if (inDashboard) {
        router.replace('/login');
      }
    } else {
      // Authenticated and authorized
      if (!inDashboard) {
        router.replace('/(dashboard)');
      }
    }
  }, [user, segments, router]);

  if (user === undefined) {
    return (
      <YStack flex={1} justifyContent="center" alignItems="center" backgroundColor="$background">
        <Spinner size="large" color="$primary" />
      </YStack>
    );
  }

  // Access denied for non-core members
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

  return <Stack screenOptions={{ headerShown: false }} />;
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <ConvexBetterAuthProvider client={convex} authClient={authAdapter.client}>
          <StyleSwipeProvider theme="BrandIdentityLight">
            <GlobalErrorBoundary>
              <AuthGuard />
            </GlobalErrorBoundary>
          </StyleSwipeProvider>
        </ConvexBetterAuthProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
