import { describe, it, expect, beforeEach } from 'vitest'
import { LightingSystem } from './LightingSystem'
import {
  LIGHTING_NIGHT_ALPHA,
  LIGHTING_DAWN_ALPHA,
  LIGHTING_SUNSET_ALPHA,
} from './constants'

describe('LightingSystem', () => {
  let ls: LightingSystem
  const CANVAS_WIDTH = 480
  const CANVAS_HEIGHT = 640

  beforeEach(() => {
    ls = new LightingSystem(CANVAS_WIDTH, CANVAS_HEIGHT)
  })

  it('calculates darkness alpha based on day/night phase', () => {
    // Day (phase 0)
    expect(ls.getDarknessAlpha(0, 0.5)).toBe(0)

    // Sunset (phase 1)
    const sunset = ls.getDarknessAlpha(1, 0.5)
    expect(sunset).toBeGreaterThan(0)
    expect(sunset).toBeLessThanOrEqual(LIGHTING_SUNSET_ALPHA)

    // Night (phase 2)
    expect(ls.getDarknessAlpha(2, 0.5)).toBe(LIGHTING_NIGHT_ALPHA)

    // Dawn (phase 3)
    const dawn = ls.getDarknessAlpha(3, 0.5)
    expect(dawn).toBeGreaterThan(0)
    expect(dawn).toBeLessThanOrEqual(LIGHTING_DAWN_ALPHA)

    // Force isNight flag
    expect(ls.getDarknessAlpha(0, 0, true)).toBe(LIGHTING_NIGHT_ALPHA)
  })

  it('updates canvas dimensions on setCanvasSize', () => {
    expect(() => ls.setCanvasSize(600, 800)).not.toThrow()
  })

  it('renders darkness mask and light sources without errors', () => {
    const mockGrad = {
      addColorStop: () => {},
    }
    const mockCtx = {
      save: () => {},
      restore: () => {},
      fillRect: () => {},
      clearRect: () => {},
      beginPath: () => {},
      moveTo: () => {},
      lineTo: () => {},
      closePath: () => {},
      arc: () => {},
      stroke: () => {},
      fill: () => {},
      drawImage: () => {},
      createRadialGradient: () => mockGrad,
      fillStyle: '',
      strokeStyle: '',
      globalAlpha: 1,
      globalCompositeOperation: 'source-over',
    } as unknown as CanvasRenderingContext2D

    const player = { x: 240, y: 500, state: 'alive' }
    const bullets = [{ x: 240, y: 400, active: true }, { x: 200, y: 300, active: false }]
    const explosions = [{ x: 240, y: 200, radius: 50, active: true }, { x: 100, y: 100, active: false }]

    // Render enabled
    expect(() => ls.render(mockCtx, player, bullets, explosions, LIGHTING_NIGHT_ALPHA, true)).not.toThrow()

    // Render disabled
    expect(() => ls.render(mockCtx, player, bullets, explosions, LIGHTING_NIGHT_ALPHA, false)).not.toThrow()

    // Render in broad daylight (alpha 0)
    expect(() => ls.render(mockCtx, player, bullets, explosions, 0, true)).not.toThrow()

    // Render with dying/exploding player
    expect(() => ls.render(mockCtx, { x: 240, y: 500, state: 'exploding' }, bullets, explosions, LIGHTING_NIGHT_ALPHA, true)).not.toThrow()
  })
})
