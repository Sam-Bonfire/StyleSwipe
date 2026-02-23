import { useCurrentUser, useUpdateUser } from '@app/infrastructure';
import { Button, useToast, TopBarIconButton } from '@app/ui-kit';
import { useNavigation } from '@react-navigation/native';
import { ChevronLeft } from '@tamagui/lucide-icons';
import React, { useState, useEffect } from 'react';
import { SafeAreaView } from 'react-native';
import { YStack, Text, Input, XStack, Spinner } from 'tamagui';

export function EditProfileScreen() {
    const navigation = useNavigation();
    const { showToast } = useToast();
    const user = useCurrentUser();
    const updateUser = useUpdateUser();

    const [name, setName] = useState('');
    const [phoneNumber, setPhoneNumber] = useState('');
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        if (user) {
            setName(user.name || '');
            setPhoneNumber(user.phoneNumber || '');
        }
    }, [user]);

    const handleSave = async () => {
        if (!user) return;
        setIsSaving(true);
        try {
            await updateUser({
                id: user._id,
                name,
                phoneNumber,
            });
            showToast({ title: 'Profile Updated', message: 'Your profile has been updated successfully.', variant: 'success' });
            navigation.goBack();
        } catch (error) {
            console.error(error);
            showToast({ title: 'Error', message: 'Failed to update profile.', variant: 'error' });
        } finally {
            setIsSaving(false);
        }
    };

    if (!user) {
        return (
            <SafeAreaView style={{ flex: 1, backgroundColor: 'white', justifyContent: 'center', alignItems: 'center' }}>
                <Spinner size="large" color="$primary" />
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: 'white' }}>
            <XStack alignItems="center" space="$2" padding="$2" borderBottomWidth={1} borderColor="$borderColor">
                <TopBarIconButton
                    onPress={() => navigation.goBack()}
                    backgroundColor="$background"
                    shadowColor="$shadowColor"
                    shadowRadius={4}
                    shadowOpacity={0.1}
                >
                    <ChevronLeft size={24} color="$textPrimary" />
                </TopBarIconButton>
                <Text fontSize="$5" fontWeight="bold">Edit Profile</Text>
            </XStack>
            <YStack flex={1} padding="$4" space="$4">

                <YStack space="$2">
                    <Text fontSize="$3" fontWeight="600">Name</Text>
                    <Input value={name} onChangeText={setName} placeholder="Enter your name" />
                </YStack>

                <YStack space="$2">
                    <Text fontSize="$3" fontWeight="600">Phone Number</Text>
                    <Input value={phoneNumber} onChangeText={setPhoneNumber} placeholder="Enter your phone number" keyboardType="phone-pad" />
                </YStack>

                <YStack space="$2">
                    <Text fontSize="$3" fontWeight="600" opacity={0.5}>Email (Cannot be changed)</Text>
                    <Input value={user.email} editable={false} opacity={0.5} />
                </YStack>

                <YStack space="$3" marginTop="$6">
                    <Button onPress={handleSave} disabled={isSaving}>
                        {isSaving ? <Spinner color="white" /> : 'Save Changes'}
                    </Button>
                    <Button variant="ghost" onPress={() => navigation.goBack()} disabled={isSaving}>
                        Discard Changes
                    </Button>
                </YStack>
            </YStack>
        </SafeAreaView>
    );
}
