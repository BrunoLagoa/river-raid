import { describe, it, expect, beforeEach } from 'vitest'
import { OverdriveSystem } from './OverdriveSystem'
import { OVERDRIVE_MAX, OVERDRIVE_DURATION } from './constants'

describe('OverdriveSystem', () => {
  let od: OverdriveSystem

  beforeEach(() => {
    od = new OverdriveSystem()
  })

  it('starts empty and inactive', () => {
    expect(od.currentEnergy).toBe(0)
    expect(od.isActive).toBe(false)
    expect(od.isReady).toBe(false)
    expect(od.energyRatio).toBe(0)
    expect(od.activeRatio).toBe(0)
  })

  it('accumulates energy on enemy kills and near-misses', () => {
    od.onEnemyKilled()
    expect(od.currentEnergy).toBeGreaterThan(0)

    od.onNearMiss()
    expect(od.currentEnergy).toBeGreaterThan(10)
  })

  it('reports isReady when energy reaches OVERDRIVE_MAX', () => {
    const filled = od.addEnergy(OVERDRIVE_MAX)
    expect(filled).toBe(true)
    expect(od.isReady).toBe(true)
    expect(od.energyRatio).toBe(1.0)
  })

  it('cannot activate if not ready', () => {
    od.addEnergy(50)
    expect(od.activate()).toBe(false)
    expect(od.isActive).toBe(false)
  })

  it('activates and enters active state when ready', () => {
    od.addEnergy(OVERDRIVE_MAX)
    expect(od.activate()).toBe(true)
    expect(od.isActive).toBe(true)
    expect(od.currentEnergy).toBe(0)
    expect(od.remainingTimer).toBe(OVERDRIVE_DURATION)
    expect(od.activeRatio).toBe(1.0)
  })

  it('ticks active timer and expires after duration', () => {
    od.addEnergy(OVERDRIVE_MAX)
    od.activate()

    const mid = od.update(3.0)
    expect(mid.expired).toBe(false)
    expect(od.isActive).toBe(true)
    expect(od.remainingTimer).toBeCloseTo(3.0, 1)

    const end = od.update(3.5)
    expect(end.expired).toBe(true)
    expect(od.isActive).toBe(false)
    expect(od.remainingTimer).toBe(0)
  })

  it('resets all state on reset()', () => {
    od.addEnergy(OVERDRIVE_MAX)
    od.activate()
    od.reset()
    expect(od.currentEnergy).toBe(0)
    expect(od.isActive).toBe(false)
    expect(od.isReady).toBe(false)
  })

  it('does not gain energy while active', () => {
    od.addEnergy(OVERDRIVE_MAX)
    od.activate()
    const gained = od.onEnemyKilled()
    expect(gained).toBe(false)
    expect(od.currentEnergy).toBe(0)
  })
})
