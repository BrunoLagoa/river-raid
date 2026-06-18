/// <reference types="vitest" />
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  base: '/river-raid/',
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
  build: {
    rollupOptions: {
      output: {
        // Split the rarely-changing React runtime into its own chunk so the
        // app bundle can be cached independently of framework upgrades.
        manualChunks(id: string) {
          if (id.includes('node_modules/react') || id.includes('node_modules/scheduler')) {
            return 'react-vendor'
          }
        },
      },
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    coverage: {
      reporter: ['text', 'html'],
      // Measure the whole source tree (previously only 7 files were counted,
      // which made the coverage gate misleading). Entry/boilerplate excluded.
      include: ['src/**/*.{ts,tsx}'],
      exclude: [
        'src/**/*.test.ts',
        'src/**/*.test.tsx',
        'src/game/test-helpers/**',
        'src/main.tsx',
        'src/vite-env.d.ts',
        'src/i18n.ts',
      ],
      // Baselined against actual measured coverage of the full tree, with a
      // small margin. Raise as coverage of the React components grows.
      thresholds: {
        statements: 82,
        branches: 75,
        functions: 75,
        lines: 82,
      },
    },
  },
})
