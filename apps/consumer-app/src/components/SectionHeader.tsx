import { Button } from '@app/ui-kit';
import React from 'react';
import { XStack, H3 } from 'tamagui';

interface SectionHeaderProps {
  title: string;
  onSeeAll?: () => void;
}

export const SectionHeader = ({ title, onSeeAll }: SectionHeaderProps) => {
  return (
    <XStack
      alignItems="center"
      justifyContent="space-between"
      paddingHorizontal="$4"
      marginBottom="$2"
    >
      <H3 fontSize="$6" fontWeight="700">
        {title}
      </H3>
      {onSeeAll && (
        <Button variant="ghost" size="small" onPress={onSeeAll} color="$primary" fontWeight="600">
          See All
        </Button>
      )}
    </XStack>
  );
};
