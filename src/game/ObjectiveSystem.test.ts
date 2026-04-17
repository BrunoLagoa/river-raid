import { describe, expect, it, vi } from 'vitest'
import { ObjectiveSystem } from './ObjectiveSystem'

describe('ObjectiveSystem', () => {
  it('progride objetivo de inimigos e recompensa ao completar', () => {
    const awardScore = vi.fn()
    const system = new ObjectiveSystem(() => 0, awardScore)

    const current = system as unknown as { current: { type: string; progress: number; target: number; completed: boolean; rewardScore: number } }
    current.current = {
      type: 'enemy_kills',
      progress: 0,
      target: 2,
      completed: false,
      rewardScore: 200,
    } as never

    system.onEnemyDestroyed('helicopter')
    expect(current.current.progress).toBe(1)
    expect(awardScore).not.toHaveBeenCalled()

    system.onEnemyDestroyed('boat')
    expect(current.current.completed).toBe(true)
    expect(awardScore).toHaveBeenCalledWith(200)
  })

  it('conta pickups de fuel e expõe HUD com progresso', () => {
    const system = new ObjectiveSystem(() => 0)
    const current = system as unknown as {
      current: {
        type: string
        title: string
        detail: string
        progress: number
        target: number
        completed: boolean
        rewardScore: number
      }
    }

    current.current = {
      type: 'fuel_pickups',
      title: 'FUEL RUN',
      detail: 'Collect 2 fuel tanks',
      progress: 0,
      target: 2,
      completed: false,
      rewardScore: 180,
    } as never

    system.onFuelCollected(1)

    const hud = system.getHudData()
    expect(current.current.progress).toBe(1)
    expect(hud?.progressText).toBe('1/2')
    expect(hud?.completed).toBe(false)
  })

  it('objetivo de combo exige o multiplicador minimo', () => {
    const system = new ObjectiveSystem(() => 0)
    const current = system as unknown as {
      current: {
        type: string
        progress: number
        target: number
        completed: boolean
        comboThreshold: number
        completionTimer: number
      }
    }

    current.current = {
      type: 'combo_hold',
      progress: 0,
      target: 1.0,
      completed: false,
      comboThreshold: 2,
      completionTimer: 0,
    } as never

    system.update(0.4, 1)
    expect(current.current.progress).toBe(0)

    system.update(0.4, 2)
    expect(current.current.progress).toBeGreaterThan(0)
  })
})