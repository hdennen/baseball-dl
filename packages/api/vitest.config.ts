import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  resolve: {
    alias: {
      '@baseball-dl/dal': path.resolve(__dirname, '../dal/src/index.ts'),
      '@baseball-dl/shared': path.resolve(__dirname, '../shared/src/index.ts'),
    },
  },
  test: {
    testTimeout: 15000,
    include: ['src/__tests__/**/*.test.ts'],
  },
});
