import { useCurrentUser } from '@app/infrastructure';
import { Button } from '@app/ui-kit';
import { useRouter } from 'expo-router';
import React from 'react';
import { SafeAreaView, ScrollView } from 'react-native';
import { YStack, Text, Avatar, XStack } from 'tamagui';

import { authAdapter } from '../../lib/auth';

export function ProfileScreen() {
  const router = useRouter();
  const user = useCurrentUser();

  const handleLogout = async () => {
    await authAdapter.signOut();
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: 'white' }}>
      <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
        <YStack flex={1} padding="$4" gap="$6">
          {user ? (
            <XStack alignItems="center" gap="$4">
              <Avatar circular size="$10">
                <Avatar.Image src={user.image} />
                <Avatar.Fallback backgroundColor="$primary" />
              </Avatar>
              <YStack>
                <Text fontWeight="bold" fontSize="$5">
                  {user.name}
                </Text>
                <Text color="$textSecondary">{user.email}</Text>
              </YStack>
            </XStack>
          ) : (
            <YStack gap="$2" alignItems="center">
              <Text fontWeight="bold" fontSize="$5">
                Welcome to StyleSwipe
              </Text>
              <Text color="$textSecondary" textAlign="center">
                Sign in to personalize your style and save favorites.
              </Text>
              <Button variant="primary" onPress={() => router.push('/(auth)')}>
                Sign In
              </Button>
            </YStack>
          )}

          <YStack gap="$4" marginTop="$4">
            <Button variant="primary" onPress={() => router.push('/(app)/partner-sync')}>Partner Sync</Button>
            <Button variant="outlined" onPress={() => router.push('/(app)/edit-profile')}>Edit Profile</Button>
            <Button variant="outlined" onPress={() => router.push('/onboarding')}>Personalize later</Button>
            <Button variant="outlined" onPress={() => router.push('/(app)/wishlist')}>My Wishlist</Button>
            <Button variant="outlined" onPress={() => router.push('/(app)/orders')}>Your Orders</Button>
            <Button variant="outlined" onPress={() => router.push('/(app)/feedback')}>Give Feedback</Button>
            <Button variant="ghost" onPress={handleLogout}>
              Sign Out
            </Button>
          </YStack>

          <YStack backgroundColor="$backgroundHover" padding="$4" borderRadius="$4" marginTop="auto" marginBottom="$4">
            <Text fontSize="$4" fontWeight="bold" marginBottom="$2">Thank you for being here!</Text>
            <Text fontSize="$3" opacity={0.8}>
              We are working hard to build the best fashion experience for you.
              Your feedback helps us grow and improve StyleSwipe every day.
            </Text>
          </YStack>
        </YStack>
      </ScrollView>
    </SafeAreaView>
  );
}
