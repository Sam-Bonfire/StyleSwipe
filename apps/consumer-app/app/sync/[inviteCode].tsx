import { useCurrentUser, usePartnerSyncByInviteCode, useAcceptPartnerSync, useStopPartnerSync, useNotifySyncJoined } from '@app/infrastructure';
import { Button } from '@app/ui-kit';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useState } from 'react';
import { SafeAreaView, ActivityIndicator } from 'react-native';
import { YStack, Text, H2 } from 'tamagui';

export default function PartnerSyncScreen() {
  const { inviteCode } = useLocalSearchParams<{ inviteCode: string }>();
  const router = useRouter();

  const user = useCurrentUser();
  const syncDoc = usePartnerSyncByInviteCode(inviteCode);
  const acceptSync = useAcceptPartnerSync();
  const declineSync = useStopPartnerSync();
  const notifyJoined = useNotifySyncJoined();

  const [isAccepting, setIsAccepting] = useState(false);
  const [isDeclining, setIsDeclining] = useState(false);
  const [declined, setDeclined] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAccept = async () => {
    if (!user || !syncDoc || isAccepting) return;
    setIsAccepting(true);
    setError(null);
    try {
      await acceptSync(syncDoc._id, user._id);
      await notifyJoined(
        syncDoc.initiatorId as string,
        (user.name as string) || 'Your partner',
        inviteCode,
      );
      router.replace('/(app)/(tabs)');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to accept sync request.');
      setIsAccepting(false);
    }
  };

  const handleDecline = async () => {
    if (!syncDoc || isDeclining) return;
    setIsDeclining(true);
    setError(null);
    try {
      await declineSync(syncDoc._id);
      setDeclined(true);
    } catch {
      setError('Failed to decline sync request.');
    } finally {
      setIsDeclining(false);
    }
  };

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

  const isExpired =
    syncDoc.status === 'expired' || syncDoc.expiresAt <= Date.now();

  if (isExpired) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: 'white' }}>
        <YStack flex={1} padding="$4" justifyContent="center" alignItems="center" gap="$4">
          <H2>Link Expired</H2>
          <Text textAlign="center" color="$textSecondary">
            This style sync invitation has expired. Ask your partner for a fresh link!
          </Text>
          <Button variant="primary" onPress={() => router.replace('/(app)/(tabs)')}>
            Go Home
          </Button>
        </YStack>
      </SafeAreaView>
    );
  }

  if (declined) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: 'white' }}>
        <YStack flex={1} padding="$4" justifyContent="center" alignItems="center" gap="$4">
          <H2>Invite Declined</H2>
          <Text textAlign="center" color="$textSecondary">
            No problem — you can sync anytime from Partner Sync in your profile.
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

  const remainingMs = Math.max(0, syncDoc.expiresAt - Date.now());
  const remainingHours = Math.floor(remainingMs / (1000 * 60 * 60));
  const remainingMins = Math.floor((remainingMs % (1000 * 60 * 60)) / (1000 * 60));
  const remainingLabel = remainingHours > 0 ? `${remainingHours}h ${remainingMins}m` : `${remainingMins}m`;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: 'white' }}>
      <YStack flex={1} padding="$4" justifyContent="center" alignItems="center" gap="$4">
        <H2>Style Sync Invite</H2>
        <Text textAlign="center" color="$textSecondary">
          Your partner wants to blend Style DNAs and discover outfits together. Link expires in {remainingLabel}.
        </Text>
        {isAccepting || isDeclining ? (
          <ActivityIndicator size="large" color="#000" />
        ) : (
          <YStack gap="$3" width="100%" maxWidth={320}>
            <Button variant="primary" onPress={handleAccept}>
              Accept Invite
            </Button>
            <Button variant="outlined" onPress={handleDecline}>
              Decline
            </Button>
          </YStack>
        )}
        {error && (
          <Text color="$error" textAlign="center">{error}</Text>
        )}
      </YStack>
    </SafeAreaView>
  );
}
