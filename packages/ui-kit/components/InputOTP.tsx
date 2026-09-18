import React from 'react';
import { YStack, XStack, Input, Text } from 'tamagui';

export type InputOTPProps = {
  length?: number;
  value: string;
  onChange: (value: string) => void;
  autoFocus?: boolean;
};

export const InputOTP: React.FC<InputOTPProps> = ({ length = 6, value, onChange, autoFocus }) => {

  const handleChange = (text: string, index: number): void => {
    const chars = value.split('');
    // Handle paste of multiple chars
    if (text.length > 1) {
      const pasted = text.slice(0, length).split('');
      const newValue = pasted.join('').slice(0, length);
      onChange(newValue);
      return;
    }
    chars[index] = text.slice(-1);
    const newValue = chars.join('').slice(0, length);
    // If deleting, clear
    if (text === '') {
      chars[index] = '';
      const cleaned = chars.join('');
      onChange(cleaned);
      return;
    }
    onChange(newValue);
  };

  const handleKeyPress = (e: { key: string }, index: number): void => {
    if (e.key === 'Backspace' && !value[index] && index > 0) {
      const chars = value.split('');
      chars[index - 1] = '';
      onChange(chars.join(''));
    }
  };

  return (
    <YStack gap="$2">
      <XStack gap="$2" justifyContent="center">
        {Array.from({ length }).map((_, i) => (
          <Input
            key={i}
            width={48}
            height={56}
            textAlign="center"
            fontSize="$6"
            fontWeight="700"
            borderWidth={1}
            borderColor={value[i] ? '$primary' : '$borderColor'}
            backgroundColor="$background"
            keyboardType="number-pad"
            maxLength={i === 0 ? length : 1}
            value={value[i] ?? ''}
            onChangeText={(t: string) => handleChange(t, i)}
            autoFocus={autoFocus && i === 0}
            onKeyPress={(e: unknown) => handleKeyPress(e as { key: string }, i)}
          />
        ))}
      </XStack>
      <Text fontSize="$2" color="$textSecondary" textAlign="center">
        Enter 6-digit code
      </Text>
    </YStack>
  );
};

export default InputOTP;
