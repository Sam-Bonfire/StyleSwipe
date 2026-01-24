/**
 * PriceSummary Component
 * 
 * PRD Source: Cart price breakdown and checkout summary
 * Features: Subtotal, shipping, taxes, discounts, total
 */

import React from 'react';
import { styled, GetProps, YStack, XStack, Text, Separator } from 'tamagui';

const SummaryFrame = styled(YStack, {
    name: 'PriceSummary',
    backgroundColor: '$surface',
    padding: '$3',
    borderRadius: '$3',
    gap: '$2',
    borderWidth: 1,
    borderColor: '$borderColor',
});

const SummaryRow = styled(XStack, {
    name: 'PriceSummaryRow',
    justifyContent: 'space-between',
    alignItems: 'center',
});

const LabelText = styled(Text, {
    name: 'PriceSummaryLabel',
    fontFamily: '$body',
    fontSize: '$4',
    fontWeight: '400',
    color: '$textSecondary',
});

const ValueText = styled(Text, {
    name: 'PriceSummaryValue',
    fontFamily: '$body',
    fontSize: '$4',
    fontWeight: '500',
    color: '$textPrimary',
});

const DiscountValue = styled(Text, {
    name: 'PriceSummaryDiscount',
    fontFamily: '$body',
    fontSize: '$4',
    fontWeight: '500',
    color: '$success',
});

const FreeText = styled(Text, {
    name: 'PriceSummaryFree',
    fontFamily: '$body',
    fontSize: '$4',
    fontWeight: '600',
    color: '$success',
});

const TotalLabel = styled(Text, {
    name: 'PriceSummaryTotalLabel',
    fontFamily: '$heading',
    fontSize: '$5',
    fontWeight: '600',
    color: '$textPrimary',
});

const TotalValue = styled(Text, {
    name: 'PriceSummaryTotalValue',
    fontFamily: '$heading',
    fontSize: '$6',
    fontWeight: '700',
    color: '$textPrimary',
});

const SavingsText = styled(Text, {
    name: 'PriceSummarySavings',
    fontFamily: '$body',
    fontSize: '$3',
    fontWeight: '500',
    color: '$success',
    textAlign: 'right',
});

export type PriceSummaryProps = GetProps<typeof SummaryFrame> & {
    subtotal: number;
    shipping?: number;
    freeShippingThreshold?: number;
    tax?: number;
    discount?: number;
    discountCode?: string;
    currency?: string;
    showSavings?: boolean;
};

export const PriceSummary = React.forwardRef<typeof SummaryFrame, PriceSummaryProps>(
    ({
        subtotal,
        shipping = 0,
        freeShippingThreshold,
        tax = 0,
        discount = 0,
        discountCode,
        currency = 'INR',
        showSavings = true,
        ...props
    }, ref) => {
        const formatPrice = (amount: number) => {
            return new Intl.NumberFormat('en-IN', {
                style: 'currency',
                currency,
                minimumFractionDigits: 0,
                maximumFractionDigits: 0,
            }).format(amount);
        };

        const isFreeShipping = freeShippingThreshold && subtotal >= freeShippingThreshold;
        const effectiveShipping = isFreeShipping ? 0 : shipping;
        const total = subtotal + effectiveShipping + tax - discount;
        const totalSavings = discount + (isFreeShipping ? shipping : 0);

        return (
            <SummaryFrame ref={ref} {...props}>
                {/* Subtotal */}
                <SummaryRow>
                    <LabelText>Subtotal</LabelText>
                    <ValueText>{formatPrice(subtotal)}</ValueText>
                </SummaryRow>

                {/* Shipping */}
                <SummaryRow>
                    <LabelText>Shipping</LabelText>
                    {isFreeShipping ? (
                        <FreeText>FREE</FreeText>
                    ) : shipping > 0 ? (
                        <ValueText>{formatPrice(shipping)}</ValueText>
                    ) : (
                        <ValueText>Calculated at checkout</ValueText>
                    )}
                </SummaryRow>

                {/* Tax */}
                {tax > 0 && (
                    <SummaryRow>
                        <LabelText>Tax</LabelText>
                        <ValueText>{formatPrice(tax)}</ValueText>
                    </SummaryRow>
                )}

                {/* Discount */}
                {discount > 0 && (
                    <SummaryRow>
                        <LabelText>
                            Discount {discountCode && `(${discountCode})`}
                        </LabelText>
                        <DiscountValue>-{formatPrice(discount)}</DiscountValue>
                    </SummaryRow>
                )}

                <Separator borderColor="$borderColor" marginVertical="$1" />

                {/* Total */}
                <SummaryRow>
                    <TotalLabel>Total</TotalLabel>
                    <TotalValue>{formatPrice(total)}</TotalValue>
                </SummaryRow>

                {/* Savings */}
                {showSavings && totalSavings > 0 && (
                    <SavingsText>
                        You save {formatPrice(totalSavings)} on this order!
                    </SavingsText>
                )}
            </SummaryFrame>
        );
    }
);

PriceSummary.displayName = 'PriceSummary';

export default PriceSummary;
