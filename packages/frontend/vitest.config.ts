import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    root: resolve(__dirname),
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov'],
      thresholds: { statements: 60, branches: 60, functions: 60, lines: 60 },
      exclude: [
        'src/main.tsx',
        'src/vite-env.d.ts',
        '*.config.*',
        'src/test/**',
        'src/components/terminal/**',
      ],
    },
  },
});
