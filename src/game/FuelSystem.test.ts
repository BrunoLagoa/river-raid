import { describe, it, expect } from 'vitest'
import { FuelSystem } from './FuelSystem'

describe('FuelSystem', () => {
  it('drena combustivel ao atualizar', () => {
    const fs = new FuelSystem(800, 600)
    const initial = fs.fuel

    fs.update(1, { getBoundsAtY: () => ({ left: 0, right: 800 }) }, [{ centerX: 400, width: 300, y: 0 }], 120)

    expect(fs.fuel).toBeLessThan(initial)
  })

  it('coleta tanque e aumenta combustivel', () => {
    const fs = new FuelSystem(800, 600)
    fs.fuel = 10
    fs.spawnAt(100, 100)

    const collected = fs.checkPickup({ x: 100, y: 100, width: 20, height: 20 })

    expect(collected).toBe(true)
    expect(fs.fuel).toBeGreaterThan(10)
  })
})
