/**
 * SizeChipGroup Component
 *
 * PRD Source: Size selection in onboarding
 * Features: Multi-field chips for top size, bottom waist, shoe size
 */

import React from 'react';
import { styled, GetProps, Stack, XStack, YStack, Text } from 'tamagui';

const ContainerFrame = styled(YStack, {
  name: 'SizeChipGroup',
  gap: '$3',
});

const FieldContainer = styled(YStack, {
  name: 'SizeChipField',
  gap: '$1.5',
});

const FieldLabel = styled(Text, {
  name: 'SizeChipFieldLabel',
  fontFamily: '$heading',
  fontSize: '$4',
  fontWeight: '600',
  color: '$textPrimary',
});

const FieldHelper = styled(Text, {
  name: 'SizeChipFieldHelper',
  fontFamily: '$body',
  fontSize: '$3',
  fontWeight: '400',
  color: '$textSecondary',
});

const ChipRow = styled(XStack, {
  name: 'SizeChipRow',
  flexWrap: 'wrap',
  gap: '$1',
});

const SizeChip = styled(Stack, {
  name: 'SizeChip',
  paddingHorizontal: '$2',
  paddingVertical: '$1',
  borderRadius: '$full',
  borderWidth: 2,
  borderStyle: 'solid',
  cursor: 'pointer',
  minWidth: 48,
  alignItems: 'center',
  justifyContent: 'center',

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
    disabled: {
      true: {
        opacity: 0.4,
        cursor: 'not-allowed',
        pointerEvents: 'none',
      },
    },
  } as const,

  defaultVariants: {
    selected: false,
  },
});

const ChipText = styled(Text, {
  name: 'SizeChipText',
  fontFamily: '$body',
  fontSize: '$4',
  fontWeight: '600',

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

const RegionSelector = styled(XStack, {
  name: 'SizeChipRegionSelector',
  gap: '$1',
  marginBottom: '$1',
});

const RegionButton = styled(Stack, {
  name: 'SizeChipRegionButton',
  paddingHorizontal: '$1.5',
  paddingVertical: '$0.5',
  borderRadius: '$2',
  cursor: 'pointer',

  variants: {
    active: {
      true: {
        backgroundColor: '$secondary',
      },
      false: {
        backgroundColor: '$neutral100',

        hoverStyle: {
          backgroundColor: '$neutral200',
        },
      },
    },
  } as const,
});

const RegionButtonText = styled(Text, {
  name: 'SizeChipRegionButtonText',
  fontFamily: '$body',
  fontSize: '$2',
  fontWeight: '600',

  variants: {
    active: {
      true: {
        color: '$textInverse',
      },
      false: {
        color: '$textSecondary',
      },
    },
  } as const,
});

export type SizeOption = {
  id: string;
  label: string;
  disabled?: boolean;
};

export type SizeField = {
  id: string;
  label: string;
  helperText?: string;
  options: SizeOption[];
  multiSelect?: boolean;
  hasRegionSelector?: boolean;
  regions?: { id: string; label: string }[];
};

export type SizeChipGroupProps = Omit<GetProps<typeof ContainerFrame>, 'children'> & {
  fields: SizeField[];
  selectedSizes: Record<string, string[]>; // fieldId -> selected size ids
  selectedRegions?: Record<string, string>; // fieldId -> selected region id
  onSizeChange: (fieldId: string, selectedIds: string[]) => void;
  onRegionChange?: (fieldId: string, regionId: string) => void;
};

// Default size fields matching PRD
export const DEFAULT_SIZE_FIELDS: SizeField[] = [
  {
    id: 'top_size',
    label: 'Top Size',
    helperText: 'Select your usual top size',
    options: [
      { id: 'xs', label: 'XS' },
      { id: 's', label: 'S' },
      { id: 'm', label: 'M' },
      { id: 'l', label: 'L' },
      { id: 'xl', label: 'XL' },
      { id: 'xxl', label: 'XXL' },
    ],
    multiSelect: true,
  },
  {
    id: 'bottom_waist',
    label: 'Bottom Waist',
    helperText: 'Select your usual waist size',
    options: [
      { id: '26', label: '26' },
      { id: '28', label: '28' },
      { id: '30', label: '30' },
      { id: '32', label: '32' },
      { id: '34', label: '34' },
      { id: '36', label: '36' },
      { id: '38', label: '38' },
      { id: '40', label: '40' },
    ],
    multiSelect: true,
  },
  {
    id: 'shoe_size',
    label: 'Shoe Size',
    helperText: 'Select your shoe size',
    hasRegionSelector: true,
    regions: [
      { id: 'eu', label: 'EU' },
      { id: 'uk', label: 'UK' },
      { id: 'us', label: 'US' },
    ],
    options: [
      { id: '6', label: '6' },
      { id: '7', label: '7' },
      { id: '8', label: '8' },
      { id: '9', label: '9' },
      { id: '10', label: '10' },
      { id: '11', label: '11' },
      { id: '12', label: '12' },
    ],
    multiSelect: false,
  },
];

export const SizeChipGroup = React.forwardRef<typeof ContainerFrame, SizeChipGroupProps>(
  (props: SizeChipGroupProps, ref) => {
    const {
      fields = DEFAULT_SIZE_FIELDS,
      selectedSizes,
      selectedRegions = {},
      onSizeChange,
      onRegionChange,
      ...rest
    } = props as any;

    const handleChipPress = (field: SizeField, sizeId: string) => {
      const currentSelected = selectedSizes[field.id] || [];
      const isSelected = currentSelected.includes(sizeId);

      let newSelected: string[];

      if (field.multiSelect) {
        if (isSelected) {
          newSelected = currentSelected.filter((id) => id !== sizeId);
        } else {
          newSelected = [...currentSelected, sizeId];
        }
      } else {
        newSelected = isSelected ? [] : [sizeId];
      }

      onSizeChange(field.id, newSelected);
    };

    return (
      <ContainerFrame ref={ref as any} {...rest}>
        {
          (fields as SizeField[]).map((field) => {
            const fieldSelected = selectedSizes[field.id] || [];
            const activeRegion = selectedRegions[field.id] || field.regions?.[0]?.id;

            return (
              <FieldContainer key={field.id}>
                <FieldLabel>{field.label}</FieldLabel>
                {field.helperText && <FieldHelper>{field.helperText}</FieldHelper>}

                {field.hasRegionSelector && field.regions && onRegionChange && (
                  <RegionSelector>
                    {field.regions.map((region) => (
                      <RegionButton
                        key={region.id}
                        active={(region.id === activeRegion) as any}
                        onPress={() => onRegionChange(field.id, region.id)}
                      >
                        <RegionButtonText active={(region.id === activeRegion) as any}>
                          {region.label}
                        </RegionButtonText>
                      </RegionButton>
                    ))}
                  </RegionSelector>
                )}

                <ChipRow>
                  {field.options.map((option) => {
                    const isSelected = fieldSelected.includes(option.id);

                    return (
                      <SizeChip
                        key={option.id}
                        selected={isSelected as any}
                        disabled={option.disabled as any}
                        onPress={() => handleChipPress(field, option.id)}
                      >
                        <ChipText selected={isSelected as any}>{option.label}</ChipText>
                      </SizeChip>
                    );
                  })}
                </ChipRow>
              </FieldContainer>
            );
          }) as any
        }
      </ContainerFrame>
    );
  },
);

SizeChipGroup.displayName = 'SizeChipGroup';

export default SizeChipGroup;
