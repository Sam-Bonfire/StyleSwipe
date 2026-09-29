import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';
/**
 * Same Tamagui single-copy dedupe as apps/consumer-app/vitest.config.ts:
 * pnpm installs several physical copies and mixing them splits the theme
 * context. This package happens to resolve consistently today; the alias
 * keeps it that way across installs.
 */
const HOIST = resolve(dirname(fileURLToPath(import.meta.url)), '../../node_modules/.pnpm/node_modules');

export default defineConfig({
  resolve: {
    alias: [
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
