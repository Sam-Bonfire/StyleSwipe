/**
 * FitPreferenceButtons Component
 *
 * PRD Source: Fit and silhouette preferences
 * Features: Icon-based toggle buttons grouped by category (Tops, Bottoms, Rise)
 */

import React from 'react';
import { styled, GetProps, Stack, XStack, YStack, Text } from 'tamagui';

const ContainerFrame = styled(YStack, {
  name: 'FitPreferenceButtons',
  gap: '$3',
});

const GroupContainer = styled(YStack, {
  name: 'FitPreferenceGroup',
  gap: '$1.5',
});

const GroupLabel = styled(Text, {
  name: 'FitPreferenceGroupLabel',
  fontFamily: '$heading',
  fontSize: '$4',
  fontWeight: '600',
  color: '$textPrimary',
});

const ButtonRow = styled(XStack, {
  name: 'FitPreferenceButtonRow',
  flexWrap: 'wrap',
  gap: '$1.5',
});

const PreferenceButton = styled(YStack, {
  name: 'FitPreferenceButton',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '$2',
  borderRadius: '$3',
  borderWidth: 2,
  borderStyle: 'solid',
  cursor: 'pointer',
  minWidth: 80,

  animation: 'quick' as any,

  hoverStyle: {
    scale: 1.02,
  },

  pressStyle: {
    scale: 0.98,
  },

  variants: {
    selected: {
      true: {
        backgroundColor: '$primary',
        borderColor: '$primary',
      },
      false: {
        backgroundColor: 'transparent',
        borderColor: '$borderColor',

        hoverStyle: {
          borderColor: '$primary',
          backgroundColor: '$backgroundHover',
        },
      },
    },
  } as const,

  defaultVariants: {
    selected: false,
  },
});

const IconContainer = styled(Stack, {
  name: 'FitPreferenceIconContainer',
  marginBottom: '$0.5',

  variants: {
    selected: {
      true: {
        color: '$textInverse',
      },
      false: {
        color: '$textSecondary',
      },
    },
  } as const,
});

const ButtonLabel = styled(Text, {
  name: 'FitPreferenceButtonLabel',
  fontFamily: '$body',
  fontSize: '$3',
  fontWeight: '500',
  textAlign: 'center',

  variants: {
    selected: {
      true: {
        color: '$textInverse',
      },
      false: {
        color: '$textPrimary',
      },
    },
  } as const,
});

// Fit silhouette icons as simple shapes
const SlimIcon = ({ selected }: { selected: boolean }) => (
  <Stack width={24} height={32} alignItems="center" justifyContent="center">
    <Stack
      width={8}
      height={28}
      backgroundColor={selected ? '$textInverse' : '$textSecondary'}
      borderRadius="$1"
    />
  </Stack>
);

const RegularIcon = ({ selected }: { selected: boolean }) => (
  <Stack width={24} height={32} alignItems="center" justifyContent="center">
    <Stack
      width={14}
      height={28}
      backgroundColor={selected ? '$textInverse' : '$textSecondary'}
      borderRadius="$1"
    />
  </Stack>
);

const OversizedIcon = ({ selected }: { selected: boolean }) => (
  <Stack width={24} height={32} alignItems="center" justifyContent="center">
    <Stack
      width={22}
      height={28}
      backgroundColor={selected ? '$textInverse' : '$textSecondary'}
      borderRadius="$2"
    />
  </Stack>
);

const SkinnyIcon = ({ selected }: { selected: boolean }) => (
  <Stack width={24} height={32} alignItems="center" justifyContent="center">
    <Stack
      width={6}
      height={28}
      backgroundColor={selected ? '$textInverse' : '$textSecondary'}
      borderRadius="$1"
    />
  </Stack>
);

const WideLegIcon = ({ selected }: { selected: boolean }) => (
  <Stack width={24} height={32} alignItems="center" justifyContent="center">
    <Stack
      width={20}
      height={28}
      backgroundColor={selected ? '$textInverse' : '$textSecondary'}
      borderTopLeftRadius="$1"
      borderTopRightRadius="$1"
      borderBottomLeftRadius="$3"
      borderBottomRightRadius="$3"
    />
  </Stack>
);

const FitIconMap: Record<string, React.FC<{ selected: boolean }>> = {
  slim: SlimIcon,
  regular: RegularIcon,
  oversized: OversizedIcon,
  relaxed: OversizedIcon,
  skinny: SkinnyIcon,
  straight: RegularIcon,
  tapered: SlimIcon,
  'wide-leg': WideLegIcon,
  cargo: OversizedIcon,
  mid: RegularIcon,
  high: SlimIcon,
};

export type FitOption = {
  id: string;
  label: string;
};

export type FitGroup = {
  id: string;
  label: string;
  options: FitOption[];
  multiSelect?: boolean;
};

export type FitPreferenceButtonsProps = Omit<GetProps<typeof ContainerFrame>, 'children'> & {
  groups: FitGroup[];
  selectedOptions: Record<string, string[]>; // groupId -> selected option ids
  onSelectionChange: (groupId: string, selectedIds: string[]) => void;
};

// Default fit groups matching PRD
export const DEFAULT_FIT_GROUPS: FitGroup[] = [
  {
    id: 'tops',
    label: 'Tops',
    options: [
      { id: 'slim', label: 'Slim' },
      { id: 'regular', label: 'Regular' },
      { id: 'oversized', label: 'Oversized' },
      { id: 'relaxed', label: 'Relaxed' },
    ],
    multiSelect: true,
  },
  {
    id: 'bottoms',
    label: 'Bottoms',
    options: [
      { id: 'skinny', label: 'Skinny' },
      { id: 'slim', label: 'Slim' },
      { id: 'straight', label: 'Straight' },
      { id: 'tapered', label: 'Tapered' },
      { id: 'relaxed', label: 'Relaxed' },
      { id: 'wide-leg', label: 'Wide-Leg' },
      { id: 'cargo', label: 'Cargo' },
    ],
    multiSelect: true,
  },
  {
    id: 'rise',
    label: 'Rise',
    options: [
      { id: 'mid', label: 'Mid' },
      { id: 'high', label: 'High' },
    ],
    multiSelect: true,
  },
];

export const FitPreferenceButtons = React.forwardRef<
  typeof ContainerFrame,
  FitPreferenceButtonsProps
>((props: FitPreferenceButtonsProps, ref) => {
  const { groups = DEFAULT_FIT_GROUPS, selectedOptions, onSelectionChange, ...rest } = props as any;

  const handleOptionPress = (group: FitGroup, optionId: string) => {
    const currentSelected = selectedOptions[group.id] || [];
    const isSelected = currentSelected.includes(optionId);

    let newSelected: string[];

    if (group.multiSelect) {
      if (isSelected) {
        newSelected = currentSelected.filter((id) => id !== optionId);
      } else {
        newSelected = [...currentSelected, optionId];
      }
    } else {
      newSelected = isSelected ? [] : [optionId];
    }

    onSelectionChange(group.id, newSelected);
  };

  return (
    <ContainerFrame ref={ref as any} {...rest}>
      {
        (groups as FitGroup[]).map((group) => {
          const groupSelected = selectedOptions[group.id] || [];

          return (
            <GroupContainer key={group.id}>
              <GroupLabel>{group.label}</GroupLabel>

              <ButtonRow>
                {group.options.map((option) => {
                  const isSelected = groupSelected.includes(option.id);
                  const IconComponent = FitIconMap[option.id.toLowerCase()];

                  return (
                    <PreferenceButton
                      key={option.id}
                      selected={isSelected}
                      onPress={() => handleOptionPress(group, option.id)}
                    >
                      {IconComponent && (
                        <IconContainer selected={isSelected as any}>
                          <IconComponent selected={isSelected} />
                        </IconContainer>
                      )}
                      <ButtonLabel selected={isSelected as any}>{option.label}</ButtonLabel>
                    </PreferenceButton>
                  );
                })}
              </ButtonRow>
            </GroupContainer>
          );
        }) as any
      }
    </ContainerFrame>
  );
});

FitPreferenceButtons.displayName = 'FitPreferenceButtons';

export default FitPreferenceButtons;
