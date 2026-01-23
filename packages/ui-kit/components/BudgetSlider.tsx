/**
 * BudgetSlider Component
 * 
 * PRD Source: Budget comfort per item question
 * Features: Tiered band chips or range slider, currency-formatted labels
 */

import React from 'react';
import { styled, GetProps, Stack, XStack, YStack, Text } from 'tamagui';

const SliderFrame = styled(YStack, {
    name: 'BudgetSlider',
    gap: '$2',
});

const LabelText = styled(Text, {
    name: 'BudgetSliderLabel',
    fontFamily: '$heading',
    fontSize: '$5',
    fontWeight: '600',
    color: '$textPrimary',
});

const HelperText = styled(Text, {
    name: 'BudgetSliderHelper',
    fontFamily: '$body',
    fontSize: '$3',
    fontWeight: '400',
    color: '$textSecondary',
});

const BandContainer = styled(XStack, {
    name: 'BudgetSliderBandContainer',
    flexWrap: 'wrap',
    gap: '$1.5',
});

const BandChip = styled(Stack, {
    name: 'BudgetSliderBandChip',
    paddingHorizontal: '$2',
    paddingVertical: '$1.5',
    borderRadius: '$3',
    borderWidth: 2,
    borderStyle: 'solid',
    cursor: 'pointer',

    animation: 'quick',

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

const BandChipText = styled(Text, {
    name: 'BudgetSliderBandChipText',
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

// Visual slider track
const SliderTrack = styled(Stack, {
    name: 'BudgetSliderTrack',
    height: 8,
    backgroundColor: '$neutral200',
    borderRadius: '$full',
    overflow: 'hidden',
    marginTop: '$2',
});

const SliderFill = styled(Stack, {
    name: 'BudgetSliderFill',
    height: '100%',
    backgroundColor: '$primary',
    borderRadius: '$full',
});

const SliderLabels = styled(XStack, {
    name: 'BudgetSliderLabels',
    justifyContent: 'space-between',
    marginTop: '$1',
});

const SliderLabelText = styled(Text, {
    name: 'BudgetSliderLabelText',
    fontFamily: '$body',
    fontSize: '$2',
    fontWeight: '400',
    color: '$textSecondary',
});

const SelectedRangeText = styled(Text, {
    name: 'BudgetSliderSelectedRange',
    fontFamily: '$body',
    fontSize: '$5',
    fontWeight: '700',
    color: '$primary',
    textAlign: 'center',
    marginTop: '$1',
});

export type BudgetBand = {
    id: string;
    label: string;
    minValue: number;
    maxValue: number | null; // null for "and above"
};

export type BudgetSliderProps = Omit<GetProps<typeof SliderFrame>, 'children'> & {
    label?: string;
    helperText?: string;
    bands: BudgetBand[];
    selectedBandId: string | null;
    onBandSelect: (bandId: string) => void;
    currency?: string;
    locale?: string;
    showVisualSlider?: boolean;
};

// Default budget bands matching PRD
export const DEFAULT_BUDGET_BANDS: BudgetBand[] = [
    { id: 'budget_1', label: '0 - 999', minValue: 0, maxValue: 999 },
    { id: 'budget_2', label: '1,000 - 1,999', minValue: 1000, maxValue: 1999 },
    { id: 'budget_3', label: '2,000 - 3,999', minValue: 2000, maxValue: 3999 },
    { id: 'budget_4', label: '4,000 - 7,999', minValue: 4000, maxValue: 7999 },
    { id: 'budget_5', label: '8,000+', minValue: 8000, maxValue: null },
];

export const BudgetSlider = React.forwardRef<typeof SliderFrame, BudgetSliderProps>(
    ({
        label = 'Your usual spend per item?',
        helperText,
        bands = DEFAULT_BUDGET_BANDS,
        selectedBandId,
        onBandSelect,
        currency = 'INR',
        locale = 'en-IN',
        showVisualSlider = true,
        ...props
    }, ref) => {
        const formatCurrency = (value: number) => {
            return new Intl.NumberFormat(locale, {
                style: 'currency',
                currency,
                minimumFractionDigits: 0,
                maximumFractionDigits: 0,
            }).format(value);
        };

        const selectedBand = bands.find(b => b.id === selectedBandId);
        const selectedIndex = bands.findIndex(b => b.id === selectedBandId);
        const fillPercentage = selectedIndex >= 0 ? ((selectedIndex + 1) / bands.length) * 100 : 0;

        const getSelectedRangeText = () => {
            if (!selectedBand) return 'Select your budget range';
            if (selectedBand.maxValue === null) {
                return `${formatCurrency(selectedBand.minValue)} and above`;
            }
            return `${formatCurrency(selectedBand.minValue)} - ${formatCurrency(selectedBand.maxValue)}`;
        };

        return (
            <SliderFrame ref={ref} {...props}>
                {label && <LabelText>{label}</LabelText>}
                {helperText && <HelperText>{helperText}</HelperText>}

                <BandContainer>
                    {bands.map((band) => {
                        const isSelected = band.id === selectedBandId;
                        const displayLabel = band.maxValue === null
                            ? `${formatCurrency(band.minValue)}+`
                            : `${formatCurrency(band.minValue)} - ${formatCurrency(band.maxValue)}`;

                        return (
                            <BandChip
                                key={band.id}
                                selected={isSelected}
                                onPress={() => onBandSelect(band.id)}
                            >
                                <BandChipText selected={isSelected}>
                                    {displayLabel}
                                </BandChipText>
                            </BandChip>
                        );
                    })}
                </BandContainer>

                {showVisualSlider && (
                    <>
                        <SliderTrack>
                            <SliderFill style={{ width: `${fillPercentage}%` }} />
                        </SliderTrack>

                        <SliderLabels>
                            <SliderLabelText>Budget</SliderLabelText>
                            <SliderLabelText>Premium</SliderLabelText>
                        </SliderLabels>

                        <SelectedRangeText>
                            {getSelectedRangeText()}
                        </SelectedRangeText>
                    </>
                )}
            </SliderFrame>
        );
    }
);

BudgetSlider.displayName = 'BudgetSlider';

export default BudgetSlider;
