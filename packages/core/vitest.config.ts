import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    alias: {
      '@app/core': path.resolve(__dirname, './src'),
    },
  },
});
