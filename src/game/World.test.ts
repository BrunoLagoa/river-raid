import { describe, it, expect } from 'vitest'
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
})
