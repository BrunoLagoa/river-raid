import { describe, it, expect } from 'vitest'
import { EnemyManager } from './EnemyManager'
import {
  ENEMY_ACTIVE_CAP_MAX,
  ENEMY_MAX_HELICOPTERS_ACTIVE,
  ENEMY_SPAWN_MIN_X_GAP,
  ENEMY_SPAWN_MIN_Y_GAP,
  ENEMY_TIER_ELITE_BULLET_SPEED_MULT,
  ENEMY_TIER_BASIC_BULLET_SPEED_MULT,
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

  it('aplica IA por nivel no tiro (elite mais rapido que basic)', () => {
    const em = new EnemyManager(800, 600)
    const pool = (em as unknown as { enemyPool: { all: Array<Record<string, unknown>> } }).enemyPool.all

    Object.assign(pool[0], {
      type: 'plane',
      aiTier: 'basic',
      x: 220,
      y: 120,
      width: 32,
      height: 28,
      speed: 200,
      active: true,
      points: 100,
      canShoot: true,
      shootCooldown: 0,
      shootInterval: 0.8,
    })

    Object.assign(pool[1], {
      type: 'plane',
      aiTier: 'elite',
      x: 520,
      y: 120,
      width: 32,
      height: 28,
      speed: 200,
      active: true,
      points: 100,
      canShoot: true,
      shootCooldown: 0,
      shootInterval: 0.8,
    })

    const originalRandom = Math.random
    Math.random = () => 0
    try {
      em.update(0.016, world, segments, 120)
    } finally {
      Math.random = originalRandom
    }

    expect(em.bullets.length).toBe(2)
    const speeds = em.bullets.map((b) => b.speed).sort((a, b) => a - b)
    expect(speeds[0]).toBeCloseTo((350 + 0.016 * 0.8) * ENEMY_TIER_BASIC_BULLET_SPEED_MULT, 4)
    expect(speeds[1]).toBeCloseTo((350 + 0.016 * 0.8) * ENEMY_TIER_ELITE_BULLET_SPEED_MULT, 4)
  })

  it('aplica IA por nivel no movimento lateral de inimigos inteligentes', () => {
    const em = new EnemyManager(800, 600)
    const pool = (em as unknown as { enemyPool: { all: Array<Record<string, unknown>> } }).enemyPool.all

    Object.assign(pool[0], {
      type: 'plane',
      aiTier: 'basic',
      x: 400,
      y: 120,
      width: 32,
      height: 28,
      speed: 200,
      active: true,
      points: 100,
      canShoot: false,
      shootCooldown: 1,
      shootInterval: 1,
    })

    Object.assign(pool[1], {
      type: 'plane',
      aiTier: 'elite',
      x: 400,
      y: 120,
      width: 32,
      height: 28,
      speed: 200,
      active: true,
      points: 100,
      canShoot: false,
      shootCooldown: 1,
      shootInterval: 1,
    })

    const basicBefore = pool[0].x as number
    const eliteBefore = pool[1].x as number
    em.update(0.25, world, segments, 120)
    const basicAfter = pool[0].x as number
    const eliteAfter = pool[1].x as number

    expect(basicAfter).toBeCloseTo(basicBefore, 5)
    expect(Math.abs(eliteAfter - eliteBefore)).toBeGreaterThan(0)
  })

  it('bala inimiga que sai da tela e desativada', () => {
    const em = new EnemyManager(800, 600)
    const bulletPool = (em as unknown as { bulletPool: { acquire: () => Record<string, unknown> } }).bulletPool
    const b = bulletPool.acquire()
    Object.assign(b, { x: 400, y: 599, speed: 100, active: true, fromPlane: false })

    em.update(0.5, world, segments, 120)

    expect(b.active).toBe(false)
  })

  it('activeBulletCount reflete balas ativas', () => {
    const em = new EnemyManager(800, 600)
    const bulletPool = (em as unknown as { bulletPool: { acquire: () => Record<string, unknown> } }).bulletPool
    const b = bulletPool.acquire()
    Object.assign(b, { x: 300, y: 120, speed: 100, active: true, fromPlane: false })

    expect(em.activeBulletCount).toBe(1)
  })

  it('gunboat com hasMovement true atualiza fase e posicao', () => {
    const em = new EnemyManager(800, 600)
    const pool = (em as unknown as { enemyPool: { all: Array<Record<string, unknown>> } }).enemyPool.all

    Object.assign(pool[0], {
      type: 'gunboat',
      aiTier: 'smart',
      x: 400,
      y: 120,
      width: 28,
      height: 18,
      speed: 80,
      active: true,
      points: 160,
      canShoot: false,
      shootCooldown: 1,
      shootInterval: 1,
      hasMovement: true,
      originX: 400,
      phase: 0,
      phaseSpeed: 2,
      amplitude: 20,
    })

    const beforeX = pool[0].x as number
    em.update(0.25, world, segments, 120)
    const afterX = pool[0].x as number

    expect(afterX).not.toBe(beforeX)
  })

  it('spawn com segments vazio nao cria inimigos', () => {
    const em = new EnemyManager(800, 600)
    em.update(2, world, [], 120)

    expect(em.enemies.length).toBe(0)
  })

  it('spawn respeita cap total ativo', () => {
    const em = new EnemyManager(800, 600)

    for (let i = 0; i < 500; i++) {
      em.update(0.5, world, segments, 0)
    }

    const beforeCount = em.enemies.length

    em.update(5, world, segments, 120)

    expect(em.enemies.length).toBeLessThanOrEqual(beforeCount + 3)
  })
})
