
import { Button } from '@app/ui-kit';
import { Activity } from '@tamagui/lucide-icons';
import React from 'react';
import { XStack, YStack, Text } from 'tamagui';

export function TopBar() {
    return (
        <XStack justifyContent="space-between" marginBottom="$6">
            <YStack>
                <Text color="$textSecondary" fontSize="$3" textTransform="uppercase" letterSpacing={1}>Admin Dashboard</Text>
                <Text color="$color" fontSize="$8" fontWeight="bold">Welcome back!</Text>
            </YStack>
            <Button icon={Activity} variant="secondary">Export Report</Button>
        </XStack>
    );
}
