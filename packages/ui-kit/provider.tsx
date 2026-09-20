import {
    Manrope_200ExtraLight,
    Manrope_300Light,
    Manrope_400Regular,
    Manrope_500Medium,
    Manrope_600SemiBold,
    Manrope_700Bold,
    Manrope_800ExtraBold,
    useFonts,
} from '@expo-google-fonts/manrope';
import { ReactNode } from 'react';
import { TamaguiProvider, Theme, ThemeProps } from 'tamagui';

import { ToastProvider } from './components/ToastProvider';
import { config } from './theme';

interface StyleSwipeProviderProps {
    children: ReactNode;
    theme?: ThemeProps['name'];
}

export function StyleSwipeProvider({ children, theme = 'BrandIdentityLight' }: StyleSwipeProviderProps) {
    useFonts({
        'Manrope-ExtraLight': Manrope_200ExtraLight,
        'Manrope-Light': Manrope_300Light,
        'Manrope-Regular': Manrope_400Regular,
        'Manrope-Medium': Manrope_500Medium,
        'Manrope-SemiBold': Manrope_600SemiBold,
        'Manrope-Bold': Manrope_700Bold,
        'Manrope-ExtraBold': Manrope_800ExtraBold,
    });

    return (
        <TamaguiProvider config={config} defaultTheme={theme as any}>
            <Theme name={theme as any}>
                <ToastProvider>
                    {children}
                </ToastProvider>
            </Theme>
        </TamaguiProvider>
    );
}
