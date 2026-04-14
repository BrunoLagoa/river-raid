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

  it('setCanvasHeight atualiza altura interna', () => {
    const fs = new FuelSystem(800, 600)

    fs.setCanvasHeight(900)

    expect((fs as unknown as { canvasHeight: number }).canvasHeight).toBe(900)
  })

  it('tanque que sai da tela e desativado', () => {
    const fs = new FuelSystem(800, 600)
    fs.spawnAt(400, 100)

    fs.update(100, { getBoundsAtY: () => ({ left: 0, right: 800 }) }, [{ centerX: 400, width: 300, y: 0 }], 120)

    const activeTanks = fs.tanks.filter(t => t.active)
    expect(activeTanks.length).toBe(0)
  })

  it('isOutOfFuel retorna true quando fuel <= 0', () => {
    const fs = new FuelSystem(800, 600)
    fs.fuel = 0

    expect(fs.isOutOfFuel()).toBe(true)
  })

  it('isOutOfFuel retorna false quando fuel > 0', () => {
    const fs = new FuelSystem(800, 600)
    fs.fuel = 50

    expect(fs.isOutOfFuel()).toBe(false)
  })

  it('reset reinicializa fuel e tanques', () => {
    const fs = new FuelSystem(800, 600)
    fs.fuel = 10
    fs.spawnAt(100, 100)

    fs.reset(800, 900)

    expect(fs.fuel).toBe(100)
    expect(fs.tanks.length).toBe(0)
  })

  it('checkPickup retorna false quando sem tanques', () => {
    const fs = new FuelSystem(800, 600)

    const result = fs.checkPickup({ x: 100, y: 100, width: 20, height: 20 })

    expect(result).toBe(false)
  })

  it('spawn com segments vazio nao cria tanque', () => {
    const fs = new FuelSystem(800, 600)
    fs.spawnTimer = -1

    fs.update(1, { getBoundsAtY: () => ({ left: 0, right: 800 }) }, [], 120)

    expect(fs.tanks.length).toBe(0)
  })
})
