import { Search, X } from '@tamagui/lucide-icons';
import React from 'react';
import { XStack, Input } from 'tamagui';

export interface SearchBarProps {
    value: string;
    onChangeText: (text: string) => void;
    placeholder?: string;
}

export const SearchBar: React.FC<SearchBarProps> = ({
    value,
    onChangeText,
    placeholder = 'Search...',
}) => {
    const handleClear = (e?: any) => {
        e?.preventDefault?.();
        e?.stopPropagation?.();
        onChangeText('');
    };

    return (
        <XStack
            backgroundColor="$surface"
            borderRadius="$3"
            borderWidth={1}
            borderColor="$borderColor"
            paddingHorizontal="$3"
            paddingVertical="$2"
            alignItems="center"
            gap="$2"
            maxWidth={500}
            hoverStyle={{
                borderColor: '$borderColorHover',
            }}
        >
            <Search size={20} color="$color" opacity={0.5} />
            <Input
                value={value}
                onChangeText={onChangeText}
                placeholder={placeholder}
                placeholderTextColor="$color"
                flex={1}
                borderWidth={0}
                backgroundColor="transparent"
                fontSize="$4"
                color="$color"
                paddingVertical={0}
                height="auto"
                // Prevent Enter key from submitting forms
                returnKeyType="search"
                blurOnSubmit={false}
                focusStyle={{
                    outlineWidth: 0,
                    borderWidth: 0,
                }}
            />
            {value ? (
                <XStack
                    width={24}
                    height={24}
                    borderRadius="$full"
                    alignItems="center"
                    justifyContent="center"
                    cursor="pointer"
                    onPress={handleClear}
                    hoverStyle={{
                        backgroundColor: '$backgroundHover',
                    }}
                    pressStyle={{
                        backgroundColor: '$backgroundPress',
                    }}
                >
                    <X size={16} color="$color" opacity={0.7} />
                </XStack>
            ) : null}
        </XStack>
    );
};

