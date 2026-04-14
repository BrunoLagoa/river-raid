import { describe, it, expect, vi } from 'vitest'
import { CollisionSystem, type CollisionContext } from './CollisionSystem'

function makeCtx() {
  const player = {
    state: 'alive',
    x: 100,
    y: 100,
    width: 20,
    height: 20,
    invincibilityTimer: 0,
    shieldActive: false,
    bullets: [],
    explode: vi.fn(),
    breakShield: vi.fn(),
    doubleShotTimer: 0,
  }

  const ctx = {
    player,
    enemyManager: { enemies: [], bullets: [] },
    fuelSystem: { checkPickup: vi.fn(() => false), spawnAt: vi.fn() },
    powerUpSystem: { powerUps: [], trySpawnAt: vi.fn() },
    fx: { explosion: vi.fn(), flash: vi.fn(), addShake: vi.fn(), bigExplosion: vi.fn(), deathSmoke: vi.fn(), scorePopup: vi.fn() },
    sound: { explosion: vi.fn(), enemyHit: vi.fn(), fuelCollect: vi.fn() },
    world: { isOutOfBounds: vi.fn(() => false) },
    comboMultiplier: 1,
    triggerGameOver: vi.fn(),
    handlePlayerDeath: vi.fn(),
    addScore: vi.fn(),
    activateSlowMotion: vi.fn(),
    registerHit: vi.fn(),
  }

  return ctx as unknown as CollisionContext
}

describe('CollisionSystem', () => {
  it('checkAABB retorna true para retangulos sobrepostos', () => {
    expect(
      CollisionSystem.checkAABB(
        { x: 10, y: 10, width: 10, height: 10 },
        { x: 14, y: 14, width: 10, height: 10 },
      ),
    ).toBe(true)
  })

  it('mata player ao colidir com banco', () => {
    const ctx = makeCtx()
    ctx.world.isOutOfBounds = () => true

    CollisionSystem.resolveCollisions(ctx)

    expect(ctx.player.explode).toHaveBeenCalled()
    expect(ctx.handlePlayerDeath).toHaveBeenCalled()
  })

  it('aplica score ao acertar inimigo com bala do player', () => {
    const ctx = makeCtx()
    ctx.player.y = 300
    ctx.player.bullets.push({ x: 100, y: 100, width: 4, height: 8, speed: 500, active: true })
    ctx.enemyManager.enemies.push({
      type: 'plane',
      aiTier: 'basic',
      x: 100,
      y: 100,
      width: 20,
      height: 20,
      points: 100,
      speed: 200,
      canShoot: false,
      shootCooldown: 0,
      shootInterval: 1,
      active: true,
    })

    CollisionSystem.resolveCollisions(ctx)

    expect(ctx.addScore).toHaveBeenCalledWith(100)
    expect(ctx.registerHit).toHaveBeenCalled()
  })
})
