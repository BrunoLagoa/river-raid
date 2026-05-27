import { describe, it, expect, vi } from 'vitest'
import { CollisionSystem, type CollisionContext } from './CollisionSystem'
import { SpatialGrid } from './SpatialGrid'
import { ENEMY_COLORS } from './EnemyManager'
import type { Enemy } from './EnemyManager'

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
      canShoot: false,
      shootCooldown: 0,
      shootInterval: 1,
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

  it('ignora bala do player inativa em bullets vs enemies', () => {
    const ctx = makeCtx()
    ctx.player.y = 300
    ctx.player.bullets.push({ x: 100, y: 100, width: 4, height: 8, speed: 500, active: false })
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

    expect(ctx.addScore).not.toHaveBeenCalled()
  })

  it('ignora candidato inativo apos kill no mesmo frame', () => {
    const ctx = makeCtx()
    ctx.player.y = 300
    ctx.player.bullets.push({ x: 100, y: 100, width: 4, height: 8, speed: 500, active: true })
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

    expect(ctx.addScore).toHaveBeenCalledTimes(1)
  })

  it('inimigo no candidate sem overlap nao pontua', () => {
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

    const aabbSpy = vi.spyOn(CollisionSystem, 'checkAABB')
    aabbSpy.mockReturnValueOnce(false)
    CollisionSystem.resolveCollisions(ctx)

    expect(ctx.addScore).not.toHaveBeenCalled()
  })

  it('ignora power-up inativo e power-up sem overlap', () => {
    const ctx = makeCtx()
    ctx.powerUpSystem.powerUps.push({ type: 'shield', x: 100, y: 100, width: 16, height: 16, active: false })
    ctx.powerUpSystem.powerUps.push({ type: 'slow_motion', x: 500, y: 500, width: 16, height: 16, active: true })

    CollisionSystem.resolveCollisions(ctx)

    expect(ctx.activateSlowMotion).not.toHaveBeenCalled()
    expect(ctx.addScore).not.toHaveBeenCalled()
  })

  it('checkPlayerVsEnemies cobre candidatos invalidos e sem overlap', () => {
    const ctx = makeCtx()
    ctx.enemyManager.enemies.push(
      {
        type: 'plane', aiTier: 'basic', x: 300, y: 300, width: 20, height: 20,
        points: 100, speed: 200, canShoot: false, shootCooldown: 0, shootInterval: 1, active: true,
      },
      {
        type: 'plane', aiTier: 'basic', x: 110, y: 110, width: 20, height: 20,
        points: 100, speed: 200, canShoot: false, shootCooldown: 0, shootInterval: 1, active: false,
      },
    )

    const querySpy = vi.spyOn(SpatialGrid.prototype, 'query').mockImplementation((_r, out) => {
      out.push(999, 1, 0)
      return out
    })

    CollisionSystem.resolveCollisions(ctx)

    expect(ctx.player.explode).not.toHaveBeenCalled()
    querySpy.mockRestore()
  })

  it('checkPlayerVsEnemyBullets cobre candidatos invalidos e sem overlap', () => {
    const ctx = makeCtx()
    ctx.enemyManager.bullets.push(
      { x: 300, y: 300, width: 4, height: 8, speed: 180, active: true, fromPlane: false },
      { x: 100, y: 100, width: 4, height: 8, speed: 180, active: false, fromPlane: false },
    )

    const querySpy = vi.spyOn(SpatialGrid.prototype, 'query').mockImplementation((_r, out) => {
      out.push(999, 1, 0)
      return out
    })

    CollisionSystem.resolveCollisions(ctx)

    expect(ctx.player.explode).not.toHaveBeenCalled()
    querySpy.mockRestore()
  })

  it('usa fallback de cor para inimigo desconhecido em explosao normal', () => {
    const ctx = makeCtx()
    ctx.player.y = 300
    ctx.player.bullets.push({ x: 100, y: 100, width: 4, height: 8, speed: 500, active: true })
    ctx.enemyManager.enemies.push({
      type: 'mystery',
      aiTier: 'basic',
      x: 100,
      y: 100,
      width: 20,
      height: 20,
      points: 100,
      speed: 0,
      active: true,
    } as unknown as (typeof ctx.enemyManager.enemies)[number])

    CollisionSystem.resolveCollisions(ctx)

    expect(ctx.fx.explosion).toHaveBeenCalledWith(100, 100, '#ffffff')
  })

  it('executa caminho bridge em checkBulletsVsEnemies', () => {
    const ctx = makeCtx()
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

    ;(CollisionSystem as unknown as { checkBulletsVsEnemies: (c: CollisionContext) => void }).checkBulletsVsEnemies(ctx)

    expect(ctx.fx.bigExplosion).toHaveBeenCalled()
  })

  it('player com escudo colidindo com tipo desconhecido usa fallback de cor', () => {
    const ctx = makeCtx()
    ctx.player.shieldActive = true
    ctx.enemyManager.enemies.push({
      type: 'mystery',
      aiTier: 'basic',
      x: 100,
      y: 100,
      width: 20,
      height: 20,
      points: 10,
      speed: 0,
      active: true,
    } as unknown as (typeof ctx.enemyManager.enemies)[number])

    CollisionSystem.resolveCollisions(ctx)

    expect(ctx.fx.explosion).toHaveBeenCalledWith(100, 100, '#ffffff')
  })

  it('player sem escudo colidindo com tipo desconhecido usa fallback de cor', () => {
    const ctx = makeCtx()
    ctx.enemyManager.enemies.push({
      type: 'mystery',
      aiTier: 'basic',
      x: 100,
      y: 100,
      width: 20,
      height: 20,
      points: 10,
      speed: 0,
      active: true,
    } as unknown as (typeof ctx.enemyManager.enemies)[number])

    CollisionSystem.resolveCollisions(ctx)

    expect(ctx.fx.explosion).toHaveBeenCalledWith(100, 100, '#ffffff')
    expect(ctx.handlePlayerDeath).toHaveBeenCalled()
  })

  it('bridge sem cor definida usa fallback no bigExplosion', () => {
    const ctx = makeCtx()
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

    const colors = ENEMY_COLORS as unknown as Record<string, string | undefined>
    const prevBridgeColor = colors.bridge
    colors.bridge = undefined

    try {
      ;(CollisionSystem as unknown as { checkBulletsVsEnemies: (c: CollisionContext) => void }).checkBulletsVsEnemies(ctx)
      expect(ctx.fx.bigExplosion).toHaveBeenCalledWith(100, 100, '#ffffff')
    } finally {
      colors.bridge = prevBridgeColor
    }
  })
})

// ── Power-up collision tests (bomb, rapid_fire, magnet_fuel) ──────────────────

function makeFullCtx() {
  const player = {
    state: 'alive',
    x: 100,
    y: 100,
    width: 20,
    height: 20,
    invincibilityTimer: 0,
    shieldActive: false,
    bullets: [] as { x: number; y: number; width: number; height: number; speed: number; active: boolean }[],
    explode: vi.fn(),
    breakShield: vi.fn(),
    doubleShotTimer: 0,
    rapidFireTimer: 0,
    magnetFuelTimer: 0,
  }

  const ctx = {
    player,
    enemyManager: { enemies: [] as { type: string; x: number; y: number; width: number; height: number; points: number; active: boolean }[], bullets: [] },
    fuelSystem: { checkPickup: vi.fn(() => false), spawnAt: vi.fn() },
    powerUpSystem: { powerUps: [] as { type: string; x: number; y: number; width: number; height: number; active: boolean }[], trySpawnAt: vi.fn() },
    fx: {
      explosion: vi.fn(), flash: vi.fn(), addShake: vi.fn(), bigExplosion: vi.fn(),
      deathSmoke: vi.fn(), scorePopup: vi.fn(), triggerShockwave: vi.fn(),
    },
    sound: {
      explosion: vi.fn(), enemyHit: vi.fn(), fuelCollect: vi.fn(),
      powerUpBomb: vi.fn(), powerUpRapidFire: vi.fn(), powerUpMagnet: vi.fn(), bombShockwave: vi.fn(),
    },
    world: { isOutOfBounds: vi.fn(() => false) },
    comboMultiplier: 1,
    triggerGameOver: vi.fn(),
    handlePlayerDeath: vi.fn(),
    addScore: vi.fn(),
    activateSlowMotion: vi.fn(),
    registerHit: vi.fn(),
    onPowerUpCollected: vi.fn(),
    onEnemyDestroyed: vi.fn(),
  }

  return ctx as unknown as CollisionContext
}

describe('CollisionSystem — power-up tipos adicionais', () => {
  it('rapid_fire power-up seta rapidFireTimer e toca som', () => {
    const ctx = makeFullCtx()
    ctx.powerUpSystem.powerUps.push({ type: 'rapid_fire', x: 100, y: 100, width: 16, height: 16, active: true })

    CollisionSystem.resolveCollisions(ctx)

    expect((ctx.player as unknown as { rapidFireTimer: number }).rapidFireTimer).toBeGreaterThan(0)
    expect(ctx.sound.powerUpRapidFire).toHaveBeenCalled()
  })

  it('magnet_fuel power-up seta magnetFuelTimer e toca som', () => {
    const ctx = makeFullCtx()
    ctx.powerUpSystem.powerUps.push({ type: 'magnet_fuel', x: 100, y: 100, width: 16, height: 16, active: true })

    CollisionSystem.resolveCollisions(ctx)

    expect((ctx.player as unknown as { magnetFuelTimer: number }).magnetFuelTimer).toBeGreaterThan(0)
    expect(ctx.sound.powerUpMagnet).toHaveBeenCalled()
  })

  it('bomb power-up destroi inimigos ativos e aciona shockwave', () => {
    const ctx = makeFullCtx()
    ctx.powerUpSystem.powerUps.push({ type: 'bomb', x: 100, y: 100, width: 16, height: 16, active: true })
    ctx.enemyManager.enemies.push(
      { type: 'helicopter', x: 200, y: 50, width: 28, height: 20, points: 60, active: true } as unknown as Enemy,
      { type: 'plane',      x: 300, y: 80, width: 32, height: 28, points: 100, active: true } as unknown as Enemy,
    )

    CollisionSystem.resolveCollisions(ctx)

    expect(ctx.enemyManager.enemies.every(e => !e.active)).toBe(true)
    expect(ctx.fx.triggerShockwave).toHaveBeenCalled()
    expect(ctx.sound.powerUpBomb).toHaveBeenCalled()
    expect(ctx.sound.bombShockwave).toHaveBeenCalled()
    expect(ctx.fx.addShake).toHaveBeenCalled()
  })

  it('bomb power-up sem inimigos nao chama addShake', () => {
    const ctx = makeFullCtx()
    ctx.powerUpSystem.powerUps.push({ type: 'bomb', x: 100, y: 100, width: 16, height: 16, active: true })

    CollisionSystem.resolveCollisions(ctx)

    expect(ctx.fx.addShake).not.toHaveBeenCalled()
    expect(ctx.fx.triggerShockwave).toHaveBeenCalled()
  })

  it('bomb shockwave ignora inimigos inativos na lista', () => {
    const ctx = makeFullCtx()
    ctx.powerUpSystem.powerUps.push({ type: 'bomb', x: 100, y: 100, width: 16, height: 16, active: true })
    ctx.enemyManager.enemies.push(
      { type: 'helicopter', x: 200, y: 50, width: 28, height: 20, points: 60, active: false } as unknown as Enemy,
      { type: 'plane',      x: 300, y: 80, width: 32, height: 28, points: 100, active: true } as unknown as Enemy,
    )

    CollisionSystem.resolveCollisions(ctx)

    // Inactive helicopter stays inactive; active plane gets destroyed
    expect(ctx.enemyManager.enemies[0].active).toBe(false)
    expect(ctx.enemyManager.enemies[1].active).toBe(false)
    // addScore should NOT have been called with helicopter points (60 * comboMultiplier)
    // because inactive enemies are skipped via continue
    const calls = (ctx.addScore as ReturnType<typeof vi.fn>).mock.calls as number[][]
    const helicopterScoreCalls = calls.filter((c) => c[0] === 60 * ctx.comboMultiplier)
    expect(helicopterScoreCalls.length).toBe(0)
  })
})
