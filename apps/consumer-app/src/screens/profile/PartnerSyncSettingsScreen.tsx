import { useCurrentUser, useCreatePartnerSync, useActivePartnerSync, useStopPartnerSync } from '@app/infrastructure';
import { Button } from '@app/ui-kit';
import { Users, Clock, Link2, QrCode, Sparkles, HeartHandshake, ChevronLeft } from '@tamagui/lucide-icons';
import * as Clipboard from 'expo-clipboard';
import * as Linking from 'expo-linking';
import { Stack, useRouter } from 'expo-router';
import React, { useState } from 'react';
import { SafeAreaView, Share, Alert, Platform, ScrollView } from 'react-native';
import { YStack, XStack, Text, Image, styled } from 'tamagui';

import { BrandedQRCodeModal } from '../../components/BrandedQRCodeModal';

export type Duration = '30m' | '1h' | '2h' | '24h';

const DURATIONS: { value: Duration; label: string }[] = [
  { value: '30m', label: '30 min' },
  { value: '1h', label: '1 hour' },
  { value: '2h', label: '2 hours' },
  { value: '24h', label: '24 hours' },
];

const DurationChip = styled(YStack, {
  name: 'DurationChip',
  paddingHorizontal: '$3',
  paddingVertical: '$2',
  borderRadius: '$full',
  borderWidth: 2,
  cursor: 'pointer',
  minWidth: 80,
  flex: 1,
  alignItems: 'center',
  justifyContent: 'center',

  variants: {
    selected: {
      true: {
        backgroundColor: '$primary',
        borderColor: '$primary',
      },
      false: {
        backgroundColor: 'transparent',
        borderColor: '$borderColor',
      },
    },
  } as const,
});

const DurationChipText = styled(Text, {
  name: 'DurationChipText',
  fontFamily: '$body',
  fontSize: '$3',
  fontWeight: '600',
  textAlign: 'center',

  variants: {
    selected: {
      true: { color: '$textInverse' },
      false: { color: '$textPrimary' },
    },
  } as const,
});

const FeatureRow = ({ icon: Icon, title, description }: { icon: React.ElementType; title: string; description: string }) => (
  <XStack gap="$3" alignItems="flex-start" marginBottom="$4">
    <YStack padding="$3" backgroundColor="$backgroundHover" borderRadius="$full">
      <Icon size={24} color="$primary" />
    </YStack>
    <YStack flex={1}>
      <Text fontWeight="bold" fontSize="$4" color="$textPrimary">{title}</Text>
      <Text fontSize="$3" color="$textSecondary" marginTop="$1" lineHeight={20}>{description}</Text>
    </YStack>
  </XStack>
);

export function PartnerSyncSettingsScreen() {
  const router = useRouter();
  const user = useCurrentUser();
  const createSync = useCreatePartnerSync();
  const activeSyncs = useActivePartnerSync(user?._id) as Record<string, unknown>[]; // cast since type might not be synced
  const stopSync = useStopPartnerSync();

  const [selectedDuration, setSelectedDuration] = useState<Duration>('1h');
  const [qrModalVisible, setQrModalVisible] = useState(false);
  const [currentUrl, setCurrentUrl] = useState('');

  const generateLink = async (duration: string) => {
    if (!user) {
      Alert.alert('Login Required', 'Please log in to sync your style.');
      return null;
    }
    
    let durationMs = 60 * 60 * 1000;
    if (duration === '30m') durationMs = 30 * 60 * 1000;
    if (duration === '2h') durationMs = 2 * 60 * 60 * 1000;
    if (duration === '24h') durationMs = 24 * 60 * 60 * 1000;

    try {
      const { inviteCode } = await createSync(user._id, durationMs);
      
      let url = '';
      if (Platform.OS === 'web' && typeof window !== 'undefined') {
        url = `${window.location.origin}/sync/${inviteCode}`;
      } else {
        const baseUrl = process.env.EXPO_PUBLIC_APP_URL || Linking.createURL('/');
        url = `${baseUrl.replace(/\/$/, '')}/sync/${inviteCode}`;
      }
      
      return url;
    } catch (e) {
      console.error(e);
      Alert.alert('Error', 'Failed to generate sync link.');
      return null;
    }
  };

  const handleShareLink = async (duration: string) => {
    const url = await generateLink(duration);
    if (!url) return;
    try {
      if (Platform.OS === 'web') {
        await Clipboard.setStringAsync(url);
        Alert.alert('Link Copied', 'The sync link has been copied to your clipboard!');
      } else {
        await Share.share({
          message: `Let's sync our style on StyleSwipe! Click here to join my session: ${url}`,
          url: Platform.OS === 'ios' ? url : undefined,
        });
      }
    } catch (error) {
      console.error(error);
    }
  };

  const handleShowQR = async (duration: string) => {
    const url = await generateLink(duration);
    if (!url) return;
    setCurrentUrl(url);
    setQrModalVisible(true);
  };

  const handleStopSharing = async (syncId: string) => {
    if (syncId) {
      await stopSync(syncId);
    }
  };

  const getRemainingTime = (expiresAt?: number) => {
    if (!expiresAt) return '';
    const diff = Math.max(0, expiresAt - Date.now());
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    if (hours > 0) return `${hours}h ${mins}m`;
    return `${mins}m`;
  };

  const hasActiveSyncs = Array.isArray(activeSyncs) && activeSyncs.length > 0;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: 'white' }}>
      <Stack.Screen 
        options={{ 
          title: 'Partner Sync',
          headerLeft: () => (
            <YStack onPress={() => router.back()} padding="$2" marginLeft="$-2" cursor="pointer">
              <ChevronLeft size={24} color="$textPrimary" />
            </YStack>
          )
        }} 
      />
      <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
        <YStack flex={1}>
          
          {/* Hero Banner */}
          <YStack backgroundColor="$primary" paddingTop={Platform.OS === 'ios' ? 70 : 50} paddingBottom="$6" paddingHorizontal="$6" alignItems="center" justifyContent="center" position="relative">
            <YStack
              position="absolute" 
              top={Platform.OS === 'ios' ? 50 : 20} 
              left="$4" 
              padding="$2" 
              backgroundColor="rgba(255, 255, 255, 0.2)"
              borderRadius="$full"
              cursor="pointer"
              onPress={() => router.back()}
              zIndex={10}
            >
              <ChevronLeft size={24} color="white" />
            </YStack>

            <YStack width={80} height={80} borderRadius="$full" backgroundColor="rgba(255,255,255,0.2)" alignItems="center" justifyContent="center" marginBottom="$4">
              <HeartHandshake size={40} color="white" />
            </YStack>
            <Text fontFamily="$heading" fontSize="$6" fontWeight="bold" color="white" textAlign="center">
              Collaborative Shopping
            </Text>
            <Text fontSize="$4" color="white" opacity={0.9} textAlign="center" marginTop="$2" paddingHorizontal="$4">
              Connect your accounts to blend your Style DNA and discover outfits together.
            </Text>
          </YStack>

          <YStack padding="$4" gap="$4" flex={1}>
            
            {hasActiveSyncs && (
              <YStack gap="$4" marginBottom="$2">
                 <XStack alignItems="center" gap="$3">
                   <YStack padding="$2" backgroundColor="$primaryLight" borderRadius="$full">
                     <Users size={24} color="$primary" />
                   </YStack>
                   <YStack flex={1}>
                     <Text fontWeight="bold" fontSize="$5" color="$primary">Active Sessions</Text>
                     <Text fontSize="$3" color="$textSecondary">Your feed is currently blended</Text>
                   </YStack>
                 </XStack>

                 {activeSyncs.map(sync => (
                   <YStack key={sync._id as string} backgroundColor="$surface" padding="$4" borderRadius="$4" borderWidth={1} borderColor="$primaryLight" gap="$4">
                     <XStack backgroundColor="$backgroundHover" padding="$3" borderRadius="$3" alignItems="center" gap="$3">
                       <Image 
                         source={{ uri: (sync.partnerImage as string) || 'https://picsum.photos/40' }} 
                         width={40} 
                         height={40} 
                         borderRadius={20} 
                       />
                       <YStack flex={1}>
                         <Text fontWeight="bold" fontSize="$4">Syncing with {sync.partnerName as string}</Text>
                         <Text fontSize="$3" color="$textSecondary">
                           Expires in {getRemainingTime(sync.expiresAt as number)}
                         </Text>
                       </YStack>
                     </XStack>

                     <Button variant="secondary" onPress={() => handleStopSharing(sync._id as string)} marginTop="$2">
                       Stop Sharing
                     </Button>
                   </YStack>
                 ))}
              </YStack>
            )}

            {/* Features Explanation */}
            <YStack marginTop="$2" marginBottom="$4" paddingHorizontal="$2">
              <FeatureRow 
                icon={Sparkles} 
                title="Blended Recommendations" 
                description="Our AI mixes both of your preferences to find clothing you'll both love."
              />
              <FeatureRow 
                icon={Users} 
                title="Perfect for Events" 
                description="Shopping for a date, a wedding, or a couples vacation? Sync up and swipe together."
              />
              <FeatureRow 
                icon={Clock} 
                title="Temporary & Secure" 
                description="Your sync session automatically expires. Your data is never permanently merged."
              />
            </YStack>

            <YStack backgroundColor="$surface" padding="$4" borderRadius="$4" borderWidth={1} borderColor="$borderColor">
              <Text fontWeight="bold" fontSize="$4" marginBottom="$3">1. Select Duration</Text>
              <XStack flexWrap="wrap" gap="$3" marginBottom="$4">
                {DURATIONS.map((d) => (
                  <DurationChip
                    key={d.value}
                    flexBasis="45%"
                    selected={selectedDuration === d.value}
                    onPress={() => setSelectedDuration(d.value)}
                  >
                    <DurationChipText selected={selectedDuration === d.value}>
                      {d.label}
                    </DurationChipText>
                  </DurationChip>
                ))}
              </XStack>

              <Text fontWeight="bold" fontSize="$4" marginBottom="$3">2. Invite Partner</Text>
              <XStack gap="$3">
                <Button flex={1} variant="primary" icon={<Link2 size={18} />} onPress={() => handleShareLink(selectedDuration)}>
                  Share Link
                </Button>
                <Button flex={1} variant="outlined" icon={<QrCode size={18} />} onPress={() => handleShowQR(selectedDuration)}>
                  Show QR Code
                </Button>
              </XStack>
            </YStack>

          </YStack>
        </YStack>
      </ScrollView>

      <BrandedQRCodeModal
        visible={qrModalVisible}
        onClose={() => setQrModalVisible(false)}
        url={currentUrl}
      />
    </SafeAreaView>
  );
}
