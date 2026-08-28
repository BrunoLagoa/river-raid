import { describe, it, expect, beforeEach } from 'vitest'
import { BossDreadnought } from './BossDreadnought'
import { BOSS_DREADNOUGHT_HP, BOSS_TURRET_HP, BOSS_HEIGHT } from './constants'

describe('BossDreadnought', () => {
  let boss: BossDreadnought
  const CANVAS_WIDTH = 480

  beforeEach(() => {
    boss = new BossDreadnought(CANVAS_WIDTH)
  })

  it('starts in entering state at top of canvas', () => {
    expect(boss.x).toBe(CANVAS_WIDTH / 2)
    expect(boss.y).toBe(-BOSS_HEIGHT)
    expect(boss.state).toBe('entering')
    expect(boss.isAlive).toBe(true)
    expect(boss.isFighting).toBe(false)
    expect(boss.hp).toBe(BOSS_DREADNOUGHT_HP)
    expect(boss.turrets.length).toBe(4)
    expect(boss.activeTurretsCount).toBe(4)
    expect(boss.healthRatio).toBe(1.0)
  })

  it('transitions to fighting state once reached target Y', () => {
    // Advance entering until entry target Y
    boss.update(3.0, 240, 500, { left: 50, right: 430 }, () => {})
    expect(boss.state).toBe('fighting')
    expect(boss.isFighting).toBe(true)
  })

  it('damages and destroys individual turrets', () => {
    const res = boss.takeDamage(BOSS_TURRET_HP, 'fl')
    expect(res.defeated).toBe(false)
    expect(res.turretDestroyed).toBe('fl')
    expect(boss.activeTurretsCount).toBe(3)
  })

  it('advances to phase 2 when all 4 turrets are destroyed', () => {
    boss.takeDamage(BOSS_TURRET_HP, 'fl')
    boss.takeDamage(BOSS_TURRET_HP, 'fr')
    boss.takeDamage(BOSS_TURRET_HP, 'rl')
    boss.takeDamage(BOSS_TURRET_HP, 'rr')
    expect(boss.activeTurretsCount).toBe(0)
    expect(boss.phase).toBe(2)
  })

  it('advances to phase 3 when HP drops below 25%', () => {
    boss.takeDamage(BOSS_DREADNOUGHT_HP * 0.8)
    expect(boss.phase).toBe(3)
  })

  it('enters exploding state when HP reaches 0', () => {
    const res = boss.takeDamage(BOSS_DREADNOUGHT_HP + 10)
    expect(res.defeated).toBe(true)
    expect(boss.state).toBe('exploding')
    expect(boss.hp).toBe(0)

    // After death explosion timer, transitions to defeated
    boss.update(3.0, 240, 500, { left: 50, right: 430 }, () => {})
    expect(boss.state).toBe('defeated')
    expect(boss.active).toBe(false)
  })

  it('entra em fase 3 quando a queda de uma torre leva o casco abaixo de 25%', () => {
    // Casco logo acima do limiar: so a perda da torre empurra para baixo dele.
    boss.takeDamage(BOSS_DREADNOUGHT_HP - BOSS_DREADNOUGHT_HP * 0.25 - 1)
    expect(boss.phase).toBeLessThan(3)

    boss.takeDamage(BOSS_TURRET_HP, 'fl')

    expect(boss.hp).toBeLessThan(BOSS_DREADNOUGHT_HP * 0.25)
    expect(boss.phase).toBe(3)
  })

  it('fires bullets during fighting update', () => {
    boss.y = boss.entryTargetY
    boss.state = 'fighting'

    let shotsFired = 0
    // Force cooldowns to 0
    for (const t of boss.turrets) t.shootCooldown = 0
    boss.update(0.1, 240, 500, { left: 50, right: 430 }, () => {
      shotsFired++
    })
    expect(shotsFired).toBeGreaterThan(0)
  })
})
