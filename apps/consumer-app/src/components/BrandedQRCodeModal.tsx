import { Button as UIButton } from '@app/ui-kit';
import { X } from '@tamagui/lucide-icons';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import React, { useRef } from 'react';
import { Modal, Alert, Platform } from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import { YStack, XStack, Text, Button, useTheme } from 'tamagui';

// eslint-disable-next-line @typescript-eslint/no-require-imports
const logoSource = require('../../../../assets/favicon/favicon.png');

interface BrandedQRCodeModalProps {
  visible: boolean;
  onClose: () => void;
  url: string;
}

export function BrandedQRCodeModal({ visible, onClose, url }: BrandedQRCodeModalProps) {
  const theme = useTheme();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const svgRef = useRef<any>(null);

  const handleShareQR = () => {
    if (svgRef.current) {
      svgRef.current.toDataURL(async (dataURL: string) => {
        try {
          if (Platform.OS === 'web') {
            const a = document.createElement('a');
            a.href = `data:image/png;base64,${dataURL}`;
            a.download = 'styleswipe-qrcode.png';
            a.click();
            return;
          }

          const fileUri = FileSystem.cacheDirectory + 'styleswipe-qrcode.png';
          await FileSystem.writeAsStringAsync(fileUri, dataURL, { encoding: FileSystem.EncodingType.Base64 });
          
          if (await Sharing.isAvailableAsync()) {
            await Sharing.shareAsync(fileUri, {
              mimeType: 'image/png',
              dialogTitle: 'Share Partner Sync QR Code',
            });
          } else {
            Alert.alert('Unavailable', 'Sharing is not available on this device');
          }
        } catch (error) {
          console.error('Error sharing QR Code:', error);
          Alert.alert('Error', 'Failed to share QR Code');
        }
      });
    }
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <YStack
        flex={1}
        backgroundColor="rgba(0, 0, 0, 0.5)"
        alignItems="center"
        justifyContent="center"
        padding="$4"
      >
        <YStack
          backgroundColor="$background"
          borderRadius="$4"
          padding="$6"
          alignItems="center"
          width="100%"
          maxWidth={340}
          elevation={5}
        >
          <XStack width="100%" justifyContent="space-between" alignItems="center" marginBottom="$4">
            <Text fontSize="$6" fontWeight="bold" color="$textPrimary">
              Partner Sync
            </Text>
            <Button
              size="$3"
              circular
              icon={X}
              onPress={onClose}
              backgroundColor="$backgroundHover"
            />
          </XStack>

          <Text fontSize="$3" color="$textSecondary" textAlign="center" marginBottom="$6">
            Scan this QR code with your camera to instantly sync styles.
          </Text>

          <YStack
            backgroundColor="white"
            padding="$4"
            borderRadius="$3"
            borderColor="$borderColor"
            borderWidth={1}
          >
            {/* 
              Using react-native-qrcode-svg for the QR code.
              We apply the primary theme color to the QR blocks.
              The logo is embedded in the center to brand it to StyleSwipe.
            */}
            <QRCode
              getRef={(c) => (svgRef.current = c)}
              value={url}
              size={200}
              color={theme.primary?.val || '#000000'}
              backgroundColor="white"
              logo={logoSource}
              logoSize={40}
              logoBackgroundColor="transparent"
            />
          </YStack>

          <Text
            fontSize="$2"
            color="$primary"
            fontWeight="600"
            marginTop="$4"
            letterSpacing={1}
            textTransform="uppercase"
          >
            StyleSwipe
          </Text>

          <UIButton 
            marginTop="$6" 
            variant="primary" 
            width="100%" 
            onPress={handleShareQR}
          >
            Share QR Image
          </UIButton>
        </YStack>
      </YStack>
    </Modal>
  );
}
