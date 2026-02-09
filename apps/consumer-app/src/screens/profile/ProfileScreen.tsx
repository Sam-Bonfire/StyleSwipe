import { api } from '@app/convex';
import { Button } from '@app/ui-kit';
import { useNavigation } from '@react-navigation/native';
import { useQuery } from 'convex/react';
import React from 'react';
import { SafeAreaView } from 'react-native';
import { YStack, Text, Avatar, XStack } from 'tamagui';

import { authAdapter } from '../../lib/auth';

export function ProfileScreen() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const navigation = useNavigation<any>();
  const user = useQuery(api.users.currentUser);

  const handleLogout = async () => {
    await authAdapter.signOut();
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: 'white' }}>
      <YStack flex={1} padding="$4" space="$6">
        {user && (
          <XStack alignItems="center" space="$4">
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
        )}

        <YStack space="$4" marginTop="$4">
          <Button variant="outlined" onPress={() => navigation.navigate('EditProfile')}>Edit Profile</Button>
          <Button variant="outlined" onPress={() => navigation.navigate('Feedback')}>Give Feedback</Button>
          <Button color="$error" variant="ghost" onPress={handleLogout}>
            Sign Out
          </Button>
        </YStack>

        <YStack backgroundColor="$backgroundHover" padding="$4" borderRadius="$4" marginTop="auto">
          <Text fontSize="$4" fontWeight="bold" marginBottom="$2">Thank you for being here!</Text>
          <Text fontSize="$3" opacity={0.8}>
            We are working hard to build the best fashion experience for you.
            Your feedback helps us grow and improve StyleSwipe every day.
          </Text>
        </YStack>
      </YStack>
    </SafeAreaView>
  );
}
