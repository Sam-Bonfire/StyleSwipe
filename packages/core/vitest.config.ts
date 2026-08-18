import { defineConfig } from 'vitest/config'
import path from 'path'

export default defineConfig({
  resolve: {
    alias: {
      '@app/core': path.resolve(__dirname, './src'),
      '@app/infrastructure': path.resolve(__dirname, '../infrastructure/src'),
      '@app/logger': path.resolve(__dirname, '../logger/src'),
      '@app/ui-kit': path.resolve(__dirname, '../ui-kit/src')
    }
  }
})
