import path from 'path';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: {
    alias: {
      '@app/core': path.resolve(__dirname, './src'),
    },
  },
  test: {
    alias: {
      '@app/core': path.resolve(__dirname, './src'),
    },
  },
});
