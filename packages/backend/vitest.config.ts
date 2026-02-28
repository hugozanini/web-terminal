import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov'],
      thresholds: { statements: 80, branches: 80, functions: 80, lines: 80 },
      exclude: ['*.config.*', 'dist/**'],
    },
  },
});
