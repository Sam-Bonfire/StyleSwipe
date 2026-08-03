/**
 * BlendSlider Component
 *
 * PRD Source: Partner Sync influence slider (0-100%)
 * Features: Visual slider with labels for self vs partner influence
 */

import { User, Users } from '@tamagui/lucide-icons';
import React from 'react';
import { styled, GetProps, YStack, XStack, Text, TamaguiElement } from 'tamagui';

const SliderFrame = styled(YStack, {
  name: 'BlendSlider',
  gap: '$2',
});

const LabelRow = styled(XStack, {
  name: 'BlendSliderLabelRow',
  justifyContent: 'space-between',
  alignItems: 'center',
});

const SideLabel = styled(XStack, {
  name: 'BlendSliderSideLabel',
  alignItems: 'center',
  gap: '$1',
});

const LabelText = styled(Text, {
  name: 'BlendSliderLabelText',
  fontFamily: '$body',
  fontSize: '$3',
  fontWeight: '500',
  color: '$textSecondary',
});

const ValueText = styled(Text, {
  name: 'BlendSliderValueText',
  fontFamily: '$body',
  fontSize: '$4',
  fontWeight: '700',
  color: '$primary',
});

const TrackContainer = styled(YStack, {
  name: 'BlendSliderTrackContainer',
  height: 48,
  position: 'relative',
  justifyContent: 'center',
});

const Track = styled(XStack, {
  name: 'BlendSliderTrack',
  height: 8,
  borderRadius: '$full',
  overflow: 'hidden',
});

const TrackFill = styled(YStack, {
  name: 'BlendSliderTrackFill',
  height: '100%',
});

const Thumb = styled(YStack, {
  name: 'BlendSliderThumb',
  position: 'absolute',
  width: 28,
  height: 28,
  borderRadius: '$full',
  backgroundColor: '$surface',
  borderWidth: 3,
  borderColor: '$primary',

  shadowColor: '$shadowColor',
  cursor: 'grab',

  hoverStyle: {
    scale: 1.1,
  },

  pressStyle: {
    scale: 0.95,
    cursor: 'grabbing',
  },
});

const DescriptionText = styled(Text, {
  name: 'BlendSliderDescription',
  fontFamily: '$body',
  fontSize: '$3',
  fontWeight: '400',
  color: '$textSecondary',
  textAlign: 'center',
});

export type BlendSliderProps = GetProps<typeof SliderFrame> & {
  value: number; // 0-100, represents partner influence
  onChange: (value: number) => void;
  partnerName?: string;
  disabled?: boolean;
};

export const BlendSlider = React.forwardRef<TamaguiElement, BlendSliderProps>(
  (props: BlendSliderProps, ref) => {
    const { value, onChange, partnerName = 'Partner', disabled = false, ...rest } = props as any;

    const selfInfluence = 100 - (value as number);

    const handleTrackPress = (e: any) => {
      if (disabled) return;

      // Calculate new value based on press position
      const rect = e.currentTarget.getBoundingClientRect?.();
      if (rect) {
        const x = e.nativeEvent?.locationX || e.clientX - rect.left;
        const percentage = Math.round((x / rect.width) * 100);
        onChange(Math.max(0, Math.min(100, percentage)));
      }
    };

    const getDescription = () => {
      if ((value as number) === 0) return 'Your feed only';
      if ((value as number) <= 25) return `Subtle hints from ${partnerName}`;
      if ((value as number) <= 50) return `Balanced blend with ${partnerName}`;
      if ((value as number) <= 75) return `${partnerName} leading the way`;
      if ((value as number) < 100) return `Mostly ${partnerName} style`;
      return `${partnerName} feed only`;
    };

    return (
      <SliderFrame ref={ref as any} opacity={disabled ? 0.5 : 1} {...rest}>
        {
          (
            <>
              <LabelRow>
                <SideLabel>
                  {(<User size={16} color="$textSecondary" />) as any}
                  <LabelText>You</LabelText>
                </SideLabel>
                <SideLabel>
                  <LabelText>{partnerName}</LabelText>
                  {(<Users size={16} color="$textSecondary" />) as any}
                </SideLabel>
              </LabelRow>

              <TrackContainer onPress={handleTrackPress as any}>
                <Track>
                  <TrackFill backgroundColor="$secondary" width={`${selfInfluence}%`} />
                  <TrackFill backgroundColor="$primary" width={`${value}%`} />
                </Track>

                <Thumb left={`${value}%`} transform={[{ translateX: -14 }]} />
              </TrackContainer>

              <XStack justifyContent="space-between">
                <ValueText>{selfInfluence}%</ValueText>
                <ValueText>{value}%</ValueText>
              </XStack>

              <DescriptionText>{getDescription()}</DescriptionText>
            </>
          ) as any
        }
      </SliderFrame>
    );
  },
);

BlendSlider.displayName = 'BlendSlider';

export default BlendSlider;
