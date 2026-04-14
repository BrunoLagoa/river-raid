import { describe, it, expect } from 'vitest'
import { EnemyManager } from './EnemyManager'
import {
  ENEMY_ACTIVE_CAP_MAX,
  ENEMY_MAX_HELICOPTERS_ACTIVE,
  ENEMY_SPAWN_MIN_X_GAP,
  ENEMY_SPAWN_MIN_Y_GAP,
} from './constants'

const world = { getBoundsAtY: () => ({ left: 100, right: 700 }) }
const segments = [{ centerX: 400, width: 300, y: 0 }]

describe('EnemyManager', () => {
  it('spawna inimigos com o tempo', () => {
    const em = new EnemyManager(800, 600)

    em.update(2, world, segments, 120)

    expect(em.enemies.length).toBeGreaterThan(0)
  })

  it('marca inimigo fora da tela como inativo', () => {
    const em = new EnemyManager(800, 600)
    em.update(2, world, segments, 120)

    const e = em.enemies[0]
    e.y = 10000
    em.update(0.016, world, segments, 120)

    expect(e.active).toBe(false)
  })

  it('respeita limite total de inimigos ativos', () => {
    const em = new EnemyManager(800, 600)

    for (let i = 0; i < 300; i++) {
      em.update(0.5, world, segments, 0)
    }

    expect(em.enemies.length).toBeLessThanOrEqual(ENEMY_ACTIVE_CAP_MAX)
  })

  it('respeita limite por tipo (helicopter)', () => {
    const em = new EnemyManager(800, 600)
    const originalRandom = Math.random
    let n = 0
    Math.random = () => {
      n += 1
      return (n % 10) / 10
    }

    try {
      for (let i = 0; i < 220; i++) {
        em.update(0.4, world, segments, 0)
      }
    } finally {
      Math.random = originalRandom
    }

    const helicopters = em.enemies.filter((e) => e.type === 'helicopter').length
    expect(helicopters).toBeLessThanOrEqual(ENEMY_MAX_HELICOPTERS_ACTIVE)
  })

  it('evita encavalamento de mesmo tipo no mesmo corredor de spawn', () => {
    const em = new EnemyManager(800, 600)
    const originalRandom = Math.random
    Math.random = () => 0

    try {
      for (let i = 0; i < 120; i++) {
        em.update(0.5, world, segments, 0)
      }
    } finally {
      Math.random = originalRandom
    }

    const helicopters = em.enemies.filter((e) => e.type === 'helicopter')
    expect(helicopters.length).toBeGreaterThan(0)

    for (let i = 0; i < helicopters.length; i++) {
      for (let j = i + 1; j < helicopters.length; j++) {
        const a = helicopters[i]
        const b = helicopters[j]
        const dy = Math.abs(a.y - b.y)
        const minXGap = ENEMY_SPAWN_MIN_X_GAP + (a.width + b.width) / 2
        const dx = Math.abs(a.x - b.x)
        const bothInSpawnBand = a.y < ENEMY_SPAWN_MIN_Y_GAP * 2 && b.y < ENEMY_SPAWN_MIN_Y_GAP * 2

        if (bothInSpawnBand && dy < ENEMY_SPAWN_MIN_Y_GAP) {
          expect(dx).toBeGreaterThanOrEqual(minXGap)
        }
      }
    }
  })
})
