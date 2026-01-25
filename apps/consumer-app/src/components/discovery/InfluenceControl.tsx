import React from 'react';
import { YStack, Text, Slider, XStack, Avatar } from 'tamagui';

interface InfluenceControlProps {
    ratio: number;
    onRatioChange: (val: number) => void;
    partnerName?: string;
}

export function InfluenceControl({ ratio, onRatioChange, partnerName = "Partner" }: InfluenceControlProps) {
    return (
        <YStack padding="$4" backgroundColor="$background" borderRadius="$4" elevation="$2">
            <XStack justifyContent="space-between" alignItems="center" marginBottom="$2">
                <Text fontSize="$3">Me</Text>
                <Text fontSize="$3" fontWeight="bold">{Math.round(ratio * 100)}% Influence</Text>
                <Text fontSize="$3">{partnerName}</Text>
            </XStack>

            <Slider
                size="$3"
                width="100%"
                defaultValue={[0]}
                value={[ratio * 100]}
                max={100}
                step={10}
                onValueChange={(val) => onRatioChange(val[0] / 100)}
            >
                <Slider.Track>
                    <Slider.TrackActive />
                </Slider.Track>
                <Slider.Thumb index={0} circular size="$3" />
            </Slider>

            <Text fontSize="$2" color="$gray10" textAlign="center" marginTop="$2">
                Slide right to match {partnerName}'s style
            </Text>
        </YStack>
    );
}
