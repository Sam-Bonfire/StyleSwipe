/**
 * CouponInput Component
 * 
 * PRD Source: Cart coupon/promo code application
 * Features: Input field, apply button, validation feedback
 */

import { Tag, Check, X, Loader } from '@tamagui/lucide-icons';
import React, { useState } from 'react';
import { styled, GetProps, XStack, YStack, Text, Input } from 'tamagui';

const InputFrame = styled(YStack, {
    name: 'CouponInput',
    gap: '$1.5',
});

const InputRow = styled(XStack, {
    name: 'CouponInputRow',
    gap: '$2',
    alignItems: 'center',
});

const StyledInput = styled(Input, {
    name: 'CouponInputField',
    flex: 1,
    height: 44,
    paddingHorizontal: '$2',
    paddingLeft: '$5',
    borderRadius: '$2',
    borderWidth: 1,
    borderColor: '$borderColor',
    backgroundColor: '$surface',
    fontFamily: '$body',
    fontSize: '$4',
    color: '$textPrimary',
    textTransform: 'uppercase',

    focusStyle: {
        borderColor: '$primary',
    },

    variants: {
        status: {
            idle: {},
            valid: {
                borderColor: '$success',
                backgroundColor: '$successLight',
            },
            invalid: {
                borderColor: '$error',
            },
        },
    } as const,
});

const IconContainer = styled(XStack, {
    name: 'CouponInputIcon',
    position: 'absolute',
    left: '$2',
    height: '100%',
    alignItems: 'center',
    pointerEvents: 'none',
});

const ApplyButton = styled(XStack, {
    name: 'CouponApplyButton',
    height: 44,
    paddingHorizontal: '$3',
    borderRadius: '$2',
    backgroundColor: '$primary',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',

    hoverStyle: {
        backgroundColor: '$primaryDark',
    },

    pressStyle: {
        scale: 0.98,
    },

    variants: {
        disabled: {
            true: {
                backgroundColor: '$neutral300',
                cursor: 'not-allowed',
                pointerEvents: 'none',
            },
        },
    } as const,
});

const ApplyButtonText = styled(Text, {
    name: 'CouponApplyButtonText',
    fontFamily: '$body',
    fontSize: '$4',
    fontWeight: '600',
    color: '$textInverse',
});

const FeedbackText = styled(Text, {
    name: 'CouponFeedbackText',
    fontFamily: '$body',
    fontSize: '$3',
    fontWeight: '400',

    variants: {
        status: {
            valid: { color: '$success' },
            invalid: { color: '$error' },
            idle: { color: '$textSecondary' },
        },
    } as const,
});

const AppliedCoupon = styled(XStack, {
    name: 'CouponApplied',
    padding: '$2',
    borderRadius: '$2',
    backgroundColor: '$successLight',
    alignItems: 'center',
    justifyContent: 'space-between',
});

const AppliedText = styled(Text, {
    name: 'CouponAppliedText',
    fontFamily: '$body',
    fontSize: '$4',
    fontWeight: '600',
    color: '$success',
});

const RemoveButton = styled(XStack, {
    name: 'CouponRemoveButton',
    padding: '$1',
    borderRadius: '$full',
    cursor: 'pointer',

    hoverStyle: {
        backgroundColor: 'rgba(0,0,0,0.1)',
    },
});

export type CouponStatus = 'idle' | 'loading' | 'valid' | 'invalid';

export type CouponInputProps = Omit<GetProps<typeof InputFrame>, 'onApply' | 'onRemove' | 'appliedCode' | 'discountAmount' | 'placeholder' | 'currency' | 'validMessage' | 'invalidMessage'> & {
    onApply: (code: string) => Promise<boolean>;
    onRemove?: () => void;
    appliedCode?: string;
    discountAmount?: number;
    placeholder?: string;
    currency?: string;
    validMessage?: string;
    invalidMessage?: string;
};

export const CouponInput = React.forwardRef<typeof InputFrame, CouponInputProps>(
    (props: CouponInputProps, ref) => {
        const {
            onApply,
            onRemove,
            appliedCode,
            discountAmount,
            placeholder = 'Enter coupon code',
            currency = 'INR',
            validMessage,
            invalidMessage = 'Invalid or expired coupon code',
            ...rest
        } = props as any;
        const [code, setCode] = useState('');
        const [status, setStatus] = useState<CouponStatus>('idle');
        const [feedback, setFeedback] = useState('');

        const formatPrice = (amount: number) => {
            return new Intl.NumberFormat('en-IN', {
                style: 'currency',
                currency: currency as string,
                minimumFractionDigits: 0,
                maximumFractionDigits: 0,
            }).format(amount);
        };

        const handleApply = async () => {
            if (!code.trim()) return;

            setStatus('loading');
            setFeedback('');

            try {
                const isValid = await (onApply as any)(code.trim().toUpperCase());

                if (isValid) {
                    setStatus('valid');
                    setFeedback(validMessage || `Coupon applied! You save ${discountAmount ? formatPrice(discountAmount as number) : ''}`);
                    setCode('');
                } else {
                    setStatus('invalid');
                    setFeedback(invalidMessage as string);
                }
            } catch {
                setStatus('invalid');
                setFeedback('Something went wrong. Please try again.');
            }
        };

        const handleRemove = () => {
            setStatus('idle');
            setFeedback('');
            if (onRemove) {
                onRemove();
            }
        };

        // If coupon is already applied
        if (appliedCode) {
            return (
                <InputFrame ref={ref as any} {...rest}>
                    {
                        (
                            <AppliedCoupon>
                                <XStack alignItems="center" gap="$1.5">
                                    <Check size={18} color="$success" />
                                    <AppliedText>{appliedCode}</AppliedText>
                                    {discountAmount && (
                                        <Text fontSize="$3" color="$textSecondary">
                                            (-{formatPrice(discountAmount as number)})
                                        </Text>
                                    )}
                                </XStack>

                                <RemoveButton onPress={handleRemove}>
                                    <X size={18} color="$textSecondary" />
                                </RemoveButton>
                            </AppliedCoupon>
                        ) as any
                    }
                </InputFrame>
            );
        }

        return (
            <InputFrame ref={ref as any} {...rest}>
                {
                    (
                        <>
                            <InputRow>
                                <XStack flex={1} position="relative">
                                    <IconContainer>
                                        <Tag size={18} color="$textSecondary" />
                                    </IconContainer>

                                    <StyledInput
                                        value={code}
                                        onChangeText={(text) => {
                                            setCode(text);
                                            if (status !== 'idle') setStatus('idle');
                                            if (feedback) setFeedback('');
                                        }}
                                        placeholder={placeholder as string}
                                        placeholderTextColor="$textTertiary"
                                        status={(status === 'loading' ? 'idle' : status) as any}
                                        autoCapitalize="characters"
                                    />
                                </XStack>

                                <ApplyButton
                                    onPress={handleApply}
                                    disabled={!code.trim() || status === 'loading'}
                                >
                                    {status === 'loading' ? (
                                        <Loader size={18} color="$textInverse" />
                                    ) : (
                                        <ApplyButtonText>Apply</ApplyButtonText>
                                    )}
                                </ApplyButton>
                            </InputRow>

                            {feedback && (
                                <FeedbackText status={(status === 'loading' ? 'idle' : status) as any}>
                                    {feedback}
                                </FeedbackText>
                            )}
                        </>
                    ) as any
                }
            </InputFrame>
        );
    }
);

CouponInput.displayName = 'CouponInput';

export default CouponInput;
