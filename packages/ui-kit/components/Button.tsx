/**
 * Button Component
 * 
 * PRD Source: Checkout/Cart buttons, Filter actions
 * Variants: Primary (filled magenta), Secondary (outlined teal), Ghost
 * Sizes: Small, Medium, Large
 */

import React from 'react';
import { styled, GetProps, Stack, Spinner, Text } from 'tamagui';

const ButtonFrame = styled(Stack, {
    name: 'Button',
    tag: 'button',
    role: 'button',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '$1',
    cursor: 'pointer',
    borderWidth: 2,
    borderStyle: 'solid',

    variants: {
        variant: {
            primary: {
                backgroundColor: '$primary',
                borderColor: '$primary',
                hoverStyle: {
                    backgroundColor: '$primaryDark',
                    borderColor: '$primaryDark',
                },
                pressStyle: {
                    backgroundColor: '$primaryDark',
                    borderColor: '$primaryDark',
                    scale: 0.98,
                },
            },
            secondary: {
                backgroundColor: 'transparent',
                borderColor: '$secondary',
                hoverStyle: {
                    backgroundColor: '$secondaryLight',
                    borderColor: '$secondary',
                },
                pressStyle: {
                    backgroundColor: '$secondary',
                    scale: 0.98,
                },
            },
            ghost: {
                backgroundColor: 'transparent',
                borderColor: 'transparent',
                hoverStyle: {
                    backgroundColor: '$backgroundHover',
                },
                pressStyle: {
                    backgroundColor: '$backgroundPress',
                    scale: 0.98,
                },
            },
        },

        size: {
            small: {
                height: 36,
                paddingHorizontal: '$2',
                borderRadius: '$3',
            },
            medium: {
                height: 44,
                paddingHorizontal: '$3',
                borderRadius: '$3',
            },
            large: {
                height: 52,
                paddingHorizontal: '$4',
                borderRadius: '$4',
            },
        },

        fullWidth: {
            true: {
                width: '100%',
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
        variant: 'primary',
        size: 'medium',
    },
});

const ButtonText = styled(Text, {
    name: 'ButtonText',
    fontFamily: '$body',
    fontWeight: '600',

    variants: {
        variant: {
            primary: {
                color: '$textInverse',
            },
            secondary: {
                color: '$secondary',
            },
            ghost: {
                color: '$textPrimary',
            },
        },

        size: {
            small: {
                fontSize: '$3',
            },
            medium: {
                fontSize: '$4',
            },
            large: {
                fontSize: '$5',
            },
        },
    } as const,

    defaultVariants: {
        variant: 'primary',
        size: 'medium',
    },
});

export type ButtonProps = GetProps<typeof ButtonFrame> & {
    children: React.ReactNode;
    loading?: boolean;
    icon?: React.ReactNode;
    iconAfter?: React.ReactNode;
};

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
    ({ children, loading, icon, iconAfter, variant = 'primary', size = 'medium', disabled, ...props }, ref) => {
        const isDisabled = disabled || loading;

        return (
            <ButtonFrame
                ref={ref}
                variant={variant as any}
                size={size as any}
                disabled={isDisabled as any}
                {...props}
            >
                {loading ? (
                    <Spinner
                        size="small"
                        color={variant === 'primary' ? '$textInverse' : '$secondary'}
                    />
                ) : (
                    <>
                        {icon}
                        <ButtonText variant={variant as any} size={size as any}>
                            {children}
                        </ButtonText>
                        {iconAfter}
                    </>
                )}
            </ButtonFrame>
        );
    }
);

Button.displayName = 'Button';

export default Button;
