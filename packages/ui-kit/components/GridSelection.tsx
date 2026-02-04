/**
 * GridSelection Component
 *
 * PRD Source: Style vibe check with images [cite: 28, 106]
 * Features: 2x3 or 3x3 grid of image cards, multi-select with checkmark overlay
 */

import { Check } from '@tamagui/lucide-icons';
import React from 'react';
import { styled, GetProps, Stack, Image, Text, TamaguiElement } from 'tamagui';

const GridFrame = styled(Stack, {
  name: 'GridSelection',
  flexDirection: 'row',
  flexWrap: 'wrap',
  gap: '$1.5',

  variants: {
    columns: {
      2: {
        // Handled via item width
      },
      3: {
        // Handled via item width
      },
    },
  } as const,

  defaultVariants: {
    columns: 3,
  },
});

const GridItemFrame = styled(Stack, {
  name: 'GridSelectionItem',
  position: 'relative',
  borderRadius: '$3',
  overflow: 'hidden',
  cursor: 'pointer',
  borderWidth: 3,
  borderStyle: 'solid',
  borderColor: 'transparent',

  hoverStyle: {
    scale: 1.02,
  },

  pressStyle: {
    scale: 0.98,
  },

  variants: {
    selected: {
      true: {
        borderColor: '$primary',
      },
    },

    size: {
      small: {
        width: 100,
        height: 100,
      },
      medium: {
        width: 120,
        height: 140,
      },
      large: {
        width: 150,
        height: 180,
      },
      flexible: {
        flex: 1,
        minWidth: 100,
        aspectRatio: 0.85,
      },
    },
  } as const,

  defaultVariants: {
    size: 'flexible',
  },
});

const ItemImage = styled(Image, {
  name: 'GridSelectionItemImage',
  position: 'absolute',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  width: '100%',
  height: '100%',
});

const SelectionOverlay = styled(Stack, {
  name: 'GridSelectionOverlay',
  position: 'absolute',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  backgroundColor: 'rgba(205, 2, 104, 0.3)',
  alignItems: 'center',
  justifyContent: 'center',
});

const CheckmarkCircle = styled(Stack, {
  name: 'GridSelectionCheckmark',
  width: 32,
  height: 32,
  borderRadius: '$full',
  backgroundColor: '$primary',
  alignItems: 'center',
  justifyContent: 'center',
});

const ItemLabel = styled(Stack, {
  name: 'GridSelectionItemLabel',
  position: 'absolute',
  bottom: 0,
  left: 0,
  right: 0,
  padding: '$1',
  backgroundColor: 'rgba(0,0,0,0.6)',
});

const LabelText = styled(Text, {
  name: 'GridSelectionLabelText',
  fontFamily: '$body',
  fontSize: '$2',
  fontWeight: '600',
  color: '$textInverse',
  textAlign: 'center',
});

export type GridSelectionItem = {
  id: string;
  imageUrl: string;
  label?: string;
};

export type GridSelectionProps = Omit<GetProps<typeof GridFrame>, 'children'> & {
  items: GridSelectionItem[];
  selectedIds: string[];
  onSelectionChange: (selectedIds: string[]) => void;
  maxSelections?: number;
  minSelections?: number;
  itemSize?: 'small' | 'medium' | 'large' | 'flexible';
};

export const GridSelection = React.forwardRef<TamaguiElement, GridSelectionProps>(
  (props: GridSelectionProps, ref) => {
    const {
      items,
      selectedIds,
      onSelectionChange,
      maxSelections,
      minSelections = 0,
      itemSize = 'flexible',
      columns = 3,
      ...rest
    } = props as any;

    const handleItemPress = (itemId: string) => {
      const isSelected = (selectedIds as string[]).includes(itemId);

      if (isSelected) {
        if (selectedIds.length > minSelections) {
          onSelectionChange(selectedIds.filter((id: string) => id !== itemId));
        }
      } else {
        if (!maxSelections || selectedIds.length < maxSelections) {
          onSelectionChange([...selectedIds, itemId]);
        }
      }
    };

    return (
      <GridFrame ref={ref as any} columns={columns as any} {...rest}>
        {
          (items as any[]).map((item) => {
            const isSelected = (selectedIds as string[]).includes(item.id);

            return (
              <GridItemFrame
                key={item.id}
                selected={isSelected}
                size={itemSize}
                onPress={() => handleItemPress(item.id)}
              >
                {
                  (
                    <>
                      <ItemImage
                        source={{ uri: item.imageUrl }}
                        // @ts-ignore
                        src={item.imageUrl}
                        resizeMode="cover"
                      />

                      {isSelected && (
                        <SelectionOverlay>
                          <CheckmarkCircle>
                            <Check size={20} color="$textInverse" />
                          </CheckmarkCircle>
                        </SelectionOverlay>
                      )}

                      {item.label && (
                        <ItemLabel>
                          <LabelText>{item.label}</LabelText>
                        </ItemLabel>
                      )}
                    </>
                  ) as any
                }
              </GridItemFrame>
            );
          }) as any
        }
      </GridFrame>
    );
  },
);

GridSelection.displayName = 'GridSelection';

export default GridSelection;
