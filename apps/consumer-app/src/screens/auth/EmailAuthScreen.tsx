import { Button } from '@app/ui-kit';
import { api } from '@convex-api';
import { useMutation } from 'convex/react';
import React, { useState } from 'react';
import { Alert } from 'react-native';
import { YStack, Input, Text, H2, XStack } from 'tamagui';

import { authAdapter } from '../../lib/auth';

type EmailMode = 'signin' | 'signup';

export function EmailAuthScreen() {
    const [emailMode, setEmailMode] = useState<EmailMode>('signin');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [name, setName] = useState('');
    const [loading, setLoading] = useState(false);
    const getOrCreateUser = useMutation(api.users.getOrCreateUser);

    const handleSubmit = async () => {
        setLoading(true);
        try {
            if (emailMode === 'signup') {
                await authAdapter.signUpWithEmail(email, password, name);
                Alert.alert('Success', 'Account created! Logging you in...');
                await authAdapter.signInWithEmail(email, password);
            } else {
                await authAdapter.signInWithEmail(email, password);
            }
            // Create or get the user record in our users table
            await getOrCreateUser();
            // NavigationGuard in App.tsx will handle the redirect automatically
        } catch (e) {
            console.error(e);
            Alert.alert('Error', 'Authentication failed. Please check your details.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <YStack flex={1} padding="$6" gap="$6" backgroundColor="$background">
            <YStack marginTop="$10" gap="$2">
                <H2 color="$textPrimary">{emailMode === 'signin' ? 'Sign In' : 'Create Account'}</H2>
                <Text color="$textSecondary">
                    {emailMode === 'signin' ? 'Enter your email to continue' : 'Fill in the details below'}
                </Text>
            </YStack>

            <YStack gap="$4">
                {emailMode === 'signup' && (
                    <Input
                        borderWidth={1}
                        placeholder="Full Name"
                        value={name}
                        onChangeText={setName}
                        autoFocus
                    />
                )}
                <Input
                    borderWidth={1}
                    placeholder="Email Address"
                    value={email}
                    onChangeText={setEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoFocus={emailMode === 'signin'}
                />
                <Input
                    borderWidth={1}
                    placeholder="Password"
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry
                />

                <Button
                    variant="primary"
                    size="large"
                    onPress={handleSubmit}
                    loading={loading}
                    disabled={!email || !password || (emailMode === 'signup' && !name) || loading}
                >
                    {emailMode === 'signin' ? 'Sign In' : 'Sign Up'}
                </Button>

                <XStack justifyContent="center">
                    <Button
                        variant="ghost"
                        size="small"
                        onPress={() => setEmailMode(emailMode === 'signin' ? 'signup' : 'signin')}
                    >
                        {emailMode === 'signin' ? "Don't have an account? Sign Up" : "Already have an account? Sign In"}
                    </Button>
                </XStack>
            </YStack>
        </YStack>
    );
}
