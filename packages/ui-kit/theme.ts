import { createTamagui } from 'tamagui';
import { createInterFont } from '@tamagui/font-inter';
import { shorthands } from '@tamagui/shorthands';
import { themes, tokens } from '@tamagui/themes';

const headingFont = createInterFont();
const bodyFont = createInterFont();

// Fallback to the requested brand color if not found in env (handled at runtime or build time env injection)
// Note: In client-side logic, ensure process.env is replaced by bundler.
const brandColor = process.env.BRAND_COLOR || '#FF3E6C';

export const config = createTamagui({
    themes,
    tokens: {
        ...tokens,
        color: {
            ...tokens.color,
            brand: brandColor,
        }
    },
    shorthands,
    fonts: {
        heading: headingFont,
        body: bodyFont,
    },
});

export type AppConfig = typeof config;

declare module 'tamagui' {
    interface TamaguiCustomConfig extends AppConfig { }
}

export default config;
