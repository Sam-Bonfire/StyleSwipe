import React, { useState } from 'react';
import { YStack, Input, Text, H1, XStack } from 'tamagui';
import { Button } from '@app/ui-kit';
import { authAdapter } from '../../lib/auth';
import { useNavigation } from '@react-navigation/native';
import { Alert } from 'react-native';

type AuthMode = 'phone' | 'email';
type EmailMode = 'signin' | 'signup';

export function SignInScreen() {
    const [mode, setMode] = useState<AuthMode>('phone');
    const [emailMode, setEmailMode] = useState<EmailMode>('signin');

    // Form State
    const [phone, setPhone] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [name, setName] = useState('');

    const [loading, setLoading] = useState(false);
    const navigation = useNavigation<any>();

    const handleSignIn = async () => {
        setLoading(true);
        try {
            if (mode === 'phone') {
                await authAdapter.signInWithPhone(phone);
                navigation.navigate('OTP', { phone });
            } else {
                if (emailMode === 'signup') {
                    await authAdapter.signUpWithEmail(email, password, name);
                    Alert.alert('Success', 'Account created! Logging you in...');
                    // Auto login after signup in Better Auth usually returns session, or we can just sign in
                    await authAdapter.signInWithEmail(email, password);
                } else {
                    await authAdapter.signInWithEmail(email, password);
                }
                // Navigate to Home on success
                navigation.reset({
                    index: 0,
                    routes: [{ name: 'Home' }],
                });
            }
        } catch (e) {
            console.error(e);
            Alert.alert('Error', 'Authentication failed. Please check your details.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <YStack flex={1} justifyContent="center" padding="$4" gap="$4" backgroundColor="$background">
            <YStack gap="$2" alignItems="center">
                <H1 textAlign="center" color="$textPrimary">StyleSwipe</H1>
                <Text textAlign="center" color="$textSecondary">
                    {mode === 'phone' ? 'Enter your phone number' : (emailMode === 'signin' ? 'Sign in with Email' : 'Create Account')}
                </Text>
            </YStack>

            {/* Mode Toggle */}
            <XStack gap="$2" justifyContent="center">
                <Button
                    variant={mode === 'phone' ? 'primary' : 'ghost'}
                    size="small"
                    onPress={() => setMode('phone')}
                >
                    Phone
                </Button>
                <Button
                    variant={mode === 'email' ? 'primary' : 'ghost'}
                    size="small"
                    onPress={() => setMode('email')}
                >
                    Email
                </Button>
            </XStack>

            <YStack gap="$4">
                {mode === 'phone' ? (
                    <Input
                        size="$4"
                        borderWidth={1}
                        placeholder="+1 234 567 8900"
                        value={phone}
                        onChangeText={setPhone}
                        keyboardType="phone-pad"
                        autoCapitalize="none"
                    />
                ) : (
                    <YStack gap="$3">
                        {emailMode === 'signup' && (
                            <Input
                                size="$4"
                                borderWidth={1}
                                placeholder="Full Name"
                                value={name}
                                onChangeText={setName}
                            />
                        )}
                        <Input
                            size="$4"
                            borderWidth={1}
                            placeholder="Email Address"
                            value={email}
                            onChangeText={setEmail}
                            keyboardType="email-address"
                            autoCapitalize="none"
                        />
                        <Input
                            size="$4"
                            borderWidth={1}
                            placeholder="Password"
                            value={password}
                            onChangeText={setPassword}
                            secureTextEntry
                        />
                        <XStack justifyContent="flex-end">
                            <Button
                                variant="ghost"
                                size="small"
                                onPress={() => setEmailMode(emailMode === 'signin' ? 'signup' : 'signin')}
                            >
                                {emailMode === 'signin' ? 'Create new account' : 'Already have an account?'}
                            </Button>
                        </XStack>
                    </YStack>
                )}

                <Button
                    variant="primary"
                    size="large"
                    onPress={handleSignIn}
                    loading={loading}
                    disabled={mode === 'phone' ? !phone : !email || !password}
                >
                    {mode === 'phone' ? 'Send Code' : (emailMode === 'signin' ? 'Sign In' : 'Sign Up')}
                </Button>
            </YStack>
        </YStack>
    );
}
