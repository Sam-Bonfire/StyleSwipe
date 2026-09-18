import type { OnboardingQuestion } from '@app/core';

import { BudgetSlider, DEFAULT_BUDGET_BANDS, CategoryChip, GridSelection, SizeChipGroup } from '@app/ui-kit';
import React from 'react';
import { YStack, Text, H2, XStack, ScrollView } from 'tamagui';

type Props = {
  question: OnboardingQuestion;
  value: string;
  onChange: (value: string) => void;
};

export const VisualQuiz: React.FC<Props> = ({ question, value, onChange }) => {
  const type = question.type ?? 'text';

  if (type === 'visual') {
    const items = question.options.map((opt) => ({
      id: opt,
      label: opt,
      imageUrl: question.imageUrls?.[opt] ?? `https://placehold.co/400x500/CD0268/FFFFFF?text=${encodeURIComponent(opt)}`,
    }));
    const selectedIds = value ? value.split(',').filter(Boolean) : [];
    return (
      <YStack gap="$3">
        <H2 textAlign="center">{question.question}</H2>
        <Text textAlign="center" color="$textSecondary" fontSize="$3">
          Select up to 4 styles you love
        </Text>
        <ScrollView showsVerticalScrollIndicator={false}>
          <GridSelection
            items={items}
            selectedIds={selectedIds}
            onSelectionChange={(ids) => onChange(ids.join(','))}
            maxSelections={4}
            itemSize="flexible"
            columns={2}
          />
        </ScrollView>
      </YStack>
    );
  }

  if (type === 'budget') {
    const bands = DEFAULT_BUDGET_BANDS;
    const selectedBandId = (() => {
      if (!value) return null;
      const parts = value.split('-');
      const min = Number(parts[0]) || 0;
      const band = bands.find((b) => b.minValue === min);
      return band?.id ?? null;
    })();
    return (
      <YStack gap="$4">
        <H2 textAlign="center">{question.question}</H2>
        <BudgetSlider
          bands={bands}
          selectedBandId={selectedBandId}
          onBandSelect={(bandId) => {
            const band = bands.find((b) => b.id === bandId);
            if (band) {
              const val = band.maxValue === null ? `${band.minValue}+` : `${band.minValue}-${band.maxValue}`;
              onChange(val);
            }
          }}
        />
      </YStack>
    );
  }

  if (type === 'size') {
    const selectedMap: Record<string, string[]> = value ? { top_size: value.split(',') } : {};
    return (
      <YStack gap="$3">
        <H2 textAlign="center">{question.question}</H2>
        <SizeChipGroup
          fields={[
            {
              id: 'top_size',
              label: 'Top Size',
              helperText: 'Choose your top size',
              options: [
                { id: 'XS', label: 'XS' },
                { id: 'S', label: 'S' },
                { id: 'M', label: 'M' },
                { id: 'L', label: 'L' },
                { id: 'XL', label: 'XL' },
                { id: 'XXL', label: 'XXL' },
              ],
            },
            {
              id: 'bottom_waist',
              label: 'Bottom Waist',
              helperText: 'Choose your waist size',
              options: [
                { id: '28', label: '28' },
                { id: '30', label: '30' },
                { id: '32', label: '32' },
                { id: '34', label: '34' },
                { id: '36', label: '36' },
              ],
            },
            {
              id: 'shoe_size',
              label: 'Shoe Size',
              helperText: 'Choose your shoe size',
              options: [
                { id: '6', label: '6' },
                { id: '7', label: '7' },
                { id: '8', label: '8' },
                { id: '9', label: '9' },
                { id: '10', label: '10' },
              ],
            },
          ]}
          selectedSizes={selectedMap}
          onSizeChange={(_fieldId, ids) => onChange(ids.join(','))}
        />
        {/* For MVP we persist comma joined top sizes; bottom/shoe could be extended */}
      </YStack>
    );
  }

  // default text chip quiz
  return (
    <YStack gap="$4">
      <H2 textAlign="center">{question.question}</H2>
      <XStack flexWrap="wrap" justifyContent="center" gap="$3">
        {question.options.map((option) => (
          <CategoryChip
            key={option}
            label={option}
            size="large"
            selected={value === option}
            onToggle={() => onChange(option)}
          />
        ))}
      </XStack>
    </YStack>
  );
};
