import { describe, it, expect } from 'vitest'
import { EnemyManager } from './EnemyManager'

describe('EnemyManager', () => {
  it('spawna inimigos com o tempo', () => {
    const em = new EnemyManager(800, 600)

    em.update(
      2,
      { getBoundsAtY: () => ({ left: 100, right: 700 }) },
      [{ centerX: 400, width: 300, y: 0 }],
      120,
    )

    expect(em.enemies.length).toBeGreaterThan(0)
  })

  it('marca inimigo fora da tela como inativo', () => {
    const em = new EnemyManager(800, 600)
    em.update(
      2,
      { getBoundsAtY: () => ({ left: 100, right: 700 }) },
      [{ centerX: 400, width: 300, y: 0 }],
      120,
    )

    const e = em.enemies[0]
    e.y = 10000
    em.update(0.016, { getBoundsAtY: () => ({ left: 100, right: 700 }) }, [{ centerX: 400, width: 300, y: 0 }], 120)

    expect(e.active).toBe(false)
  })
})
