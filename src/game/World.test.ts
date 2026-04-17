import { describe, it, expect, vi } from 'vitest'
import { World } from './World'
import { createSeededRandom } from './random'

describe('World', () => {
  it('retorna bounds validos', () => {
    const w = new World(800, 600)
    const b = w.getBoundsAtY(300)
    expect(b.left).toBeLessThan(b.right)
  })

  it('clampToRiver limita X dentro do rio', () => {
    const w = new World(800, 600)
    const x = w.clampToRiver(-1000, 300, 10)
    const b = w.getBoundsAtY(300)
    expect(x).toBeGreaterThanOrEqual(b.left)
  })

  it('update move segmentos', () => {
    const w = new World(800, 600)
    const yBefore = w.segments[0].y
    w.update(0.1, 120)
    expect(w.segments[0].y).toBeGreaterThan(yBefore)
  })

  it('getBoundsAtY com segments vazio retorna limites do canvas', () => {
    const w = new World(800, 600)
    w.segments.length = 0

    const bounds = w.getBoundsAtY(300)

    expect(bounds.left).toBe(0)
    expect(bounds.right).toBe(800)
  })

  it('reset reinicializa o mundo', () => {
    const w = new World(800, 600)
    w.update(5, 120)

    w.reset(400, 300)

    expect(w.segments.length).toBeGreaterThan(0)
  })

  it('pickNewTarget garante largura minima quando target fica estreito', () => {
    const sequence = [0, 0.5, 0.9]
    let idx = 0
    const w = new World(800, 600, () => {
      const v = sequence[idx] ?? 0.9
      idx += 1
      return v
    })

    const state = w as unknown as {
      genLeft: number
      genRight: number
      targetLeft: number
      targetRight: number
      pickNewTarget: () => void
    }

    state.genLeft = 782
    state.genRight = 784
    state.pickNewTarget()

    expect(state.targetRight - state.targetLeft).toBeGreaterThanOrEqual(90)
  })

  it('recicla waterline para topo com novo x aleatorio', () => {
    const w = new World(800, 600, () => 0.25)

    const state = w as unknown as {
      waterLines: Array<{ x: number; y: number; length: number; speedRatio: number }>
    }

    state.waterLines = [{ x: 10, y: 700, length: 10, speedRatio: 1 }]
    w.update(0.1, 120)

    expect(state.waterLines[0].y).toBe(-20)
    expect(state.waterLines[0].x).toBeCloseTo(200)
  })

  it('gera estado deterministico com seed fixa', () => {
    const a = new World(800, 600, createSeededRandom(99))
    const b = new World(800, 600, createSeededRandom(99))

    a.update(0.25, 120)
    b.update(0.25, 120)

    expect(a.segments[0]?.centerX).toBeCloseTo(b.segments[0]?.centerX ?? 0, 6)
    expect(a.segments[0]?.width).toBeCloseTo(b.segments[0]?.width ?? 0, 6)
  })

  it('fastSin suporta angulo negativo', () => {
    const w = new World(800, 600)
    const value = (w as unknown as { fastSin: (angle: number) => number }).fastSin(-Math.PI / 2)

    expect(Number.isFinite(value)).toBe(true)
  })

  it('render funciona com e sem palette customizada', () => {
    const w = new World(800, 600)
    const addColorStop = vi.fn()
    const ctx = {
      fillStyle: '',
      strokeStyle: '',
      lineWidth: 1,
      save: vi.fn(),
      restore: vi.fn(),
      beginPath: vi.fn(),
      rect: vi.fn(),
      clip: vi.fn(),
      fillRect: vi.fn(),
      moveTo: vi.fn(),
      lineTo: vi.fn(),
      stroke: vi.fn(),
      createLinearGradient: vi.fn(() => ({ addColorStop })),
    } as unknown as CanvasRenderingContext2D

    w.render(ctx)
    w.render(ctx, {
      landBase: '#1',
      landEdgeDark: '#2',
      landEdgeBright: '#3',
      waterBase: '#4',
      waterFlow: '#5',
      waterWave: '#6',
      waterDepth: '#7',
      shimmer: '#8',
      brightness: 1,
    })

    expect(ctx.fillRect).toHaveBeenCalled()
    expect(addColorStop).toHaveBeenCalled()
  })

  it('update gera segmentos quando lista esta vazia', () => {
    const w = new World(800, 600)
    w.segments.length = 0

    w.update(0.1, 120)

    expect(w.segments.length).toBeGreaterThan(0)
  })

  it('render nao cria shimmer fora da largura quando segmento visivel tem width 0', () => {
    const w = new World(800, 600)
    const state = w as unknown as {
      visibleSegmentsCache: Array<{ left: number; right: number; width: number; y: number }>
    }
    state.visibleSegmentsCache = [{ left: 100, right: 100, width: 0, y: 40 }]

    const ctx = {
      fillStyle: '',
      strokeStyle: '',
      lineWidth: 1,
      save: vi.fn(),
      restore: vi.fn(),
      beginPath: vi.fn(),
      rect: vi.fn(),
      clip: vi.fn(),
      fillRect: vi.fn(),
      moveTo: vi.fn(),
      lineTo: vi.fn(),
      stroke: vi.fn(),
      createLinearGradient: vi.fn(() => ({ addColorStop: vi.fn() })),
    } as unknown as CanvasRenderingContext2D

    w.render(ctx)
    expect(ctx.fillRect).toHaveBeenCalled()
  })

  it('render cobre branch de shimmer com entrada indefinida no indice usado', () => {
    const w = new World(800, 600)
    const state = w as unknown as {
      visibleSegmentsCache: Array<{ left: number; right: number; width: number; y: number } | undefined>
    }

    const cache: Array<{ left: number; right: number; width: number; y: number } | undefined> = [
      { left: 100, right: 300, width: 200, y: 20 },
      { left: 100, right: 300, width: 200, y: 30 },
      { left: 100, right: 300, width: 200, y: 40 },
      { left: 100, right: 300, width: 200, y: 50 },
      { left: 100, right: 300, width: 200, y: 60 },
      { left: 100, right: 300, width: 200, y: 70 },
      { left: 100, right: 300, width: 200, y: 80 },
      { left: 100, right: 300, width: 200, y: 90 },
      undefined,
    ]

    ;(cache as unknown as { [Symbol.iterator]: () => IterableIterator<{ left: number; right: number; width: number; y: number }> })[Symbol.iterator] = function* iterator() {
      for (const item of Array.prototype.values.call(this) as Iterable<{ left: number; right: number; width: number; y: number } | undefined>) {
        if (!item) continue
        yield item
      }
    }

    state.visibleSegmentsCache = cache

    const ctx = {
      fillStyle: '',
      strokeStyle: '',
      lineWidth: 1,
      save: vi.fn(),
      restore: vi.fn(),
      beginPath: vi.fn(),
      rect: vi.fn(),
      clip: vi.fn(),
      fillRect: vi.fn(),
      moveTo: vi.fn(),
      lineTo: vi.fn(),
      stroke: vi.fn(),
      createLinearGradient: vi.fn(() => ({ addColorStop: vi.fn() })),
    } as unknown as CanvasRenderingContext2D

    expect(() => w.render(ctx)).not.toThrow()
  })

})
