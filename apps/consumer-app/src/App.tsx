import 'react-native-gesture-handler';
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { TamaguiProvider, Theme } from 'tamagui';
import { config } from '@app/ui-kit';
import { SignInScreen } from './screens/auth/SignInScreen';
import { OTPScreen } from './screens/auth/OTPScreen';
import { DesignSystemGallery } from './screens/DesignSystemGallery';
import { DiscoveryScreen } from './screens/DiscoveryScreen';
import { ConvexProvider, ConvexReactClient } from "convex/react";

const Stack = createStackNavigator();
const convex = new ConvexReactClient(process.env.EXPO_PUBLIC_CONVEX_URL || "https://happy-otter-123.convex.cloud");

export default function App() {
    return (
        <ConvexProvider client={convex}>
            <TamaguiProvider config={config}>
                <Theme name="BrandIdentityLight">
                    <NavigationContainer>
                        <Stack.Navigator initialRouteName="Discovery" screenOptions={{ headerShown: false }}>
                            <Stack.Screen name="Discovery" component={DiscoveryScreen} />
                            <Stack.Screen name="SignIn" component={SignInScreen} />
                            <Stack.Screen name="OTP" component={OTPScreen} />
                            <Stack.Screen name="Home" component={DesignSystemGallery} />
                        </Stack.Navigator>
                    </NavigationContainer>
                </Theme>
            </TamaguiProvider>
        </ConvexProvider>
    );
}
