import 'react-native-gesture-handler';
import { useCurrentUser, ConvexReactClient } from '@app/infrastructure';
import { StyleSwipeProvider } from '@app/ui-kit';
import { ConvexBetterAuthProvider } from '@convex-dev/better-auth/react';
import { Slot, useRouter, useSegments } from 'expo-router';
import React from 'react';
import { Platform } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { YStack, Spinner } from 'tamagui';

import { authAdapter } from '../src/lib/auth';
import { logger } from '../src/lib/logger';
import { usePushNotifications } from '../src/lib/notifications';

const convex = new ConvexReactClient(process.env.EXPO_PUBLIC_CONSUMER_APP_CONVEX_URL as string);

/**
 * Auth guard: handles redirects based on auth state.
 * IMPORTANT: Must always render children (Slot) — never block the navigator.
 * Expo Router requires the navigator to always be rendered to maintain LinkingContext.
 */
function AuthGuard({ children }: { children: React.ReactNode }) {
  const user = useCurrentUser();
  const segments = useSegments();
  const router = useRouter();

  // Register push notification listeners + token on app launch
  usePushNotifications();

  React.useEffect(() => {
    if (user) {
      logger.setUserId(user._id);
      logger.info('User session started', { userId: user._id });
    } else {
      logger.setUserId(null);
    }
  }, [user]);

  React.useEffect(() => {
    // Still loading — do nothing
    if (user === undefined) return;

    const inAuthGroup = segments[0] === '(auth)';
    const inOnboarding = segments[0] === 'onboarding';

    if (!user) {
      if (!inAuthGroup) {
        router.replace('/(auth)');
      }
    } else if (!user.styleProfile) {
      if (!inOnboarding) {
        router.replace('/onboarding');
      }
    } else {
      if (inAuthGroup || inOnboarding) {
        router.replace('/(app)/(tabs)');
      }
    }
  }, [user, segments, router]);

  return (
    <>
      {children}
      {/* Loading overlay — shown on top of the navigator while auth state is resolving */}
      {user === undefined && (
        <YStack
          position="absolute"
          top={0}
          left={0}
          right={0}
          bottom={0}
          justifyContent="center"
          alignItems="center"
          backgroundColor="$background"
          zIndex={999}
        >
          <Spinner size="large" color="$primary" />
        </YStack>
      )}
    </>
  );
}

export default function RootLayout() {
  React.useEffect(() => {
    if (Platform.OS !== 'web') {
      console.log('[App] Starting Background Model Download...');
      import('../src/infrastructure/ModelManager').then(({ ModelManager }) => {
        ModelManager.downloadModel(() => {}).catch((e: unknown) =>
          console.warn('Background Model Download Failed', e),
        );
      });
      import('../src/workers/BackgroundWorker').then(({ registerBackgroundWorker }) => {
        registerBackgroundWorker().catch((e: unknown) =>
          console.error('Failed to register worker', e),
        );
      });
    }
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ConvexBetterAuthProvider client={convex} authClient={authAdapter.client}>
        <StyleSwipeProvider theme="BrandIdentityLight">
          <AuthGuard>
            <Slot />
          </AuthGuard>
        </StyleSwipeProvider>
      </ConvexBetterAuthProvider>
    </GestureHandlerRootView>
  );
}
