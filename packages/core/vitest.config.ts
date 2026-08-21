import path from 'path';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    alias: {
      '@app/core': path.resolve(__dirname, './src'),
    },
  },
});
