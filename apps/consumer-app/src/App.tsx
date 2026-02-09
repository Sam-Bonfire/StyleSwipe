import 'react-native-gesture-handler';
import { api } from '@app/convex';
import { config, ToastProvider } from '@app/ui-kit';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { ConvexReactClient, useQuery } from 'convex/react';
import React from 'react';
import { TamaguiProvider, Theme } from 'tamagui';
import { YStack, Spinner } from 'tamagui';

import { AuthSelectionScreen } from './screens/auth/AuthSelectionScreen';
import { EmailAuthScreen } from './screens/auth/EmailAuthScreen';
import { OTPScreen } from './screens/auth/OTPScreen';
import { PhoneAuthScreen } from './screens/auth/PhoneAuthScreen';
import { CheckoutScreen } from './screens/commerce/CheckoutScreen';
import { ProductDetailScreen } from './screens/discovery/ProductDetailScreen';
import { MainScreen } from './screens/main/MainScreen';
import { OnboardingScreen } from './screens/onboarding/OnboardingScreen';
import { EditProfileScreen } from './screens/profile/EditProfileScreen';
import { FeedbackScreen } from './screens/profile/FeedbackScreen';

const Stack = createStackNavigator();

// Convex client is now initialized in index.js
const convex = new ConvexReactClient(process.env.EXPO_PUBLIC_CONSUMER_APP_CONVEX_URL);
import { logger } from './lib/logger';


function NavigationGuard() {
  const user = useQuery(api.users.currentUser);

  // Sync User ID with Logger
  React.useEffect(() => {
    if (user) {
      logger.setUserId(user._id);
      logger.info('User session started', { userId: user._id });
    } else {
      logger.setUserId(null);
    }
  }, [user]);

  // Loading state
  if (user === undefined) {
    return (
      <YStack flex={1} justifyContent="center" alignItems="center" backgroundColor="$background">
        <Spinner size="large" color="$primary" />
      </YStack>
    );
  }

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {!user ? (
        // 1. Auth Flow
        <>
          <Stack.Screen name="AuthSelection" component={AuthSelectionScreen} />
          <Stack.Screen name="PhoneAuth" component={PhoneAuthScreen} />
          <Stack.Screen name="EmailAuth" component={EmailAuthScreen} />
          <Stack.Screen name="OTP" component={OTPScreen} />
        </>
      ) : !user.styleProfile ? (
        // 2. Onboarding Flow
        <Stack.Screen name="Onboarding" component={OnboardingScreen} />
      ) : (
        // 3. App Flow
        <>
          <Stack.Screen name="Main" component={MainScreen} />
          <Stack.Screen name="ProductDetail" component={ProductDetailScreen} />
          <Stack.Screen name="Checkout" component={CheckoutScreen} />
          <Stack.Screen name="EditProfile" component={EditProfileScreen} />
          <Stack.Screen name="Feedback" component={FeedbackScreen} />
        </>
      )}
    </Stack.Navigator>
  );
}

import { ConvexBetterAuthProvider } from '@convex-dev/better-auth/react';
import { Platform } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { ModelManager } from './infrastructure/ModelManager';
import { authAdapter } from './lib/auth';
import { navigationRef, onNavigationStateChange } from './lib/NavigationLogger';
import { registerBackgroundWorker } from './workers/BackgroundWorker';

export default function App() {
  // -----------------------------------------------------
  // BACKGROUND MODEL SYNC
  // -----------------------------------------------------
  // Trigger Model Download immediately on App Launch (Native Only)
  // On Web, the engine uses the browser cache automatically when needed.
  // But for Native, we want to pre-download the 40MB file.

  React.useEffect(() => {
    if (Platform.OS !== 'web') {
      console.log('[App] Starting Background Model Download...');
      ModelManager.downloadModel(() => {
        // Optional: Log progress or use a global store
        // console.log(`Model Progress: ${p}`);
      }).catch((e) => console.warn('Background Model Download Failed', e));

      // Register background tasks
      registerBackgroundWorker().catch((e) => console.error('Failed to register worker', e));
    } else {
      // For web, we might want to run the loop directly or handled by worker script
      registerBackgroundWorker();
    }
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ConvexBetterAuthProvider client={convex} authClient={authAdapter.client}>
        <TamaguiProvider config={config}>
          <Theme name="BrandIdentityLight">
            <ToastProvider>
              <NavigationContainer
                ref={navigationRef}
                onStateChange={onNavigationStateChange}
              >
                <NavigationGuard />
              </NavigationContainer>
            </ToastProvider>
          </Theme>
        </TamaguiProvider>
      </ConvexBetterAuthProvider>
    </GestureHandlerRootView>
  );
}
