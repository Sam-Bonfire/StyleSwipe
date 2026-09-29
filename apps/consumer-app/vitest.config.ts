import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

/**
 * Mirror of Metro's module dedupe (apps/consumer-app/metro.config.js)
 * for the test runner: pnpm installs several physical copies of Tamagui
 * and mixing them splits the theme context ("Missing theme" in tests).
 * All Tamagui imports resolve to the single set in pnpm's virtual hoist.
 */
const HOIST = resolve(dirname(fileURLToPath(import.meta.url)), '../../node_modules/.pnpm/node_modules');

export default defineConfig({
  resolve: {
    alias: [
      // See tests/stubs/lucide-icons.tsx for why the real package is out.
      { find: '@tamagui/lucide-icons', replacement: fileURLToPath(new URL('./tests/stubs/lucide-icons.tsx', import.meta.url)) },
      { find: /^tamagui$/, replacement: `${HOIST}/tamagui` },
      { find: /^@tamagui\/core$/, replacement: `${HOIST}/@tamagui/core` },
      { find: /^@tamagui\/web$/, replacement: `${HOIST}/@tamagui/web` },
    ],
  },
  test: {
    include: ['tests/**/*.test.{ts,tsx}'],
    // Tamagui injects CSS rules at render: needs a DOM.
    environment: 'happy-dom',
    setupFiles: ['./tests/setup.ts'],
  },
});
