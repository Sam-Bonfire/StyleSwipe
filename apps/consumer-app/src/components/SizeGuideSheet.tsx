import { DEFAULT_MODEL_MEASUREMENTS, parseSizeChartFromAttributes, recommendSize, type SizeChartRow } from '@app/core';
import React, { useMemo, useState } from 'react';
import { ScrollView } from 'react-native';
import { Button, Input, Sheet, Text, XStack, YStack, Separator } from 'tamagui';

export type SizeGuideSheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  attributes?: Record<string, unknown>;
  brand?: string;
  modelMeasurements?: typeof DEFAULT_MODEL_MEASUREMENTS;
  onSelectSize?: (size: string) => void;
};

export function SizeGuideSheet({ open, onOpenChange, attributes, brand, modelMeasurements = DEFAULT_MODEL_MEASUREMENTS, onSelectSize }: SizeGuideSheetProps) {
  const chart: SizeChartRow[] = useMemo(() => parseSizeChartFromAttributes(attributes), [attributes]);
  const [chest, setChest] = useState<string>('');
  const [waist, setWaist] = useState<string>('');
  const [hips, setHips] = useState<string>('');
  const [recommended, setRecommended] = useState<string | null>(null);

  const handleFind = () => {
    const input = {
      chest: chest ? Number(chest) : undefined,
      waist: waist ? Number(waist) : undefined,
      hips: hips ? Number(hips) : undefined,
    };
    const rec = recommendSize(input, chart);
    setRecommended(rec);
  };

  const handleSelect = (label: string) => {
    onSelectSize?.(label);
    onOpenChange(false);
  };

  return (
    <Sheet modal open={open} onOpenChange={onOpenChange} snapPoints={[85]} dismissOnSnapToBottom>
      <Sheet.Overlay backgroundColor="rgba(0,0,0,0.5)" />
      <Sheet.Frame backgroundColor="$background" borderTopLeftRadius="$5" borderTopRightRadius="$5">
        <Sheet.Handle backgroundColor="$borderColor" height={5} width={40} marginVertical="$3" alignSelf="center" />
        <YStack flex={1} padding="$4" gap="$3">
          <Text fontSize="$5" fontWeight="700" color="$textPrimary">
            Size Guide {brand ? `• ${brand}` : ''}
          </Text>
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 24 }}>
            <YStack gap="$4">
              {/* Model measurements */}
              <YStack gap="$2" backgroundColor="$surface" padding="$3" borderRadius="$3" borderWidth={1} borderColor="$borderColor">
                <Text fontSize="$4" fontWeight="600">Model Measurements</Text>
                <XStack justifyContent="space-between"><Text color="$textSecondary">Height</Text><Text fontWeight="600">{modelMeasurements.height}</Text></XStack>
                <XStack justifyContent="space-between"><Text color="$textSecondary">Bust</Text><Text fontWeight="600">{modelMeasurements.bust}</Text></XStack>
                <XStack justifyContent="space-between"><Text color="$textSecondary">Waist</Text><Text fontWeight="600">{modelMeasurements.waist}</Text></XStack>
                <XStack justifyContent="space-between"><Text color="$textSecondary">Hips</Text><Text fontWeight="600">{modelMeasurements.hips}</Text></XStack>
                <XStack justifyContent="space-between"><Text color="$textSecondary">Wearing</Text><Text fontWeight="600">{modelMeasurements.wearingSize}</Text></XStack>
              </YStack>

              {/* Brand size chart from products.attributes */}
              <YStack gap="$2">
                <Text fontSize="$4" fontWeight="600">Brand Size Chart</Text>
                <YStack borderWidth={1} borderColor="$borderColor" borderRadius="$3" overflow="hidden">
                  <XStack backgroundColor="$neutral100" padding="$2">
                    <Text flex={1} fontWeight="600" fontSize="$2">Size</Text>
                    <Text flex={1} fontWeight="600" fontSize="$2" textAlign="center">Chest</Text>
                    <Text flex={1} fontWeight="600" fontSize="$2" textAlign="center">Waist</Text>
                    <Text flex={1} fontWeight="600" fontSize="$2" textAlign="center">Hips</Text>
                  </XStack>
                  {chart.map((row) => (
                    <XStack key={row.label} padding="$2" borderTopWidth={1} borderColor="$borderColor" backgroundColor={recommended === row.label ? '$primary' : 'transparent'} opacity={recommended === row.label ? 0.9 : 1}>
                      <Text flex={1} fontWeight="600" color={recommended === row.label ? 'white' : '$textPrimary'}>{row.label}</Text>
                      <Text flex={1} textAlign="center" color={recommended === row.label ? 'white' : '$textPrimary'}>{row.chest ?? '-'}</Text>
                      <Text flex={1} textAlign="center" color={recommended === row.label ? 'white' : '$textPrimary'}>{row.waist ?? '-'}</Text>
                      <Text flex={1} textAlign="center" color={recommended === row.label ? 'white' : '$textPrimary'}>{row.hips ?? '-'}</Text>
                    </XStack>
                  ))}
                </YStack>
              </YStack>

              <Separator borderColor="$borderColor" />

              {/* Find my size */}
              <YStack gap="$2" backgroundColor="$surface" padding="$3" borderRadius="$3" borderWidth={1} borderColor="$borderColor">
                <Text fontSize="$4" fontWeight="600">Find my size</Text>
                <Text fontSize="$2" color="$textSecondary">Enter your measurements in inches to get a recommendation.</Text>
                <XStack gap="$2">
                  <YStack flex={1} gap="$1">
                    <Text fontSize="$2" color="$textSecondary">Chest</Text>
                    <Input keyboardType="numeric" placeholder="36" value={chest} onChangeText={setChest} size="$3" borderColor="$borderColor" />
                  </YStack>
                  <YStack flex={1} gap="$1">
                    <Text fontSize="$2" color="$textSecondary">Waist</Text>
                    <Input keyboardType="numeric" placeholder="30" value={waist} onChangeText={setWaist} size="$3" borderColor="$borderColor" />
                  </YStack>
                  <YStack flex={1} gap="$1">
                    <Text fontSize="$2" color="$textSecondary">Hips</Text>
                    <Input keyboardType="numeric" placeholder="36" value={hips} onChangeText={setHips} size="$3" borderColor="$borderColor" />
                  </YStack>
                </XStack>
                <Button backgroundColor="$primary" onPress={handleFind} marginTop="$2">
                  <Text color="white" fontWeight="600">Find my size</Text>
                </Button>
                {recommended && (
                  <YStack backgroundColor="$success" padding="$2" borderRadius="$2" alignItems="center">
                    <Text color="white" fontWeight="700">Recommended: {recommended}</Text>
                    <Text color="white" fontSize="$2" textAlign="center">Tap to select this size</Text>
                    <Button size="$3" marginTop="$1" onPress={() => handleSelect(recommended)}><Text>Use {recommended}</Text></Button>
                  </YStack>
                )}
              </YStack>
            </YStack>
          </ScrollView>
        </YStack>
      </Sheet.Frame>
    </Sheet>
  );
}
