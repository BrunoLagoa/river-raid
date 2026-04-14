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


  it('consome bala inimiga quando player esta invencivel', () => {
    const ctx = makeCtx()
    ctx.player.invincibilityTimer = 1
    ctx.enemyManager.bullets.push({ x: 100, y: 100, width: 4, height: 8, speed: 180, active: true, fromPlane: false })

    CollisionSystem.resolveCollisions(ctx)

    expect(ctx.enemyManager.bullets[0]?.active).toBe(false)
    expect(ctx.player.explode).not.toHaveBeenCalled()
  })

  it('quebra escudo ao colidir com inimigo e nao mata o player', () => {
    const ctx = makeCtx()
    ctx.player.shieldActive = true
    ctx.enemyManager.enemies.push({
      type: 'boat',
      aiTier: 'basic',
      x: 100,
      y: 100,
      width: 20,
      height: 20,
      points: 30,
      speed: 40,
      active: true,
      originX: 100,
      phase: 0,
      phaseSpeed: 1,
      amplitude: 10,
    })

    CollisionSystem.resolveCollisions(ctx)

    expect(ctx.player.breakShield).toHaveBeenCalled()
    expect(ctx.player.explode).not.toHaveBeenCalled()
  })

  it('coleta power-up de slow motion e registra score', () => {
    const ctx = makeCtx()
    ctx.powerUpSystem.powerUps.push({ type: 'slow_motion', x: 100, y: 100, width: 16, height: 16, active: true })

    CollisionSystem.resolveCollisions(ctx)

    expect(ctx.activateSlowMotion).toHaveBeenCalled()
    expect(ctx.addScore).toHaveBeenCalledWith(100)
    expect(ctx.sound.fuelCollect).toHaveBeenCalled()
  })

  it('quebra escudo ao colidir com bala inimiga e evita morte', () => {
    const ctx = makeCtx()
    ctx.player.shieldActive = true
    ctx.enemyManager.bullets.push({ x: 100, y: 100, width: 4, height: 8, speed: 220, active: true, fromPlane: false })

    CollisionSystem.resolveCollisions(ctx)

    expect(ctx.player.breakShield).toHaveBeenCalled()
    expect(ctx.player.explode).not.toHaveBeenCalled()
    expect(ctx.enemyManager.bullets[0]?.active).toBe(false)
  })

  it('bala inimiga mata player sem escudo e sem invencibilidade', () => {
    const ctx = makeCtx()
    ctx.enemyManager.bullets.push({ x: 100, y: 100, width: 4, height: 8, speed: 180, active: true, fromPlane: false })

    CollisionSystem.resolveCollisions(ctx)

    expect(ctx.player.explode).toHaveBeenCalled()
    expect(ctx.handlePlayerDeath).toHaveBeenCalled()
  })

  it('bala vs bridge dispara bigExplosion', () => {
    const ctx = makeCtx()
    ctx.player.y = 300
    ctx.player.bullets.push({ x: 100, y: 100, width: 4, height: 8, speed: 500, active: true })
    ctx.enemyManager.enemies.push({
      type: 'bridge',
      aiTier: 'basic',
      x: 100,
      y: 100,
      width: 200,
      height: 16,
      points: 500,
      speed: 0,
      active: true,
    })

    vi.spyOn(Math, 'random').mockReturnValue(0.3)
    CollisionSystem.resolveCollisions(ctx)

    expect(ctx.fx.bigExplosion).toHaveBeenCalled()
    expect(ctx.fuelSystem.spawnAt).toHaveBeenCalled()
  })

  it('bala vs non-bridge chama explosion normal', () => {
    const ctx = makeCtx()
    ctx.player.y = 300
    ctx.player.bullets.push({ x: 100, y: 100, width: 4, height: 8, speed: 500, active: true })
    ctx.enemyManager.enemies.push({
      type: 'helicopter',
      aiTier: 'basic',
      x: 100,
      y: 100,
      width: 28,
      height: 20,
      points: 60,
      speed: 100,
      active: true,
      originX: 100,
      phase: 0,
      phaseSpeed: 1,
      amplitude: 30,
    })

    CollisionSystem.resolveCollisions(ctx)

    expect(ctx.fx.explosion).toHaveBeenCalled()
  })

  it('fuel pickup dispara som fuelCollect', () => {
    const ctx = makeCtx()
    ctx.fuelSystem.checkPickup = vi.fn(() => true)

    CollisionSystem.resolveCollisions(ctx)

    expect(ctx.sound.fuelCollect).toHaveBeenCalled()
  })

  it('double_shot power-up ativa doubleShotTimer', () => {
    const ctx = makeCtx()
    ctx.powerUpSystem.powerUps.push({ type: 'double_shot', x: 100, y: 100, width: 16, height: 16, active: true })

    CollisionSystem.resolveCollisions(ctx)

    expect(ctx.player.doubleShotTimer).toBeGreaterThan(0)
    expect(ctx.addScore).toHaveBeenCalledWith(100)
  })

  it('shield power-up ativa shieldActive', () => {
    const ctx = makeCtx()
    ctx.powerUpSystem.powerUps.push({ type: 'shield', x: 100, y: 100, width: 16, height: 16, active: true })

    CollisionSystem.resolveCollisions(ctx)

    expect(ctx.player.shieldActive).toBe(true)
  })

  it('nao faz nada quando player nao esta alive', () => {
    const ctx = makeCtx()
    ctx.player.state = 'dead'

    CollisionSystem.resolveCollisions(ctx)

    expect(ctx.world.isOutOfBounds).not.toHaveBeenCalled()
  })

  it('inimigo mata player sem escudo e sem invencibilidade', () => {
    const ctx = makeCtx()
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

    expect(ctx.player.explode).toHaveBeenCalled()
    expect(ctx.handlePlayerDeath).toHaveBeenCalled()
  })

  it('checkAABB retorna false para retangulos separados', () => {
    expect(
      CollisionSystem.checkAABB(
        { x: 10, y: 10, width: 10, height: 10 },
        { x: 100, y: 100, width: 10, height: 10 },
      ),
    ).toBe(false)
  })

  it('bridge com random > 0.5 nao spawna fuel e tenta powerup', () => {
    const ctx = makeCtx()
    ctx.player.y = 300
    ctx.player.bullets.push({ x: 100, y: 100, width: 4, height: 8, speed: 500, active: true })
    ctx.enemyManager.enemies.push({
      type: 'bridge',
      aiTier: 'basic',
      x: 100,
      y: 100,
      width: 200,
      height: 16,
      points: 500,
      speed: 0,
      active: true,
    })

    vi.spyOn(Math, 'random').mockReturnValue(0.8)
    CollisionSystem.resolveCollisions(ctx)

    expect(ctx.fuelSystem.spawnAt).not.toHaveBeenCalled()
    expect(ctx.powerUpSystem.trySpawnAt).toHaveBeenCalled()
  })
})
