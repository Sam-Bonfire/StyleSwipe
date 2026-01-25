/**
 * StyleSwipe Brand Identity Theme
 * 
 * Token system extracted from design inspirations:
 * - Primary: #CD0268 (Vibrant Magenta)
 * - Secondary: #34889E (Teal)
 * - Neutral: #212739 (Dark Navy)
 * 
 * PRD Source: Modern Indian e-commerce aesthetic, Gen Z/Millennial target
 */

import { createFont } from '@tamagui/core';
import { shorthands } from '@tamagui/shorthands';
import { createTamagui, createTokens } from 'tamagui';

// -----------------------------------------------------------------------------
// Typography: Manrope Font Family
// -----------------------------------------------------------------------------

const manropeFont = createFont({
    family: 'Manrope, -apple-system, BlinkMacSystemFont, sans-serif',
    size: {
        1: 11,   // Caption Small
        2: 12,   // Caption
        3: 13,   // Label Small
        4: 14,   // Label / Body Small
        5: 16,   // Body
        6: 18,   // Body Large
        7: 20,   // Heading Small
        8: 24,   // Heading
        9: 32,   // Heading Large
        10: 40,  // Display Small
        11: 48,  // Display
        12: 64,  // Display Large
    },
    lineHeight: {
        1: 14,
        2: 16,
        3: 18,
        4: 20,
        5: 24,
        6: 26,
        7: 28,
        8: 32,
        9: 40,
        10: 48,
        11: 56,
        12: 72,
    },
    weight: {
        1: '300', // Light
        2: '400', // Regular
        3: '500', // Medium
        4: '600', // SemiBold
        5: '700', // Bold
        6: '800', // ExtraBold
    },
    letterSpacing: {
        1: 0,
        2: 0,
        3: -0.2,
        4: -0.3,
        5: -0.4,
        6: -0.5,
        7: -0.6,
        8: -0.8,
        9: -1,
        10: -1.2,
        11: -1.5,
        12: -2,
    },
    face: {
        300: { normal: 'Manrope-Light' },
        400: { normal: 'Manrope-Regular' },
        500: { normal: 'Manrope-Medium' },
        600: { normal: 'Manrope-SemiBold' },
        700: { normal: 'Manrope-Bold' },
        800: { normal: 'Manrope-ExtraBold' },
    },
});

// -----------------------------------------------------------------------------
// Token Definitions
// -----------------------------------------------------------------------------

const tokens = createTokens({
    // Color Palette
    color: {
        // Brand Colors (from design inspirations)
        primary: '#CD0268',
        primaryLight: '#E8338A',
        primaryDark: '#A10053',

        secondary: '#34889E',
        secondaryLight: '#4BA3BA',
        secondaryDark: '#276A7D',

        // Neutral Scale
        neutral50: '#F8F9FA',
        neutral100: '#F1F3F5',
        neutral200: '#E9ECEF',
        neutral300: '#DEE2E6',
        neutral400: '#CED4DA',
        neutral500: '#ADB5BD',
        neutral600: '#6C757D',
        neutral700: '#495057',
        neutral800: '#343A40',
        neutral900: '#212739',

        // Semantic Colors
        success: '#10B981',
        successLight: '#34D399',
        successDark: '#059669',

        warning: '#F59E0B',
        warningLight: '#FBBF24',
        warningDark: '#D97706',

        error: '#EF4444',
        errorLight: '#F87171',
        errorDark: '#DC2626',

        info: '#3B82F6',
        infoLight: '#60A5FA',
        infoDark: '#2563EB',

        // Surface Colors
        background: '#FFFFFF',
        backgroundSecondary: '#F8F9FA',
        surface: '#FFFFFF',
        surfaceElevated: '#FFFFFF',

        // Text Colors
        textPrimary: '#212739',
        textSecondary: '#6C757D',
        textTertiary: '#ADB5BD',
        textInverse: '#FFFFFF',
        textOnPrimary: '#FFFFFF',
        textOnSecondary: '#FFFFFF',

        // Overlay
        overlay: 'rgba(33, 39, 57, 0.5)',
        overlayLight: 'rgba(33, 39, 57, 0.3)',

        // Transparent
        transparent: 'transparent',
    },

    // Spacing (8px grid system)
    space: {
        0: 0,
        0.5: 4,
        1: 8,
        1.5: 12,
        2: 16,
        2.5: 20,
        3: 24,
        4: 32,
        5: 40,
        6: 48,
        7: 56,
        8: 64,
        9: 72,
        10: 80,
        '-0.5': -4,
        '-1': -8,
        '-1.5': -12,
        '-2': -16,
        '-3': -24,
        '-4': -32,
        true: 8,
    },

    // Size tokens
    size: {
        0: 0,
        0.5: 4,
        1: 8,
        1.5: 12,
        2: 16,
        2.5: 20,
        3: 24,
        4: 32,
        5: 40,
        6: 48,
        7: 56,
        8: 64,
        9: 72,
        10: 80,
        true: 44, // Default touchable size
    },

    // Border Radius
    radius: {
        0: 0,
        1: 4,
        2: 8,
        3: 12,
        4: 16,
        5: 20,
        6: 24,
        full: 9999,
        true: 12, // Default radius for cards
    },

    // Z-Index Scale
    zIndex: {
        0: 0,
        1: 100,
        2: 200,
        3: 300,
        4: 400,
        5: 500,
        modal: 1000,
        toast: 1100,
        tooltip: 1200,
    },
});

// -----------------------------------------------------------------------------
// Theme Definitions
// -----------------------------------------------------------------------------

const lightTheme = {
    // Background
    background: tokens.color.background,
    backgroundHover: tokens.color.neutral100,
    backgroundPress: tokens.color.neutral200,
    backgroundFocus: tokens.color.neutral100,
    backgroundStrong: tokens.color.neutral100,
    backgroundTransparent: tokens.color.transparent,

    // Color (Primary action color)
    color: tokens.color.textPrimary,
    colorHover: tokens.color.textPrimary,
    colorPress: tokens.color.textPrimary,
    colorFocus: tokens.color.textPrimary,
    colorTransparent: tokens.color.transparent,

    // Border
    borderColor: tokens.color.neutral300,
    borderColorHover: tokens.color.neutral400,
    borderColorPress: tokens.color.neutral500,
    borderColorFocus: tokens.color.primary,

    // Placeholder
    placeholderColor: tokens.color.neutral500,

    // Shadow
    shadowColor: tokens.color.neutral900,
    shadowColorHover: tokens.color.neutral900,
    shadowColorPress: tokens.color.neutral900,
    shadowColorFocus: tokens.color.neutral900,

    // Brand
    primary: tokens.color.primary,
    primaryLight: tokens.color.primaryLight,
    primaryDark: tokens.color.primaryDark,
    secondary: tokens.color.secondary,
    secondaryLight: tokens.color.secondaryLight,
    secondaryDark: tokens.color.secondaryDark,

    // Semantic
    success: tokens.color.success,
    warning: tokens.color.warning,
    error: tokens.color.error,
    info: tokens.color.info,

    // Surface
    surface: tokens.color.surface,
    surfaceElevated: tokens.color.surfaceElevated,

    // Text
    textPrimary: tokens.color.textPrimary,
    textSecondary: tokens.color.textSecondary,
    textTertiary: tokens.color.textTertiary,
    textInverse: tokens.color.textInverse,
};

const darkTheme = {
    // Background
    background: tokens.color.neutral900,
    backgroundHover: tokens.color.neutral800,
    backgroundPress: tokens.color.neutral700,
    backgroundFocus: tokens.color.neutral800,
    backgroundStrong: tokens.color.neutral800,
    backgroundTransparent: tokens.color.transparent,

    // Color
    color: tokens.color.neutral50,
    colorHover: tokens.color.neutral100,
    colorPress: tokens.color.neutral200,
    colorFocus: tokens.color.neutral50,
    colorTransparent: tokens.color.transparent,

    // Border
    borderColor: tokens.color.neutral700,
    borderColorHover: tokens.color.neutral600,
    borderColorPress: tokens.color.neutral500,
    borderColorFocus: tokens.color.primary,

    // Placeholder
    placeholderColor: tokens.color.neutral600,

    // Shadow
    shadowColor: '#000000',
    shadowColorHover: '#000000',
    shadowColorPress: '#000000',
    shadowColorFocus: '#000000',

    // Brand
    primary: tokens.color.primaryLight,
    primaryLight: tokens.color.primary,
    primaryDark: tokens.color.primaryDark,
    secondary: tokens.color.secondaryLight,
    secondaryLight: tokens.color.secondary,
    secondaryDark: tokens.color.secondaryDark,

    // Semantic
    success: tokens.color.successLight,
    warning: tokens.color.warningLight,
    error: tokens.color.errorLight,
    info: tokens.color.infoLight,

    // Surface
    surface: tokens.color.neutral800,
    surfaceElevated: tokens.color.neutral700,

    // Text
    textPrimary: tokens.color.neutral50,
    textSecondary: tokens.color.neutral400,
    textTertiary: tokens.color.neutral500,
    textInverse: tokens.color.neutral900,
};

// -----------------------------------------------------------------------------
// Tamagui Configuration
// -----------------------------------------------------------------------------

export const config = createTamagui({
    tokens,
    themes: {
        BrandIdentityLight: lightTheme,
        BrandIdentityDark: darkTheme,
        // Aliases for convenience
        light: lightTheme,
        dark: darkTheme,
    },
    shorthands,
    fonts: {
        heading: manropeFont,
        body: manropeFont,
        mono: manropeFont,
    },
    defaultFont: 'body',
    media: {
        xs: { maxWidth: 660 },
        sm: { maxWidth: 800 },
        md: { maxWidth: 1020 },
        lg: { maxWidth: 1280 },
        xl: { maxWidth: 1420 },
        xxl: { maxWidth: 1600 },
        gtXs: { minWidth: 660 + 1 },
        gtSm: { minWidth: 800 + 1 },
        gtMd: { minWidth: 1020 + 1 },
        gtLg: { minWidth: 1280 + 1 },
        short: { maxHeight: 820 },
        tall: { minHeight: 820 },
        hoverNone: { hover: 'none' },
        pointerCoarse: { pointer: 'coarse' },
    },
    settings: {
        allowedStyleValues: 'somewhat-strict-web',
        autocompleteSpecificTokens: 'except-special',
    },
});

// Export tokens for direct use in components
export { tokens };

// Type exports
export type AppConfig = typeof config;

declare module 'tamagui' {
    // eslint-disable-next-line @typescript-eslint/no-empty-object-type
    interface TamaguiCustomConfig extends AppConfig { }
}

export default config;
