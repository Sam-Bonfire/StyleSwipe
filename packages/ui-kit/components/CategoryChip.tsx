/**
 * CategoryChip Component
 * 
 * PRD Source: Onboarding quiz chips, Shop filters
 * Variants: Selectable (toggle), Filter (with close icon)
 * States: Selected, Unselected, Disabled
 */

import React from 'react';
import { styled, GetProps, Stack, Text, XStack } from 'tamagui';
import { X } from '@tamagui/lucide-icons';

const ChipFrame = styled(XStack, {
    name: 'CategoryChip',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '$1',
    paddingHorizontal: '$2',
    paddingVertical: '$1',
    borderRadius: '$full',
    borderWidth: 1.5,
    borderStyle: 'solid',
    cursor: 'pointer',

    animation: 'quick',

    variants: {
        variant: {
            selectable: {
                backgroundColor: 'transparent',
                borderColor: '$borderColor',

                hoverStyle: {
                    backgroundColor: '$backgroundHover',
                    borderColor: '$primary',
                },

                pressStyle: {
                    scale: 0.97,
                },
            },
            filter: {
                backgroundColor: '$neutral100',
                borderColor: '$neutral200',

                hoverStyle: {
                    backgroundColor: '$neutral200',
                },

                pressStyle: {
                    scale: 0.97,
                },
            },
        },

        selected: {
            true: {
                backgroundColor: '$primary',
                borderColor: '$primary',

                hoverStyle: {
                    backgroundColor: '$primaryDark',
                    borderColor: '$primaryDark',
                },
            },
        },

        size: {
            small: {
                height: 28,
                paddingHorizontal: '$1.5',
            },
            medium: {
                height: 36,
                paddingHorizontal: '$2',
            },
            large: {
                height: 44,
                paddingHorizontal: '$2.5',
            },
        },

        disabled: {
            true: {
                opacity: 0.5,
                cursor: 'not-allowed',
                pointerEvents: 'none',
            },
        },
    } as const,

    defaultVariants: {
        variant: 'selectable',
        size: 'medium',
        selected: false,
    },
});

const ChipText = styled(Text, {
    name: 'CategoryChipText',
    fontFamily: '$body',
    fontWeight: '500',

    variants: {
        selected: {
            true: {
                color: '$textInverse',
            },
            false: {
                color: '$textPrimary',
            },
        },

        size: {
            small: {
                fontSize: '$2',
            },
            medium: {
                fontSize: '$3',
            },
            large: {
                fontSize: '$4',
            },
        },
    } as const,

    defaultVariants: {
        selected: false,
        size: 'medium',
    },
});

const CloseButton = styled(Stack, {
    name: 'CategoryChipCloseButton',
    marginLeft: '$0.5',
    padding: '$0.5',
    borderRadius: '$full',

    hoverStyle: {
        backgroundColor: 'rgba(255,255,255,0.2)',
    },

    pressStyle: {
        scale: 0.9,
    },
});

export type CategoryChipProps = GetProps<typeof ChipFrame> & {
    label: string;
    icon?: React.ReactNode;
    onRemove?: () => void;
    onToggle?: (selected: boolean) => void;
};

export const CategoryChip = React.forwardRef<typeof ChipFrame, CategoryChipProps>(
    ({
        label,
        icon,
        selected = false,
        variant = 'selectable',
        size = 'medium',
        onRemove,
        onToggle,
        onPress,
        ...props
    }, ref) => {
        const handlePress = (e: any) => {
            if (onToggle) {
                onToggle(!selected);
            }
            if (onPress) {
                onPress(e);
            }
        };

        const handleRemove = (e: any) => {
            e.stopPropagation();
            if (onRemove) {
                onRemove();
            }
        };

        const iconSize = size === 'small' ? 12 : size === 'medium' ? 14 : 16;

        return (
            <ChipFrame
                ref={ref}
                variant={variant}
                selected={selected}
                size={size}
                onPress={handlePress}
                {...props}
            >
                {icon}
                <ChipText selected={selected} size={size}>
                    {label}
                </ChipText>

                {variant === 'filter' && onRemove && (
                    <CloseButton onPress={handleRemove}>
                        <X
                            size={iconSize}
                            color={selected ? '$textInverse' : '$textSecondary'}
                        />
                    </CloseButton>
                )}
            </ChipFrame>
        );
    }
);

CategoryChip.displayName = 'CategoryChip';

export default CategoryChip;
