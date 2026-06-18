import { describe, it, expect, vi } from 'vitest'
import { AchievementTracker } from './AchievementTracker'
import type { AchievementId } from './AchievementService'

function makeTracker() {
  const unlocked: AchievementId[] = []
  const tracker = new AchievementTracker((id) => unlocked.push(id))
  return { tracker, unlocked }
}

describe('AchievementTracker', () => {
  it('desbloqueia sharpshooter após 50 abates', () => {
    const { tracker, unlocked } = makeTracker()
    for (let i = 0; i < 49; i++) tracker.onEnemyDestroyed('helicopter')
    expect(unlocked).not.toContain('sharpshooter')
    tracker.onEnemyDestroyed('helicopter')
    expect(unlocked).toContain('sharpshooter')
  })

  it('desbloqueia first_bridge apenas uma vez', () => {
    const { tracker, unlocked } = makeTracker()
    tracker.onEnemyDestroyed('bridge')
    tracker.onEnemyDestroyed('bridge')
    expect(unlocked.filter((id) => id === 'first_bridge')).toHaveLength(1)
  })

  it('desbloqueia power_collector após 10 power-ups', () => {
    const { tracker, unlocked } = makeTracker()
    for (let i = 0; i < 10; i++) tracker.onPowerUpCollected()
    expect(unlocked).toContain('power_collector')
  })

  it('fuel_saver exige 60s acima de 75% e reseta abaixo do limiar', () => {
    const { tracker, unlocked } = makeTracker()
    tracker.updateFuel(40, 80) // acumula 40s
    tracker.updateFuel(10, 50) // cai abaixo de 75% → reseta
    tracker.updateFuel(40, 80) // só 40s desde o reset
    expect(unlocked).not.toContain('fuel_saver')
    tracker.updateFuel(25, 80) // 65s ≥ 60s
    expect(unlocked).toContain('fuel_saver')
  })

  it('onGameOver concede untouchable só sem mortes', () => {
    const a = makeTracker()
    a.tracker.onGameOver(0, 1)
    expect(a.unlocked).toContain('untouchable')

    const b = makeTracker()
    b.tracker.onPlayerDeath()
    b.tracker.onGameOver(0, 1)
    expect(b.unlocked).not.toContain('untouchable')
  })

  it('onGameOver concede marcos de pontuação e combo', () => {
    const { tracker, unlocked } = makeTracker()
    tracker.onGameOver(60000, 4)
    expect(unlocked).toEqual(expect.arrayContaining(['untouchable', 'survivor', 'high_flyer', 'combo_master']))
  })

  it('reset zera o progresso', () => {
    const { tracker, unlocked } = makeTracker()
    for (let i = 0; i < 50; i++) tracker.onEnemyDestroyed('plane')
    tracker.reset()
    unlocked.length = 0
    for (let i = 0; i < 49; i++) tracker.onEnemyDestroyed('plane')
    expect(unlocked).not.toContain('sharpshooter')
  })

  it('callback de unlock é invocado com o id correto', () => {
    const unlock = vi.fn()
    const tracker = new AchievementTracker(unlock)
    tracker.onEnemyDestroyed('bridge')
    expect(unlock).toHaveBeenCalledWith('first_bridge')
  })
})
