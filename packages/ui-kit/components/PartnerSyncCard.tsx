/**
 * PartnerSyncCard Component
 * 
 * PRD Source: Partner Sync feature for collaborative shopping [cite: 151]
 * Features: Invite card, duration selector, session status
 */

import React, { useState } from 'react';
import { styled, GetProps, YStack, XStack, Text, Stack, Image } from 'tamagui';
import { Users, Clock, Link2, QrCode, X } from '@tamagui/lucide-icons';
import { Button } from './Button';

const CardFrame = styled(YStack, {
    name: 'PartnerSyncCard',
    backgroundColor: '$surface',
    borderRadius: '$4',
    padding: '$3',
    gap: '$3',
    borderWidth: 1,
    borderColor: '$borderColor',
    elevation: 4,
});

const Header = styled(XStack, {
    name: 'PartnerSyncHeader',
    alignItems: 'center',
    gap: '$2',
});

const IconBadge = styled(Stack, {
    name: 'PartnerSyncIconBadge',
    width: 48,
    height: 48,
    borderRadius: '$full',
    backgroundColor: '$primaryLight',
    alignItems: 'center',
    justifyContent: 'center',
});

const TitleText = styled(Text, {
    name: 'PartnerSyncTitle',
    fontFamily: '$heading',
    fontSize: '$6',
    fontWeight: '700',
    color: '$textPrimary',
});

const SubtitleText = styled(Text, {
    name: 'PartnerSyncSubtitle',
    fontFamily: '$body',
    fontSize: '$3',
    fontWeight: '400',
    color: '$textSecondary',
});

const DurationContainer = styled(YStack, {
    name: 'PartnerSyncDuration',
    gap: '$1.5',
});

const DurationLabel = styled(Text, {
    name: 'PartnerSyncDurationLabel',
    fontFamily: '$body',
    fontSize: '$4',
    fontWeight: '500',
    color: '$textPrimary',
});

const DurationRow = styled(XStack, {
    name: 'PartnerSyncDurationRow',
    gap: '$1.5',
    flexWrap: 'wrap',
});

const DurationChip = styled(Stack, {
    name: 'PartnerSyncDurationChip',
    paddingHorizontal: '$2',
    paddingVertical: '$1',
    borderRadius: '$full',
    borderWidth: 2,
    cursor: 'pointer',

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
    name: 'PartnerSyncDurationChipText',
    fontFamily: '$body',
    fontSize: '$3',
    fontWeight: '600',

    variants: {
        selected: {
            true: { color: '$textInverse' },
            false: { color: '$textPrimary' },
        },
    } as const,
});

const ShareRow = styled(XStack, {
    name: 'PartnerSyncShareRow',
    gap: '$2',
    justifyContent: 'center',
});

const ShareButton = styled(YStack, {
    name: 'PartnerSyncShareButton',
    alignItems: 'center',
    gap: '$1',
    padding: '$2',
    borderRadius: '$2',
    cursor: 'pointer',

    hoverStyle: {
        backgroundColor: '$backgroundHover',
    },
});

const ShareIconContainer = styled(Stack, {
    name: 'PartnerSyncShareIcon',
    width: 48,
    height: 48,
    borderRadius: '$full',
    backgroundColor: '$neutral100',
    alignItems: 'center',
    justifyContent: 'center',
});

const ShareLabel = styled(Text, {
    name: 'PartnerSyncShareLabel',
    fontFamily: '$body',
    fontSize: '$2',
    fontWeight: '500',
    color: '$textSecondary',
});

// Active session card
const ActiveSession = styled(XStack, {
    name: 'PartnerSyncActiveSession',
    backgroundColor: '$primaryLight',
    borderRadius: '$3',
    padding: '$2',
    alignItems: 'center',
    gap: '$2',
});

const PartnerAvatar = styled(Image, {
    name: 'PartnerSyncAvatar',
    width: 40,
    height: 40,
    borderRadius: '$full',
    backgroundColor: '$neutral200',
});

const SessionInfo = styled(YStack, {
    name: 'PartnerSyncSessionInfo',
    flex: 1,
});

const SessionText = styled(Text, {
    name: 'PartnerSyncSessionText',
    fontFamily: '$body',
    fontSize: '$4',
    fontWeight: '600',
    color: '$primary',
});

const TimerText = styled(Text, {
    name: 'PartnerSyncTimerText',
    fontFamily: '$body',
    fontSize: '$3',
    fontWeight: '400',
    color: '$textSecondary',
});

const StopButton = styled(Stack, {
    name: 'PartnerSyncStopButton',
    padding: '$1.5',
    borderRadius: '$full',
    cursor: 'pointer',

    hoverStyle: {
        backgroundColor: 'rgba(0,0,0,0.1)',
    },
});

export type Duration = '30m' | '1h' | '2h' | '24h';

export type PartnerSyncCardProps = GetProps<typeof CardFrame> & {
    // Invite mode
    onInviteLink?: (duration: Duration) => void;
    onInviteQR?: (duration: Duration) => void;

    // Active session mode
    isActive?: boolean;
    partnerName?: string;
    partnerAvatar?: string;
    remainingTime?: string;
    onStopSharing?: () => void;
};

const DURATIONS: { value: Duration; label: string }[] = [
    { value: '30m', label: '30 min' },
    { value: '1h', label: '1 hour' },
    { value: '2h', label: '2 hours' },
    { value: '24h', label: '24 hours' },
];

export const PartnerSyncCard = React.forwardRef<typeof CardFrame, PartnerSyncCardProps>(
    ({
        onInviteLink,
        onInviteQR,
        isActive = false,
        partnerName,
        partnerAvatar,
        remainingTime,
        onStopSharing,
        ...props
    }, ref) => {
        const [selectedDuration, setSelectedDuration] = useState<Duration>('1h');

        // Active session view
        if (isActive && partnerName) {
            return (
                <CardFrame ref={ref} {...props}>
                    <Header>
                        <IconBadge>
                            <Users size={24} color="$primary" />
                        </IconBadge>
                        <YStack flex={1}>
                            <TitleText>Partner Sync Active</TitleText>
                            <SubtitleText>Your feed is now blended</SubtitleText>
                        </YStack>
                    </Header>

                    <ActiveSession>
                        <PartnerAvatar
                            source={{ uri: partnerAvatar || 'https://picsum.photos/40' }}
                        />
                        <SessionInfo>
                            <SessionText>Synced with {partnerName}</SessionText>
                            <TimerText>
                                <Clock size={12} color="$textSecondary" /> Expires in {remainingTime}
                            </TimerText>
                        </SessionInfo>
                        <StopButton onPress={onStopSharing}>
                            <X size={20} color="$error" />
                        </StopButton>
                    </ActiveSession>

                    <Button variant="secondary" onPress={onStopSharing}>
                        Stop Sharing
                    </Button>
                </CardFrame>
            );
        }

        // Invite view
        return (
            <CardFrame ref={ref} {...props}>
                <Header>
                    <IconBadge>
                        <Users size={24} color="$primary" />
                    </IconBadge>
                    <YStack flex={1}>
                        <TitleText>Partner Sync</TitleText>
                        <SubtitleText>Shop together, discover more</SubtitleText>
                    </YStack>
                </Header>

                <DurationContainer>
                    <DurationLabel>Choose session duration</DurationLabel>
                    <DurationRow>
                        {DURATIONS.map((d) => (
                            <DurationChip
                                key={d.value}
                                selected={selectedDuration === d.value}
                                onPress={() => setSelectedDuration(d.value)}
                            >
                                <DurationChipText selected={selectedDuration === d.value}>
                                    {d.label}
                                </DurationChipText>
                            </DurationChip>
                        ))}
                    </DurationRow>
                </DurationContainer>

                <ShareRow>
                    <ShareButton onPress={() => onInviteLink?.(selectedDuration)}>
                        <ShareIconContainer>
                            <Link2 size={24} color="$secondary" />
                        </ShareIconContainer>
                        <ShareLabel>Share Link</ShareLabel>
                    </ShareButton>

                    <ShareButton onPress={() => onInviteQR?.(selectedDuration)}>
                        <ShareIconContainer>
                            <QrCode size={24} color="$secondary" />
                        </ShareIconContainer>
                        <ShareLabel>Show QR</ShareLabel>
                    </ShareButton>
                </ShareRow>
            </CardFrame>
        );
    }
);

PartnerSyncCard.displayName = 'PartnerSyncCard';

export default PartnerSyncCard;
