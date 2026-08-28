import { describe, it, expect, vi, beforeEach } from 'vitest'
import { UI } from './UI'

describe('UI', () => {
  let ui: UI

  beforeEach(() => {
    ui = new UI()
  })

  const createMockCtx = (overrides = {}) => ({
    save: vi.fn(),
    restore: vi.fn(),
    fillRect: vi.fn(),
    fillText: vi.fn(),
    strokeRect: vi.fn(),
    beginPath: vi.fn(),
    arc: vi.fn(),
    moveTo: vi.fn(),
    lineTo: vi.fn(),
    closePath: vi.fn(),
    fill: vi.fn(),
    rect: vi.fn(),
    clip: vi.fn(),
    stroke: vi.fn(),
    canvas: { width: 800, height: 600 },
    fillStyle: '',
    font: '',
    textAlign: 'center' as const,
    textBaseline: 'middle' as const,
    lineWidth: 1,
    strokeStyle: '',
    globalAlpha: 1,
    ...overrides,
  }) as unknown as CanvasRenderingContext2D

  describe('render', () => {
    it('renderiza sem erro', () => {
      const ctx = createMockCtx({ textAlign: 'left' as const })
      expect(() => ui.render(ctx, 1000, 80, 800)).not.toThrow()
    })

    it('renderiza com muted', () => {
      const ctx = createMockCtx({ textAlign: 'right' as const })
      expect(() => ui.render(ctx, 1000, 80, 800, true)).not.toThrow()
    })

    it('renderiza com paused', () => {
      const ctx = createMockCtx()
      expect(() => ui.render(ctx, 1000, 80, 800, false, true)).not.toThrow()
    })

    it('renderiza com doubleShotTimer', () => {
      const ctx = createMockCtx({ textAlign: 'left' as const })
      expect(() => ui.render(ctx, 1000, 80, 800, false, false, undefined, 5)).not.toThrow()
    })

    it('renderiza com slowMotionTimer', () => {
      const ctx = createMockCtx({ textAlign: 'left' as const })
      expect(() => ui.render(ctx, 1000, 80, 800, false, false, undefined, 0, 3)).not.toThrow()
    })

    it('renderiza com comboData', () => {
      const ctx = createMockCtx({ textAlign: 'left' as const })
      const comboData = { multiplier: 2, timer: 0.5, maxTimer: 2 }
      expect(() => ui.render(ctx, 1000, 80, 800, false, false, undefined, 0, 0, comboData)).not.toThrow()
    })

    it('renderiza com minimap', () => {
      const ctx = createMockCtx({ textAlign: 'left' as const })
      const minimap = {
        player: { x: 400, y: 300 },
        segments: [{ y: 300, centerX: 400, width: 200 }],
        enemies: [{ x: 400, y: 300 }],
        fuelTanks: [{ x: 300, y: 300 }],
        powerUps: [{ x: 500, y: 300 }],
      }
      expect(() => ui.render(ctx, 1000, 80, 800, false, false, minimap)).not.toThrow()
    })

    it('renderiza com lives', () => {
      const ctx = createMockCtx({ textAlign: 'left' as const })
      expect(() => ui.render(ctx, 1000, 80, 800, false, false, undefined, 0, 0, undefined, undefined, 5)).not.toThrow()
    })
  })

  describe('HUD de boss e overdrive', () => {
    const bossData = { healthRatio: 0.4, phase: 3, isAlive: true }
    const overdriveData = { energyRatio: 1, isActive: false, isReady: true, remainingTimer: 0, activeRatio: 0 }

    it('usa os labels localizados de boss e overdrive', () => {
      const ctx = createMockCtx({ textAlign: 'left' as const })
      ui.setBossLabels('COURACADO MK-I', 'FASE')
      ui.setOverdriveLabels('OVERDRIVE', 'OVERDRIVE PRONTO! [X]')

      ui.render(
        ctx, 1000, 80, 800, false, false, undefined, 0, 0, undefined, undefined,
        3, 0, 0, bossData, overdriveData,
      )

      const drawn = (ctx.fillText as unknown as { mock: { calls: unknown[][] } }).mock.calls.map((c) => String(c[0]))
      expect(drawn.some((t) => t.includes('COURACADO MK-I') && t.includes('FASE 3'))).toBe(true)
      expect(drawn.some((t) => t.includes('OVERDRIVE PRONTO! [X]'))).toBe(true)
    })

    it('mantem a barra do boss fora da area do minimapa', () => {
      const ctx = createMockCtx({ textAlign: 'left' as const })
      const minimap = {
        player: { x: 400, y: 300 },
        segments: [{ y: 300, centerX: 400, width: 200 }],
        enemies: [],
        fuelTanks: [],
        powerUps: [],
      }
      const canvasWidth = 480

      ui.render(
        ctx, 1000, 80, canvasWidth, false, false, minimap, 0, 0, undefined, undefined,
        3, 0, 0, bossData, overdriveData,
      )

      // Minimapa ocupa [canvasWidth - 144, canvasWidth - 16] em x.
      const minimapLeft = canvasWidth - 128 - 16
      const bossBar = (ctx.fillRect as unknown as { mock: { calls: number[][] } }).mock.calls
        .find((c) => c[3] === 10)
      expect(bossBar).toBeDefined()
      expect((bossBar as number[])[0] + (bossBar as number[])[2]).toBeLessThanOrEqual(minimapLeft)
    })
  })

  describe('resize', () => {
    it('resize nao falha', () => {
      expect(() => ui.resize(1024)).not.toThrow()
    })
  })
})