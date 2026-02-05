import { Button } from '@app/ui-kit';
import { PieChart } from '@tamagui/lucide-icons';
import React from 'react';
import { YStack, Text, Card, H3, Label, Input } from 'tamagui';

import { authAdapter } from '../lib/auth';

// Neuro-styled Login Component
export function LoginScreen() {
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState('');

  const handleLogin = async () => {
    setLoading(true);
    setError('');
    try {
      await authAdapter.signInWithEmail(email, password);
    } catch (err: unknown) {
      console.error('Login failed', err);
      const message = err instanceof Error ? err.message : 'An error occurred';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <YStack flex={1} justifyContent="center" alignItems="center" backgroundColor="$background">
      {/* Background with slight gradient or pattern could go here */}

      <YStack marginBottom="$6" alignItems="center" space="$3">
        {/* Logo Placeholder */}
        <PieChart size="$6" color="$primary" />
        <H3 color="$color" fontSize="$8">
          StyleSwipe Admin
        </H3>
      </YStack>

      <Card
        bordered
        // Removed elevate for lighter custom shadow
        shadowColor="$shadowColor"
        shadowOffset={{ width: 0, height: 4 }}
        shadowOpacity={0.1}
        shadowRadius={10}
        size="$4"
        width={400}
        padding="$6"
        backgroundColor="$surface" // Surface color from light theme
        borderColor="$borderColor"
      >
        <YStack space="$4">
          <Text textAlign="center" color="$color">
            Sign in to the Neural Command Center
          </Text>

          <YStack space="$3">
            <YStack space="$2">
              <Label htmlFor="email" color="$color">
                Email Address
              </Label>
              <Input
                id="email"
                value={email}
                onChangeText={setEmail}
                placeholder="admin@styleswipe.com"
                autoCapitalize="none"
              />
            </YStack>

            <YStack space="$2">
              <Label htmlFor="password" color="$color">
                Password
              </Label>
              <Input
                id="password"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                placeholder="••••••••"
              />
            </YStack>

            {error ? (
              <Text color="red" fontSize="$3" textAlign="center">
                {error}
              </Text>
            ) : null}

            <Button onPress={handleLogin} disabled={loading} variant="primary" marginTop="$4">
              {loading ? 'Authenticating...' : 'Access Dashboard'}
            </Button>
          </YStack>
        </YStack>
      </Card>

      <Text marginTop="$6" color="$color" fontSize="$2">
        Secure Connection • 256-bit Encryption
      </Text>
    </YStack>
  );
}
