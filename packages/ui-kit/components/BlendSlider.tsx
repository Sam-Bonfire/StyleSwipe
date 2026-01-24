/**
 * BlendSlider Component
 * 
 * PRD Source: Partner Sync influence slider (0-100%)
 * Features: Visual slider with labels for self vs partner influence
 */

import React from 'react';
import { styled, GetProps, YStack, XStack, Text, Stack } from 'tamagui';
import { User, Users } from '@tamagui/lucide-icons';

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

const TrackContainer = styled(Stack, {
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

const TrackFill = styled(Stack, {
    name: 'BlendSliderTrackFill',
    height: '100%',
});

const Thumb = styled(Stack, {
    name: 'BlendSliderThumb',
    position: 'absolute',
    width: 28,
    height: 28,
    borderRadius: '$full',
    backgroundColor: '$surface',
    borderWidth: 3,
    borderColor: '$primary',
    elevation: 4,
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

const PercentageLabel = styled(Text, {
    name: 'BlendSliderPercentage',
    fontFamily: '$heading',
    fontSize: '$6',
    fontWeight: '700',
    color: '$textPrimary',
    textAlign: 'center',
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

export const BlendSlider = React.forwardRef<typeof SliderFrame, BlendSliderProps>(
    ({
        value,
        onChange,
        partnerName = 'Partner',
        disabled = false,
        ...props
    }, ref) => {
        const selfInfluence = 100 - value;

        const handleTrackPress = (e: any) => {
            if (disabled) return;

            // Calculate new value based on press position
            const rect = e.currentTarget.getBoundingClientRect?.();
            if (rect) {
                const x = e.nativeEvent?.locationX || (e.clientX - rect.left);
                const percentage = Math.round((x / rect.width) * 100);
                onChange(Math.max(0, Math.min(100, percentage)));
            }
        };

        const getDescription = () => {
            if (value === 0) return 'Your feed only';
            if (value <= 25) return `Subtle hints from ${partnerName}`;
            if (value <= 50) return `Balanced blend with ${partnerName}`;
            if (value <= 75) return `${partnerName} leading the way`;
            if (value < 100) return `Mostly ${partnerName} style`;
            return `${partnerName} feed only`;
        };

        return (
            <SliderFrame ref={ref} opacity={disabled ? 0.5 : 1} {...props}>
                <LabelRow>
                    <SideLabel>
                        <User size={16} color="$textSecondary" />
                        <LabelText>You</LabelText>
                    </SideLabel>
                    <SideLabel>
                        <LabelText>{partnerName}</LabelText>
                        <Users size={16} color="$textSecondary" />
                    </SideLabel>
                </LabelRow>

                <TrackContainer onPress={handleTrackPress}>
                    <Track>
                        <TrackFill
                            backgroundColor="$secondary"
                            width={`${selfInfluence}%`}
                        />
                        <TrackFill
                            backgroundColor="$primary"
                            width={`${value}%`}
                        />
                    </Track>

                    <Thumb
                        left={`${value}%`}
                        transform={[{ translateX: -14 }]}
                    />
                </TrackContainer>

                <XStack justifyContent="space-between">
                    <ValueText>{selfInfluence}%</ValueText>
                    <ValueText>{value}%</ValueText>
                </XStack>

                <DescriptionText>{getDescription()}</DescriptionText>
            </SliderFrame>
        );
    }
);

BlendSlider.displayName = 'BlendSlider';

export default BlendSlider;
