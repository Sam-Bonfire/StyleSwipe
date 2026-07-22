import { useCurrentUser, usePartnerSyncByInviteCode, useAcceptPartnerSync } from '@app/infrastructure';
import { Button } from '@app/ui-kit';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { SafeAreaView, ActivityIndicator, Platform } from 'react-native';
import { YStack, Text, H2 } from 'tamagui';

export default function PartnerSyncScreen() {
  const { inviteCode } = useLocalSearchParams<{ inviteCode: string }>();
  const router = useRouter();
  
  const user = useCurrentUser();
  const syncDoc = usePartnerSyncByInviteCode(inviteCode);
  const acceptSync = useAcceptPartnerSync();
  
  const [isAccepting, setIsAccepting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Automatically accept if conditions met
  useEffect(() => {
    if (user && syncDoc && syncDoc.status === 'pending' && syncDoc.initiatorId !== user._id && !isAccepting && !error) {
      const handleAccept = async () => {
        setIsAccepting(true);
        try {
          await acceptSync(syncDoc._id, user._id);
          router.replace('/(app)/(tabs)');
        } catch {
          setError('Failed to accept sync request.');
          setIsAccepting(false);
        }
      };
      handleAccept();
    }
  }, [user, syncDoc, isAccepting, error, acceptSync, router]);

  if (Platform.OS === 'web') {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: 'white' }}>
        <YStack flex={1} padding="$4" justifyContent="center" alignItems="center" gap="$4">
          <H2>StyleSwipe Partner Sync</H2>
          <Text textAlign="center" color="$textSecondary">
            You've been invited to sync your style! Download the StyleSwipe app on iOS or Android to accept the invitation and start shopping together.
          </Text>
          <Button variant="primary" onPress={() => window.location.href = 'https://styleswipe.com'}>
            Download App
          </Button>
        </YStack>
      </SafeAreaView>
    );
  }

  if (syncDoc === undefined) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: 'white' }}>
        <YStack flex={1} padding="$4" justifyContent="center" alignItems="center">
          <ActivityIndicator size="large" color="#000" />
        </YStack>
      </SafeAreaView>
    );
  }

  if (syncDoc === null) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: 'white' }}>
        <YStack flex={1} padding="$4" justifyContent="center" alignItems="center" gap="$4">
          <H2>Invalid Link</H2>
          <Text textAlign="center" color="$textSecondary">
            This partner sync link is invalid or has expired.
          </Text>
          <Button variant="primary" onPress={() => router.replace('/(app)/(tabs)')}>
            Go Home
          </Button>
        </YStack>
      </SafeAreaView>
    );
  }

  if (!user) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: 'white' }}>
        <YStack flex={1} padding="$4" justifyContent="center" alignItems="center" gap="$4">
          <H2>Style Sync</H2>
          <Text textAlign="center" color="$textSecondary">
            Sign in to accept this style sync request and start exploring outfits together!
          </Text>
          <Button variant="primary" onPress={() => router.push('/(auth)')}>
            Sign In
          </Button>
        </YStack>
      </SafeAreaView>
    );
  }

  if (syncDoc.initiatorId === user._id) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: 'white' }}>
        <YStack flex={1} padding="$4" justifyContent="center" alignItems="center" gap="$4">
          <H2>Your Invite Link</H2>
          <Text textAlign="center" color="$textSecondary">
            Share this link with your partner so they can sync their style with yours!
          </Text>
          <Button variant="primary" onPress={() => router.replace('/(app)/(tabs)')}>
            Go Home
          </Button>
        </YStack>
      </SafeAreaView>
    );
  }

  if (syncDoc.status === 'active') {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: 'white' }}>
        <YStack flex={1} padding="$4" justifyContent="center" alignItems="center" gap="$4">
          <H2>Already Synced!</H2>
          <Text textAlign="center" color="$textSecondary">
            You are already synced with this partner.
          </Text>
          <Button variant="primary" onPress={() => router.replace('/(app)/(tabs)')}>
            Go Home
          </Button>
        </YStack>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: 'white' }}>
      <YStack flex={1} padding="$4" justifyContent="center" alignItems="center" gap="$4">
        <H2>Syncing...</H2>
        <ActivityIndicator size="large" color="#000" />
        {error && (
          <Text color="$error" textAlign="center">{error}</Text>
        )}
      </YStack>
    </SafeAreaView>
  );
}
