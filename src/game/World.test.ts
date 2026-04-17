import { describe, it, expect, vi } from 'vitest'
import { World } from './World'

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
    const w = new World(800, 600)
    const randomSpy = vi.spyOn(Math, 'random')
    randomSpy.mockReturnValue(0)

    const state = w as unknown as {
      genLeft: number
      genRight: number
      targetLeft: number
      targetRight: number
      pickNewTarget: () => void
    }

    state.genLeft = 200
    state.genRight = 230
    state.pickNewTarget()

    expect(state.targetRight - state.targetLeft).toBeGreaterThanOrEqual(90)
    randomSpy.mockRestore()
  })

  it('recicla waterline para topo com novo x aleatorio', () => {
    const w = new World(800, 600)
    const randomSpy = vi.spyOn(Math, 'random')
    randomSpy.mockReturnValue(0.25)

    const state = w as unknown as {
      waterLines: Array<{ x: number; y: number; length: number; speedRatio: number }>
    }

    state.waterLines = [{ x: 10, y: 700, length: 10, speedRatio: 1 }]
    w.update(0.1, 120)

    expect(state.waterLines[0].y).toBe(-20)
    expect(state.waterLines[0].x).toBeCloseTo(200)
    randomSpy.mockRestore()
  })
})
