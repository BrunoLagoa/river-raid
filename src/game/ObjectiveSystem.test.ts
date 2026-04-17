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

  it('objetivo de kills com tempo falha ao expirar sem progresso suficiente', () => {
    const system = new ObjectiveSystem(() => 0)
    const state = system as unknown as {
      current: {
        type: string
        title: string
        detail: string
        progress: number
        target: number
        completed: boolean
        failed: boolean
        rewardScore: number
        completionTimer: number
        rewardGranted: boolean
        timeLimit: number
        timeRemaining: number
      }
    }

    state.current = {
      type: 'timed_enemy_kills',
      title: 'STRIKE WINDOW',
      detail: 'Destroy 3 enemies in 5.0s',
      progress: 0,
      target: 3,
      completed: false,
      failed: false,
      rewardScore: 300,
      completionTimer: 0,
      rewardGranted: false,
      timeLimit: 5,
      timeRemaining: 0.2,
    }

    system.update(0.3, 1)

    const hud = system.getHudData()
    expect(state.current.failed).toBe(true)
    expect(hud?.statusText).toBe('FAILED')
  })

  it('objetivo de score alvo conclui com score acumulado na janela', () => {
    const awardScore = vi.fn()
    const system = new ObjectiveSystem(() => 0, awardScore)
    const state = system as unknown as {
      current: {
        type: string
        title: string
        detail: string
        progress: number
        target: number
        completed: boolean
        failed: boolean
        rewardScore: number
        completionTimer: number
        rewardGranted: boolean
        timeLimit: number
        timeRemaining: number
      }
    }

    state.current = {
      type: 'score_target',
      title: 'POINT BURST',
      detail: 'Gain 300 score in 10.0s',
      progress: 0,
      target: 300,
      completed: false,
      failed: false,
      rewardScore: 260,
      completionTimer: 0,
      rewardGranted: false,
      timeLimit: 10,
      timeRemaining: 9,
    }

    system.onScoreGained(180)
    system.onScoreGained(140)

    const hud = system.getHudData()
    expect(state.current.completed).toBe(true)
    expect(awardScore).toHaveBeenCalledWith(260)
    expect(hud?.completed).toBe(true)
  })

  it('objetivo de trecho do rio falha ao sair dos limites', () => {
    const system = new ObjectiveSystem(() => 0)
    const state = system as unknown as {
      current: {
        type: string
        title: string
        detail: string
        progress: number
        target: number
        completed: boolean
        failed: boolean
        rewardScore: number
        completionTimer: number
        rewardGranted: boolean
        timeLimit: number
        timeRemaining: number
      }
    }

    state.current = {
      type: 'river_survival',
      title: 'RIVER LINE',
      detail: 'Stay in river for 6.0s',
      progress: 1.2,
      target: 6,
      completed: false,
      failed: false,
      rewardScore: 320,
      completionTimer: 0,
      rewardGranted: false,
      timeLimit: 0,
      timeRemaining: 0,
    }

    system.onRiverFrame(0.2, false)
    const hud = system.getHudData()

    expect(state.current.failed).toBe(true)
    expect(hud?.statusText).toBe('FAILED')
  })

  it('setProfile com applyImmediately força novo objetivo', () => {
    const system = new ObjectiveSystem(() => 0)
    const state = system as unknown as {
      current: { type: string }
    }

    const before = state.current
    system.setProfile('aggressive', true)

    expect(state.current.type).toBeTruthy()
    expect(state.current).not.toBe(before)
  })
})