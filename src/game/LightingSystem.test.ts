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
  describe('animacao do farol', () => {
    it('comeca apagado', () => {
      expect(ls.getHeadlightIntensity()).toBe(0)
    })

    it('acende progressivamente em vez de aparecer pronto', () => {
      ls.updateHeadlight(1 / 60, true)
      const firstFrame = ls.getHeadlightIntensity()

      expect(firstFrame).toBeGreaterThan(0)
      expect(firstFrame).toBeLessThan(1)

      for (let i = 0; i < 120; i++) ls.updateHeadlight(1 / 60, true)
      expect(ls.getHeadlightIntensity()).toBeCloseTo(1, 2)
    })

    it('apaga com fade, nao de um frame para o outro', () => {
      for (let i = 0; i < 120; i++) ls.updateHeadlight(1 / 60, true)

      ls.updateHeadlight(1 / 60, false)
      const justAfter = ls.getHeadlightIntensity()
      expect(justAfter).toBeGreaterThan(0)
      expect(justAfter).toBeLessThan(1)

      for (let i = 0; i < 120; i++) ls.updateHeadlight(1 / 60, false)
      expect(ls.getHeadlightIntensity()).toBe(0)
    })

    it('sem reducedMotion o warm-up pisca (nao e monotonico)', () => {
      const samples: number[] = []
      for (let i = 0; i < 40; i++) {
        ls.updateHeadlight(1 / 60, true)
        samples.push(ls.getHeadlightIntensity())
      }
      const dipped = samples.some((v, i) => i > 0 && v < samples[i - 1])
      expect(dipped).toBe(true)
    })

    it('com reducedMotion sobe suave, sem piscar', () => {
      const samples: number[] = []
      for (let i = 0; i < 40; i++) {
        ls.updateHeadlight(1 / 60, true, true)
        samples.push(ls.getHeadlightIntensity())
      }
      const dipped = samples.some((v, i) => i > 0 && v < samples[i - 1])
      expect(dipped).toBe(false)
    })

    it('nao da salto ao inverter no meio da transicao', () => {
      for (let i = 0; i < 20; i++) ls.updateHeadlight(1 / 60, true, true)
      const beforeSwitch = ls.getHeadlightIntensity()

      ls.updateHeadlight(1 / 60, false, true)

      // O fade parte da intensidade atual — nada de voltar para 1 antes de cair.
      expect(ls.getHeadlightIntensity()).toBeLessThanOrEqual(beforeSwitch)
    })

    it('resetHeadlight e reset zeram a animacao', () => {
      for (let i = 0; i < 60; i++) ls.updateHeadlight(1 / 60, true)
      ls.resetHeadlight()
      expect(ls.getHeadlightIntensity()).toBe(0)

      for (let i = 0; i < 60; i++) ls.update(1 / 60, true)
      ls.reset()
      expect(ls.getHeadlightIntensity()).toBe(0)
    })

    it('ignora dt invalido', () => {
      for (let i = 0; i < 60; i++) ls.updateHeadlight(1 / 60, true, true)
      const stable = ls.getHeadlightIntensity()

      ls.updateHeadlight(Number.NaN, true, true)
      ls.updateHeadlight(-1, true, true)

      expect(ls.getHeadlightIntensity()).toBe(stable)
    })
  })
})
