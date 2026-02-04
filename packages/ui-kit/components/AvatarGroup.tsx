/**
 * AvatarGroup Component
 *
 * PRD Source: Share with friends feature, Partner Sync contacts
 * Features: Stacked avatars, overflow count, size variants
 */

import React from 'react';
import { styled, GetProps, XStack, Stack, Text, Image, TamaguiElement } from 'tamagui';

const GroupFrame = styled(XStack, {
  name: 'AvatarGroup',
  alignItems: 'center',
});

const AvatarWrapper = styled(Stack, {
  name: 'AvatarWrapper',
  borderWidth: 2,
  borderColor: '$surface',
  borderRadius: '$full',
  overflow: 'hidden',
  backgroundColor: '$neutral200',

  variants: {
    size: {
      small: { width: 28, height: 28 },
      medium: { width: 40, height: 40 },
      large: { width: 56, height: 56 },
    },
  } as const,

  defaultVariants: {
    size: 'medium',
  },
});

const AvatarImage = styled(Image, {
  name: 'AvatarGroupImage',
  width: '100%',
  height: '100%',
});

const OverflowBadge = styled(Stack, {
  name: 'AvatarGroupOverflow',
  borderRadius: '$full',
  borderWidth: 2,
  borderColor: '$surface',
  backgroundColor: '$neutral300',
  alignItems: 'center',
  justifyContent: 'center',

  variants: {
    size: {
      small: { width: 28, height: 28 },
      medium: { width: 40, height: 40 },
      large: { width: 56, height: 56 },
    },
  } as const,
});

const OverflowText = styled(Text, {
  name: 'AvatarGroupOverflowText',
  fontFamily: '$body',
  fontWeight: '600',
  color: '$textSecondary',

  variants: {
    size: {
      small: { fontSize: '$1' },
      medium: { fontSize: '$2' },
      large: { fontSize: '$3' },
    },
  } as const,
});

const InitialsContainer = styled(Stack, {
  name: 'AvatarGroupInitials',
  width: '100%',
  height: '100%',
  alignItems: 'center',
  justifyContent: 'center',
  backgroundColor: '$primary',
});

const InitialsText = styled(Text, {
  name: 'AvatarGroupInitialsText',
  fontFamily: '$body',
  fontWeight: '600',
  color: '$textInverse',

  variants: {
    size: {
      small: { fontSize: '$2' },
      medium: { fontSize: '$3' },
      large: { fontSize: '$5' },
    },
  } as const,
});

export type AvatarItem = {
  id: string;
  imageUrl?: string;
  name?: string;
};

export type AvatarGroupProps = GetProps<typeof GroupFrame> & {
  avatars: AvatarItem[];
  max?: number;
  size?: 'small' | 'medium' | 'large';
  overlap?: number;
  onPress?: () => void;
  onAvatarPress?: (avatar: AvatarItem) => void;
};

const getInitials = (name?: string) => {
  if (!name) return '?';
  const parts = name.trim().split(' ');
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
};

const OVERLAP_MAP = { small: -8, medium: -12, large: -16 };

export const AvatarGroup = React.forwardRef<TamaguiElement, AvatarGroupProps>(
  (props: AvatarGroupProps, ref) => {
    const {
      avatars,
      max = 4,
      size = 'medium',
      overlap,
      onPress,
      onAvatarPress,
      ...rest
    } = props as any;

    const displayAvatars = (avatars as any[]).slice(0, max);
    const overflowCount = avatars.length - max;
    const marginLeft = overlap ?? OVERLAP_MAP[size as keyof typeof OVERLAP_MAP];

    return (
      <GroupFrame
        ref={ref as any}
        onPress={onPress}
        cursor={onPress ? 'pointer' : undefined}
        {...rest}
      >
        {
          displayAvatars.map((avatar, index) => (
            <AvatarWrapper
              key={avatar.id}
              size={size as any}
              marginLeft={index === 0 ? 0 : marginLeft}
              zIndex={displayAvatars.length - index}
              onPress={() => onAvatarPress?.(avatar)}
              cursor={onAvatarPress ? 'pointer' : undefined}
            >
              {
                (avatar.imageUrl ? (
                  <AvatarImage source={{ uri: avatar.imageUrl }} />
                ) : (
                  <InitialsContainer>
                    <InitialsText size={size as any}>{getInitials(avatar.name)}</InitialsText>
                  </InitialsContainer>
                )) as any
              }
            </AvatarWrapper>
          )) as any
        }

        {overflowCount > 0 &&
          ((
            <OverflowBadge size={size as any} marginLeft={marginLeft}>
              <OverflowText size={size as any}>+{overflowCount}</OverflowText>
            </OverflowBadge>
          ) as any)}
      </GroupFrame>
    );
  },
);

AvatarGroup.displayName = 'AvatarGroup';

export default AvatarGroup;
