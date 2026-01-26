import { api } from '@convex-api';
import { useQuery } from 'convex/react';
import React from 'react';
import { SafeAreaView } from 'react-native';
import { YStack, H2, Text, Button, Avatar, XStack } from 'tamagui';

import { authAdapter } from '../../lib/auth';

export function ProfileScreen() {
    const user = useQuery(api.users.currentUser);

    const handleLogout = async () => {
        await authAdapter.signOut();
    };

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: 'white' }}>
            <YStack flex={1} padding="$4" space="$6">
                {user && (
                    <XStack alignItems="center" space="$4">
                        <Avatar circular size="$10">
                            <Avatar.Image src={user.image} />
                            <Avatar.Fallback backgroundColor="$primary" />
                        </Avatar>
                        <YStack>
                            <Text fontWeight="bold" fontSize="$5">{user.name}</Text>
                            <Text color="$textSecondary">{user.email}</Text>
                        </YStack>
                    </XStack>
                )}

                <YStack space="$4" marginTop="$4">
                    <Button variant="outlined">Payment Methods</Button>
                    <Button variant="outlined">Addresses</Button>
                    <Button variant="outlined">Order History</Button>
                    {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                    <Button backgroundColor={"$red10" as any} color="white" onPress={handleLogout}>Sign Out</Button>
                </YStack>
            </YStack>
        </SafeAreaView>
    );
}
