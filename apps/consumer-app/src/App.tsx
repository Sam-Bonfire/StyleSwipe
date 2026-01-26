import 'react-native-gesture-handler';
import { config } from '@app/ui-kit';
import { api } from "@convex-api";
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { ConvexReactClient, useQuery } from "convex/react";
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

const Stack = createStackNavigator();

const convex = new ConvexReactClient(process.env.EXPO_PUBLIC_CONSUMER_APP_CONVEX_URL);

function NavigationGuard() {
    const user = useQuery(api.users.currentUser);
    console.log("NavigationGuard User State:", JSON.stringify(user));

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
                // 3. App Flow
                <>
                    <Stack.Screen name="Main" component={MainScreen} />
                    <Stack.Screen name="ProductDetail" component={ProductDetailScreen} />
                    <Stack.Screen name="Checkout" component={CheckoutScreen} />
                </>
            )}
        </Stack.Navigator>
    );
}

import { ConvexBetterAuthProvider } from "@convex-dev/better-auth/react";
import { Platform } from 'react-native';

import { ModelManager } from './infrastructure/ModelManager';
import { authAdapter } from './lib/auth';

export default function App() {
    // -----------------------------------------------------
    // BACKGROUND MODEL SYNC
    // -----------------------------------------------------
    // Trigger Model Download immediately on App Launch (Native Only)
    // On Web, the engine uses the browser cache automatically when needed.
    // But for Native, we want to pre-download the 40MB file.

    React.useEffect(() => {
        if (Platform.OS !== 'web') {
            console.log("[App] Starting Background Model Download...");
            ModelManager.downloadModel(() => {
                // Optional: Log progress or use a global store
                // console.log(`Model Progress: ${p}`);
            }).catch(e => console.warn("Background Model Download Failed", e));
        }
    }, []);

    return (
        <ConvexBetterAuthProvider client={convex} authClient={authAdapter.client}>
            <TamaguiProvider config={config}>
                <Theme name="BrandIdentityLight">
                    <NavigationContainer>
                        <NavigationGuard />
                    </NavigationContainer>
                </Theme>
            </TamaguiProvider>
        </ConvexBetterAuthProvider>
    );
}

