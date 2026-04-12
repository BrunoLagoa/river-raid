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
  test: {
    environment: 'jsdom',
    globals: true,
    coverage: {
      reporter: ['text', 'html'],
      include: [
        'src/game/CollisionSystem.ts',
        'src/game/EnemyManager.ts',
        'src/game/FuelSystem.ts',
        'src/game/Player.ts',
        'src/game/World.ts',
        'src/game/Game.ts',
      ],
      exclude: ['src/game/**/*.test.ts', 'src/game/test-helpers/**'],
      thresholds: {
        statements: 55,
        branches: 35,
        functions: 55,
        lines: 55,
      },
    },
  },
})
