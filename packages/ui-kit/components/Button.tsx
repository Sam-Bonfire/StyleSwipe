import React from 'react';
import { styled, GetProps, Button as TButton, Spinner } from 'tamagui';

/**
 * Button Component
 * 
 * PRD Source: Checkout/Cart buttons, Filter actions
 * Variants: Primary (filled magenta), Secondary (outlined teal), Ghost
 * Sizes: Small, Medium, Large
 */

const StyledButton = styled(TButton, {
    name: 'Button',

    // Base styles
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',

    variants: {
        variant: {
            primary: {
                backgroundColor: '$primary',
                borderColor: '$primary',
                borderWidth: 2,
                color: '$textInverse',
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
                borderWidth: 2,
                color: '$secondary',
                hoverStyle: {
                    backgroundColor: '$secondaryLight',
                    borderColor: '$secondary',
                    color: '$textInverse',
                },
                pressStyle: {
                    backgroundColor: '$secondary',
                    scale: 0.98,
                    color: '$textInverse',
                },
            },
            ghost: {
                backgroundColor: 'transparent',
                borderColor: 'transparent',
                borderWidth: 0,
                color: '$textPrimary',
                hoverStyle: {
                    backgroundColor: '$backgroundHover',
                },
                pressStyle: {
                    backgroundColor: '$backgroundPress',
                    scale: 0.98,
                },
            },
            outlined: {
                backgroundColor: 'transparent',
                borderColor: '$borderColor',
                borderWidth: 1,
                color: '$textPrimary',
                hoverStyle: {
                    backgroundColor: '$backgroundHover',
                },
                pressStyle: {
                    backgroundColor: '$backgroundPress',
                }
            }
        },

        buttonSize: {
            small: {
                height: 36,
                paddingHorizontal: '$2',
                borderRadius: '$3',
                fontSize: '$3',
            },
            medium: {
                height: '$true',
                paddingHorizontal: '$3',
                borderRadius: '$3',
                fontSize: '$4',
            },
            large: {
                height: 52,
                paddingHorizontal: '$4',
                borderRadius: '$4',
                fontSize: '$5',
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

        circular: {
            true: {
                borderRadius: '$full',
                paddingHorizontal: 0,
            }
        }
    } as const,

    defaultVariants: {
        variant: 'primary',
        buttonSize: 'medium',
    },
});

export type ButtonProps = Omit<GetProps<typeof StyledButton>, 'buttonSize' | 'size'> & {
    loading?: boolean;
    size?: 'small' | 'medium' | 'large';
};

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
    ({ children, loading, disabled, size = 'medium', icon, iconAfter, ...props }, ref) => {
        const isDisabled = disabled || loading;

        return (
            <StyledButton
                ref={ref}
                disabled={isDisabled as any}
                buttonSize={size as any}
                icon={icon}
                iconAfter={iconAfter}
                {...props}
            >
                {loading ? (
                    <Spinner
                        size="small"
                        color={props.variant === 'secondary' || props.variant === 'ghost' ? '$secondary' : '$textInverse'}
                    />
                ) : (
                    children
                )}
            </StyledButton>
        );
    }
);

Button.displayName = 'Button';

export default Button;
