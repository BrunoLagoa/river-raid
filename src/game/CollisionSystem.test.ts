import { describe, it, expect, vi } from 'vitest'
import { CollisionSystem, type CollisionContext } from './CollisionSystem'
import { SpatialGrid } from './SpatialGrid'
import { ENEMY_COLORS } from './EnemyManager'
import type { Enemy } from './EnemyManager'
import { OVERDRIVE_LASER_DPS } from './constants'

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
    fx: { explosion: vi.fn(), flash: vi.fn(), addShake: vi.fn(), bigExplosion: vi.fn(), deathSmoke: vi.fn(), scorePopup: vi.fn(), bulletSpark: vi.fn(), muzzleFlash: vi.fn() },
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
    ctx.player.bullets.push({ x: 100, y: 100, width: 4, height: 8, speed: 500, kind: 'normal', active: true })
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
    ctx.enemyManager.bullets.push({ x: 100, y: 100, width: 4, height: 8, speed: 180, vx: 0, active: true, fromPlane: false })

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
    ctx.enemyManager.bullets.push({ x: 100, y: 100, width: 4, height: 8, speed: 220, vx: 0, active: true, fromPlane: false })

    CollisionSystem.resolveCollisions(ctx)

    expect(ctx.player.breakShield).toHaveBeenCalled()
    expect(ctx.player.explode).not.toHaveBeenCalled()
    expect(ctx.enemyManager.bullets[0]?.active).toBe(false)
  })

  it('bala inimiga mata player sem escudo e sem invencibilidade', () => {
    const ctx = makeCtx()
    ctx.enemyManager.bullets.push({ x: 100, y: 100, width: 4, height: 8, speed: 180, vx: 0, active: true, fromPlane: false })

    CollisionSystem.resolveCollisions(ctx)

    expect(ctx.player.explode).toHaveBeenCalled()
    expect(ctx.handlePlayerDeath).toHaveBeenCalled()
  })

  it('bala vs bridge dispara bigExplosion', () => {
    const ctx = makeCtx()
    ctx.player.y = 300
    ctx.player.bullets.push({ x: 100, y: 100, width: 4, height: 8, speed: 500, kind: 'normal', active: true })
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
    ctx.player.bullets.push({ x: 100, y: 100, width: 4, height: 8, speed: 500, kind: 'normal', active: true })
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
    ctx.player.bullets.push({ x: 100, y: 100, width: 4, height: 8, speed: 500, kind: 'normal', active: true })
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
    ctx.player.bullets.push({ x: 100, y: 100, width: 4, height: 8, speed: 500, kind: 'normal', active: false })
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
    ctx.player.bullets.push({ x: 100, y: 100, width: 4, height: 8, speed: 500, kind: 'normal', active: true })
    ctx.player.bullets.push({ x: 100, y: 100, width: 4, height: 8, speed: 500, kind: 'normal', active: true })
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
    ctx.player.bullets.push({ x: 100, y: 100, width: 4, height: 8, speed: 500, kind: 'normal', active: true })
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
      { x: 300, y: 300, width: 4, height: 8, speed: 180, vx: 0, active: true, fromPlane: false },
      { x: 100, y: 100, width: 4, height: 8, speed: 180, vx: 0, active: false, fromPlane: false },
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
    ctx.player.bullets.push({ x: 100, y: 100, width: 4, height: 8, speed: 500, kind: 'normal', active: true })
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
    // Fora do alcance da ponte, senão o player morre antes da fase bala-vs-inimigo.
    ctx.player.y = 300
    ctx.player.bullets.push({ x: 100, y: 100, width: 4, height: 8, speed: 500, kind: 'normal', active: true })
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

    CollisionSystem.resolveCollisions(ctx)

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
    ctx.player.y = 300
    ctx.player.bullets.push({ x: 100, y: 100, width: 4, height: 8, speed: 500, kind: 'normal', active: true })
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
      CollisionSystem.resolveCollisions(ctx)
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
      deathSmoke: vi.fn(), scorePopup: vi.fn(), triggerShockwave: vi.fn(), bulletSpark: vi.fn(),
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

  it('balas do player causam dano ao boss e suas torres', () => {
    const ctx = makeFullCtx()
    const boss = {
      x: 200,
      y: 100,
      width: 100,
      height: 150,
      isAlive: true,
      points: 5000,
      turrets: [
        { id: 'fl', xOffset: -30, yOffset: -40, width: 20, height: 20, active: true },
      ],
      takeDamage: vi.fn(() => ({ defeated: false, turretDestroyed: 'fl' })),
    }
    ctx.boss = boss as never
    ctx.player.bullets.push({ x: 170, y: 60, width: 4, height: 8, speed: 500, kind: 'normal', active: true })

    CollisionSystem.resolveCollisions(ctx)

    expect(boss.takeDamage).toHaveBeenCalled()
    expect(ctx.player.bullets[0].active).toBe(false)
    expect(ctx.addScore).toHaveBeenCalled()
  })

  it('colisao direta do player com boss sem escudo mata o player', () => {
    const ctx = makeFullCtx()
    ctx.player.x = 200
    ctx.player.y = 100
    ctx.boss = {
      x: 200,
      y: 100,
      width: 100,
      height: 150,
      isAlive: true,
    } as never

    CollisionSystem.resolveCollisions(ctx)

    expect(ctx.player.explode).toHaveBeenCalled()
    expect(ctx.handlePlayerDeath).toHaveBeenCalled()
  })

  it('overdrive laser destroi inimigos e causa dano ao boss', () => {
    const ctx = makeFullCtx()
    ctx.player.x = 200
    ctx.player.y = 500
    ctx.player.overdriveActive = true
    ctx.onOverdriveKill = vi.fn()

    const boss = {
      x: 200,
      y: 100,
      width: 100,
      height: 150,
      isAlive: true,
      points: 5000,
      takeDamage: vi.fn(() => ({ defeated: true })),
    }
    ctx.boss = boss as never

    ctx.enemyManager.enemies.push({
      type: 'plane',
      x: 200,
      y: 300,
      width: 30,
      height: 30,
      points: 100,
      active: true,
    } as never)

    ctx.dt = 1 / 60
    CollisionSystem.resolveCollisions(ctx)

    expect(ctx.enemyManager.enemies[0].active).toBe(false)
    expect(ctx.onOverdriveKill).toHaveBeenCalled()
    expect(boss.takeDamage).toHaveBeenCalled()
  })

  it('overdrive laser usa o mesmo caminho de destruicao das balas', () => {
    const ctx = makeFullCtx()
    ctx.player.x = 200
    ctx.player.y = 500
    ctx.player.overdriveActive = true

    ctx.enemyManager.enemies.push({
      type: 'bridge', x: 200, y: 300, width: 30, height: 30, points: 100, active: true,
    } as never)

    CollisionSystem.resolveCollisions(ctx)

    // Combo, fumaca, drop e o callback de objetivos valem para qualquer arma.
    expect(ctx.registerHit).toHaveBeenCalled()
    expect(ctx.fx.deathSmoke).toHaveBeenCalled()
    expect(ctx.onEnemyDestroyed).toHaveBeenCalledWith('bridge')
    expect(ctx.fx.bigExplosion).toHaveBeenCalled()
    const dropped = (ctx.fuelSystem.spawnAt as unknown as { mock: { calls: unknown[] } }).mock.calls.length
      + (ctx.powerUpSystem.trySpawnAt as unknown as { mock: { calls: unknown[] } }).mock.calls.length
    expect(dropped).toBe(1)
  })

  it('dano do laser no boss escala com dt (independente de frame rate)', () => {
    const damages: number[] = []
    const makeBoss = () => ({
      x: 200, y: 100, width: 100, height: 150, isAlive: true, points: 5000, turrets: [],
      takeDamage: vi.fn((amount: number) => { damages.push(amount); return { defeated: false } }),
    })

    for (const dt of [1 / 60, 1 / 120]) {
      const ctx = makeFullCtx()
      ctx.player.x = 200
      ctx.player.y = 500
      ctx.player.overdriveActive = true
      ctx.boss = makeBoss() as never
      ctx.dt = dt
      CollisionSystem.resolveCollisions(ctx)
    }

    expect(damages).toHaveLength(2)
    expect(damages[0]).toBeCloseTo(damages[1] * 2, 5)
    expect(damages[0]).toBeCloseTo(OVERDRIVE_LASER_DPS / 60, 5)
  })
})

// ── Grid index stability vs. the pooled entity getters ───────────────────────
//
// `EnemyManager.enemies` / `.bullets` are getters over `ObjectPool.activeItems`,
// which rebuilds a shared cache on every read. Plain arrays (used by the other
// mocks above) cannot reproduce that, so these tests wire getters with the same
// semantics: deactivating an entity mid-resolution must not shift the indices
// the spatial grid handed out.

function pooledView<T extends { active: boolean }>(all: T[]): () => T[] {
  const cache: T[] = []
  return () => {
    cache.length = 0
    for (const item of all) if (item.active) cache.push(item)
    return cache
  }
}

function usePooledEntities(ctx: CollisionContext, enemies: Enemy[], bullets: EnemyBullet[]): void {
  const enemyView = pooledView(enemies)
  const bulletView = pooledView(bullets)
  ;(ctx as unknown as { enemyManager: unknown }).enemyManager = {
    get enemies() { return enemyView() },
    get bullets() { return bulletView() },
  }
}

function mkEnemyBullet(x: number, y: number): EnemyBullet {
  return { x, y, speed: 100, vx: 0, width: 4, height: 8, active: true, fromPlane: false }
}

function mkPlane(x: number, y: number): Enemy {
  return {
    type: 'plane', aiTier: 'basic', x, y, width: 20, height: 20, points: 100, speed: 200,
    canShoot: false, shootCooldown: 0, shootInterval: 1, active: true,
  } as unknown as Enemy
}

describe('CollisionSystem — estabilidade de índices do grid', () => {
  it('processa todas as balas inimigas mesmo desativando-as no meio do loop', () => {
    const ctx = makeCtx()
    ctx.player.shieldActive = true
    // Três balas na mesma célula do grid, todas sobre o player.
    const bullets = [mkEnemyBullet(100, 100), mkEnemyBullet(101, 100), mkEnemyBullet(102, 100)]
    usePooledEntities(ctx, [], bullets)

    CollisionSystem.resolveCollisions(ctx)

    // Sem snapshot, desativar a primeira encurta o cache e as seguintes são
    // lidas do índice errado (ou de fora do array) e atravessam o player.
    expect(bullets.map((b) => b.active)).toEqual([false, false, false])
    expect(ctx.player.breakShield).toHaveBeenCalledTimes(3)
  })

  it('mantém índices de inimigos válidos entre as fases da resolução', () => {
    const ctx = makeCtx()
    ctx.player.shieldActive = true
    // Índice 0 morre na fase player-vs-inimigos; índice 1 é alvo da fase
    // bala-vs-inimigos, que reusa o mesmo grid construído no início do frame.
    const rammed = mkPlane(100, 100)
    const target = mkPlane(100, 300)
    usePooledEntities(ctx, [rammed, target], [])
    ctx.player.bullets.push({ x: 100, y: 300, width: 4, height: 8, speed: 500, kind: 'normal', active: true })

    CollisionSystem.resolveCollisions(ctx)

    expect(rammed.active).toBe(false)
    expect(target.active).toBe(false)
    expect(ctx.addScore).toHaveBeenCalledWith(100)
  })
})
