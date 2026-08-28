import type { Player } from './Player'
import { BULLET_STYLES } from './BulletStyles'
import type { EnemyManager } from './EnemyManager'
import { ENEMY_COLORS, type Enemy, type EnemyBullet, type EnemyType } from './EnemyTypes'
import type { FuelSystem } from './FuelSystem'
import type { Fx } from './Fx'
import type { PowerUpSystem, PowerUpType } from './PowerUpSystem'
import type { SoundManager } from './SoundManager'
import type { World } from './World'
import {
  POWERUP_DOUBLE_SHOT_DURATION, POWERUP_SCORE, POWERUP_RAPID_FIRE_DURATION,
  POWERUP_MAGNET_FUEL_DURATION, POWERUP_BOMB_SHOCKWAVE_DURATION, BRIDGE_FUEL_DROP_CHANCE,
  BOSS_TURRET_BULLET_DAMAGE, BOSS_HULL_BULLET_DAMAGE, BOSS_TURRET_SCORE,
  OVERDRIVE_LASER_DPS, OVERDRIVE_LASER_WIDTH, MINE_CHAIN_RADIUS,
} from './constants'
import { SpatialGrid } from './SpatialGrid'
import { checkAABB, type Rect } from './geometry'
import type { RandomSource } from './random'
import type { BossDreadnought } from './BossDreadnought'
import type { HazardManager } from './HazardManager'

/** Fallback frame step when a caller does not supply one (60 FPS). */
const DEFAULT_DT = 1 / 60

const enemyGrid = new SpatialGrid(64)
const bulletGrid = new SpatialGrid(64)
// Reused across queries to avoid per-frame array allocation in hot paths.
const candidates: number[] = []
// Stable per-frame views of the pools. `EnemyManager.enemies` / `.bullets` are
// getters over `ObjectPool.activeItems`, which rebuilds a shared cache on every
// read: deactivating one entity mid-resolution shifts every later index, so the
// indices the grid handed out would point at the wrong entity (or past the end).
// Copying once, alongside the grid build, keeps them valid for the whole frame.
const enemySnapshot: Enemy[] = []
// Reused by area blasts (mine detonations), which can fire outside the
// resolution pass and so cannot rely on the snapshot above being current.
const blastBuffer: Enemy[] = []
const bulletSnapshot: EnemyBullet[] = []

interface GridItem { x: number; y: number; width: number; height: number; active: boolean }

// Reexportado por compatibilidade: a definição vive em geometry.ts para que
// módulos folha não precisem importar este arquivo.
export type { Rect }

export interface CollisionContext {
  player: Player
  enemyManager: EnemyManager
  fuelSystem: FuelSystem
  powerUpSystem: PowerUpSystem
  fx: Fx
  sound: SoundManager
  world: World
  comboMultiplier: number
  triggerGameOver: () => void
  handlePlayerDeath: () => void
  addScore: (points: number) => void
  activateSlowMotion: () => void
  registerHit: () => void
  onEnemyDestroyed?: (enemyType: EnemyType) => void
  onFuelCollected?: (count: number) => void
  onPowerUpCollected?: (type: PowerUpType) => void
  boss?: BossDreadnought | null
  hazards?: HazardManager | null
  onOverdriveKill?: () => void
  /** Seconds elapsed this frame; continuous-damage sources scale by it. */
  dt?: number
  /** Deterministic RNG; falls back to Math.random if not provided. */
  random?: RandomSource
}

export class CollisionSystem {
  /** Delega para geometry.checkAABB; mantido como API estática já usada. */
  static checkAABB(a: Rect, b: Rect): boolean {
    return checkAABB(a, b)
  }

  static resolveCollisions(ctx: CollisionContext): void {
    if (ctx.player.state !== 'alive') return

    const playerRect: Rect = {
      x: ctx.player.x,
      y: ctx.player.y,
      width: ctx.player.width,
      height: ctx.player.height,
    }

    if (CollisionSystem.checkPlayerVsBanks(ctx)) return

    // Build the enemy grid once per frame — both player-vs-enemies and
    // bullets-vs-enemies reuse it (previously rebuilt twice).
    CollisionSystem.buildGrid(ctx.enemyManager.enemies, enemyGrid, enemySnapshot)

    if (CollisionSystem.checkPlayerVsEnemies(ctx, playerRect)) return
    if (CollisionSystem.checkPlayerVsEnemyBullets(ctx, playerRect)) return
    if (CollisionSystem.checkPlayerVsBoss(ctx, playerRect)) return
    if (CollisionSystem.checkPlayerVsHazards(ctx, playerRect)) return

    CollisionSystem.checkBulletsVsEnemies(ctx)
    CollisionSystem.checkBulletsVsBoss(ctx)
    CollisionSystem.checkBulletsVsHazards(ctx)
    CollisionSystem.checkOverdriveLaser(ctx)
    CollisionSystem.checkPlayerVsFuel(ctx, playerRect)
    CollisionSystem.checkPlayerVsPowerUps(ctx, playerRect)
  }

  /**
   * Copies `items` into `snapshot` and indexes the grid against that snapshot,
   * so grid indices stay meaningful even after entities are deactivated during
   * resolution. `snapshot` is a reused array — no per-frame allocation.
   */
  private static buildGrid<T extends GridItem>(items: readonly T[], grid: SpatialGrid, snapshot: T[]): void {
    grid.clear()
    snapshot.length = 0
    for (const it of items) {
      snapshot.push(it)
    }
    for (let i = 0; i < snapshot.length; i++) {
      const it = snapshot[i]
      if (!it.active) continue
      grid.insert(i, it)
    }
  }

  /**
   * Destroys every active enemy within `radius` of (x, y) through the shared
   * `destroyEnemy` path, so an area blast pays out exactly like a direct hit.
   *
   * Public because mine cascades detonate inside `HazardManager.update`, outside
   * the collision-resolution pass — `Game` routes that callback back here so the
   * chained explosions are not second-class citizens. Returns how many died.
   */
  static destroyEnemiesInRadius(
    ctx: CollisionContext,
    x: number,
    y: number,
    radius: number,
    explosionColor?: string,
  ): number {
    // Copy first: destroyEnemy deactivates entries, and the live getter rebuilds
    // the pool's shared cache on every read.
    blastBuffer.length = 0
    for (const enemy of ctx.enemyManager.enemies) blastBuffer.push(enemy)

    const radiusSq = radius * radius
    let destroyed = 0
    for (const enemy of blastBuffer) {
      if (!enemy.active) continue
      const dx = enemy.x - x
      const dy = enemy.y - y
      if (dx * dx + dy * dy > radiusSq) continue
      CollisionSystem.destroyEnemy(ctx, enemy, explosionColor)
      destroyed++
    }
    blastBuffer.length = 0
    return destroyed
  }

  /**
   * Single destruction path shared by every weapon that kills a normal enemy —
   * score, FX, combo, objectives and the bridge/power-up drop roll all live here
   * so new weapons cannot silently skip half of it.
   */
  private static destroyEnemy(
    ctx: CollisionContext,
    enemy: { type: EnemyType; x: number; y: number; points: number; active: boolean },
    explosionColor?: string,
  ): void {
    const color = explosionColor ?? ENEMY_COLORS[enemy.type] ?? '#ffffff'
    if (enemy.type === 'bridge') {
      ctx.fx.bigExplosion(enemy.x, enemy.y, color)
    } else {
      ctx.fx.explosion(enemy.x, enemy.y, color)
    }
    ctx.fx.deathSmoke(enemy.x, enemy.y)
    ctx.sound.explosion()
    const scoredPoints = enemy.points * ctx.comboMultiplier
    ctx.addScore(scoredPoints)
    ctx.fx.scorePopup(enemy.x, enemy.y - 15, `+${scoredPoints}`)
    ctx.registerHit()
    ctx.onEnemyDestroyed?.(enemy.type)

    if (enemy.type === 'bridge' && (ctx.random ?? Math.random)() < BRIDGE_FUEL_DROP_CHANCE) {
      ctx.fuelSystem.spawnAt(enemy.x, enemy.y)
    } else {
      ctx.powerUpSystem.trySpawnAt(enemy.x, enemy.y)
    }
    enemy.active = false
    ctx.sound.enemyHit()
  }

  private static killPlayer(ctx: CollisionContext, px: number, py: number, color: string): void {
    ctx.player.explode()
    ctx.fx.explosion(px, py, color)
    ctx.fx.flash('#ff0000', 0.4)
    ctx.fx.addShake(12, 0.5)
    ctx.sound.explosion()
    ctx.handlePlayerDeath()
  }

  private static checkPlayerVsBanks(ctx: CollisionContext): boolean {
    if (ctx.player.invincibilityTimer > 0) return false
    if (ctx.world.isOutOfBounds(ctx.player.x, ctx.player.y, ctx.player.width / 2)) {
      CollisionSystem.killPlayer(ctx, ctx.player.x, ctx.player.y, '#ff4400')
      return true
    }
    return false
  }

  private static checkPlayerVsEnemies(ctx: CollisionContext, playerRect: Rect): boolean {
    const isInvincible = ctx.player.invincibilityTimer > 0

    enemyGrid.query(playerRect, candidates)

    for (const idx of candidates) {
      const enemy = enemySnapshot[idx]
      if (!enemy || !enemy.active) continue
      const enemyRect: Rect = { x: enemy.x, y: enemy.y, width: enemy.width, height: enemy.height }
      if (!CollisionSystem.checkAABB(playerRect, enemyRect)) continue

      if (ctx.player.shieldActive) {
        ctx.player.breakShield()
        enemy.active = false
        ctx.fx.explosion(enemy.x, enemy.y, ENEMY_COLORS[enemy.type] || '#ffffff')
        ctx.sound.enemyHit()
        continue
      }

      if (isInvincible) return false

      CollisionSystem.killPlayer(ctx, enemy.x, enemy.y, ENEMY_COLORS[enemy.type] || '#ffffff')
      enemy.active = false
      return true
    }
    return false
  }

  private static checkPlayerVsEnemyBullets(ctx: CollisionContext, playerRect: Rect): boolean {
    const isInvincible = ctx.player.invincibilityTimer > 0

    CollisionSystem.buildGrid(ctx.enemyManager.bullets, bulletGrid, bulletSnapshot)
    bulletGrid.query(playerRect, candidates)

    for (const idx of candidates) {
      const bullet = bulletSnapshot[idx]
      if (!bullet || !bullet.active) continue
      const bulletRect: Rect = { x: bullet.x, y: bullet.y, width: bullet.width, height: bullet.height }
      if (!CollisionSystem.checkAABB(playerRect, bulletRect)) continue

      if (ctx.player.shieldActive) {
        ctx.player.breakShield()
        bullet.active = false
        ctx.fx.explosion(bullet.x, bullet.y, '#ffaaaa')
        ctx.sound.enemyHit()
        ctx.registerHit()
        continue
      }

      if (isInvincible) {
        bullet.active = false
        continue
      }

      CollisionSystem.killPlayer(ctx, ctx.player.x, ctx.player.y, '#ff4400')
      bullet.active = false
      return true
    }
    return false
  }

  private static checkBulletsVsEnemies(ctx: CollisionContext): void {
    for (const bullet of ctx.player.bullets) {
      if (!bullet.active) continue
      const bulletRect: Rect = {
        x: bullet.x,
        y: bullet.y,
        width: bullet.width,
        height: bullet.height,
      }

      enemyGrid.query(bulletRect, candidates)

      for (const idx of candidates) {
        const enemy = enemySnapshot[idx]
        if (!enemy || !enemy.active) continue

        const enemyRect: Rect = {
          x: enemy.x,
          y: enemy.y,
          width: enemy.width,
          height: enemy.height,
        }

        if (CollisionSystem.checkAABB(bulletRect, enemyRect)) {
          bullet.active = false
          ctx.fx.bulletSpark(bullet.x, bullet.y, BULLET_STYLES[bullet.kind].core)
          CollisionSystem.destroyEnemy(ctx, enemy)
          break
        }
      }
    }
  }

  private static checkPlayerVsFuel(ctx: CollisionContext, playerRect: Rect): void {
    const collected = ctx.fuelSystem.checkPickup(playerRect)
    if (collected) {
      ctx.sound.fuelCollect()
      ctx.onFuelCollected?.(1)
    }
  }

  private static checkPlayerVsPowerUps(ctx: CollisionContext, playerRect: Rect): void {
    for (const p of ctx.powerUpSystem.powerUps) {
      if (!p.active) continue
      const pRect: Rect = { x: p.x, y: p.y, width: p.width, height: p.height }
      if (CollisionSystem.checkAABB(playerRect, pRect)) {
        p.active = false
        if (p.type === 'double_shot') ctx.player.doubleShotTimer = POWERUP_DOUBLE_SHOT_DURATION
        if (p.type === 'shield') ctx.player.shieldActive = true
        if (p.type === 'slow_motion') ctx.activateSlowMotion()
        if (p.type === 'rapid_fire') {
          ctx.player.rapidFireTimer = POWERUP_RAPID_FIRE_DURATION
          ctx.sound.powerUpRapidFire()
        }
        if (p.type === 'magnet_fuel') {
          ctx.player.magnetFuelTimer = POWERUP_MAGNET_FUEL_DURATION
          ctx.sound.powerUpMagnet()
        }
        if (p.type === 'bomb') {
          ctx.sound.powerUpBomb()
          // Snapshot, not the live getter: destroying entries rebuilds the
          // pool's shared cache and would shift the indices under this loop.
          let destroyed = 0
          for (let i = enemySnapshot.length - 1; i >= 0; i--) {
            const enemy = enemySnapshot[i]
            if (!enemy.active) continue
            enemy.active = false
            ctx.fx.bigExplosion(enemy.x, enemy.y, '#ff6600')
            ctx.addScore(enemy.points * ctx.comboMultiplier)
            ctx.fx.scorePopup(enemy.x, enemy.y - 15, `+${enemy.points * ctx.comboMultiplier}`)
            destroyed++
            ctx.onEnemyDestroyed?.(enemy.type)
          }
          if (destroyed > 0) ctx.fx.addShake(8 + destroyed * 1.5, 0.6)
          ctx.fx.triggerShockwave(ctx.player.x, ctx.player.y, POWERUP_BOMB_SHOCKWAVE_DURATION)
          ctx.sound.bombShockwave()
        }
        if (p.type !== 'rapid_fire' && p.type !== 'magnet_fuel' && p.type !== 'bomb') ctx.sound.fuelCollect()
        ctx.addScore(POWERUP_SCORE)
        ctx.fx.scorePopup(p.x, p.y - 15, `+100`)
        ctx.onPowerUpCollected?.(p.type)
      }
    }
  }

  private static checkPlayerVsBoss(ctx: CollisionContext, playerRect: Rect): boolean {
    if (!ctx.boss || !ctx.boss.isAlive) return false

    const bossRect: Rect = {
      x: ctx.boss.x,
      y: ctx.boss.y,
      width: ctx.boss.width,
      height: ctx.boss.height,
    }

    if (CollisionSystem.checkAABB(playerRect, bossRect)) {
      if (ctx.player.shieldActive) {
        ctx.player.breakShield()
        ctx.fx.explosion(ctx.player.x, ctx.player.y, '#ffffaa')
        ctx.sound.enemyHit()
        return false
      }
      if (ctx.player.invincibilityTimer > 0) return false

      CollisionSystem.killPlayer(ctx, ctx.player.x, ctx.player.y, '#ff3300')
      return true
    }
    return false
  }

  private static checkBulletsVsBoss(ctx: CollisionContext): void {
    if (!ctx.boss || !ctx.boss.isAlive) return
    const boss = ctx.boss

    for (const bullet of ctx.player.bullets) {
      if (!bullet.active) continue
      const bRect: Rect = { x: bullet.x, y: bullet.y, width: bullet.width, height: bullet.height }

      // 1. Check turrets first
      let hitTurret = false
      for (const t of boss.turrets) {
        if (!t.active) continue
        const tRect: Rect = {
          x: boss.x + t.xOffset,
          y: boss.y + t.yOffset,
          width: t.width,
          height: t.height,
        }
        if (CollisionSystem.checkAABB(bRect, tRect)) {
          bullet.active = false
          hitTurret = true
          const result = boss.takeDamage(BOSS_TURRET_BULLET_DAMAGE, t.id)
          ctx.fx.bulletSpark(bullet.x, bullet.y, '#ffaa00')
          ctx.sound.enemyHit()
          ctx.registerHit()
          if (result.turretDestroyed) {
            ctx.fx.explosion(tRect.x, tRect.y, '#ff4400')
            ctx.addScore(BOSS_TURRET_SCORE * ctx.comboMultiplier)
          }
          break
        }
      }

      if (hitTurret) continue

      // 2. Check main Hull
      const bossRect: Rect = {
        x: boss.x,
        y: boss.y,
        width: boss.width,
        height: boss.height,
      }
      if (CollisionSystem.checkAABB(bRect, bossRect)) {
        bullet.active = false
        const res = boss.takeDamage(BOSS_HULL_BULLET_DAMAGE)
        ctx.fx.bulletSpark(bullet.x, bullet.y, '#ffaa00')
        ctx.sound.enemyHit()
        ctx.registerHit()
        if (res.defeated) {
          ctx.fx.bigExplosion(boss.x, boss.y, '#ff3300')
          ctx.fx.addShake(15, 1.2)
          ctx.sound.explosion()
          ctx.addScore(boss.points * ctx.comboMultiplier)
          ctx.fx.scorePopup(boss.x, boss.y - 20, `+${boss.points * ctx.comboMultiplier}`)
        }
      }
    }
  }

  private static checkPlayerVsHazards(ctx: CollisionContext, playerRect: Rect): boolean {
    if (!ctx.hazards) return false
    // Same precedence as every other lethal contact: shield first, then the
    // respawn invincibility window, then death.
    const isInvincible = ctx.player.invincibilityTimer > 0

    for (const mine of ctx.hazards.mines) {
      if (!mine.active) continue
      const mineRect: Rect = { x: mine.x, y: mine.y, width: mine.width, height: mine.height }
      if (!CollisionSystem.checkAABB(playerRect, mineRect)) continue

      if (ctx.player.shieldActive) {
        mine.active = false
        ctx.player.breakShield()
        ctx.fx.bigExplosion(mine.x, mine.y, '#ff2200')
        ctx.sound.explosion()
        continue
      }

      if (isInvincible) return false

      mine.active = false
      ctx.fx.bigExplosion(mine.x, mine.y, '#ff2200')
      CollisionSystem.killPlayer(ctx, mine.x, mine.y, '#ff2200')
      return true
    }

    for (const bunker of ctx.hazards.bunkers) {
      if (!bunker.active) continue
      const bunkerRect: Rect = { x: bunker.x, y: bunker.y, width: bunker.width, height: bunker.height }
      if (!CollisionSystem.checkAABB(playerRect, bunkerRect)) continue

      if (ctx.player.shieldActive) {
        ctx.player.breakShield()
        ctx.fx.explosion(ctx.player.x, ctx.player.y, '#ffffaa')
        ctx.sound.enemyHit()
        continue
      }

      if (isInvincible) return false

      CollisionSystem.killPlayer(ctx, ctx.player.x, ctx.player.y, '#ff5500')
      return true
    }
    return false
  }

  private static checkBulletsVsHazards(ctx: CollisionContext): void {
    if (!ctx.hazards) return

    for (const bullet of ctx.player.bullets) {
      if (!bullet.active) continue
      const bRect: Rect = { x: bullet.x, y: bullet.y, width: bullet.width, height: bullet.height }

      // 1. Bullets vs Sea Mines
      for (let i = 0; i < ctx.hazards.mines.length; i++) {
        const mine = ctx.hazards.mines[i]
        if (!mine.active) continue
        const mRect: Rect = { x: mine.x, y: mine.y, width: mine.width, height: mine.height }

        if (CollisionSystem.checkAABB(bRect, mRect)) {
          bullet.active = false
          mine.active = false
          ctx.fx.bigExplosion(mine.x, mine.y, '#ff4400')
          ctx.fx.addShake(4, 0.2)
          ctx.sound.explosion()
          ctx.registerHit()
          ctx.addScore(mine.points * ctx.comboMultiplier)
          ctx.fx.scorePopup(mine.x, mine.y - 10, `+${mine.points * ctx.comboMultiplier}`)

          // Chain reaction to adjacent mines. Score/FX for the chained mines is
          // awarded by the detonation callback when their fuse actually expires,
          // so every detonation path (bullet, laser, cascade) pays out once.
          ctx.hazards.triggerMineChain(i)

          // Enemies caught in the blast — same helper the cascade uses.
          CollisionSystem.destroyEnemiesInRadius(ctx, mine.x, mine.y, MINE_CHAIN_RADIUS, '#ffaa00')
          break
        }
      }

      if (!bullet.active) continue

      // 2. Bullets vs Shore Bunkers
      for (const bunker of ctx.hazards.bunkers) {
        if (!bunker.active) continue
        const bunkerRect: Rect = { x: bunker.x, y: bunker.y, width: bunker.width, height: bunker.height }

        if (CollisionSystem.checkAABB(bRect, bunkerRect)) {
          bullet.active = false
          bunker.hp -= 1
          bunker.damageFlashTimer = 0.1
          ctx.fx.bulletSpark(bullet.x, bullet.y, '#ffaa00')
          ctx.sound.enemyHit()
          ctx.registerHit()

          if (bunker.hp <= 0) {
            bunker.active = false
            ctx.fx.bigExplosion(bunker.x, bunker.y, '#ff5500')
            ctx.fx.deathSmoke(bunker.x, bunker.y)
            ctx.sound.explosion()
            ctx.addScore(bunker.points * ctx.comboMultiplier)
            ctx.fx.scorePopup(bunker.x, bunker.y - 15, `+${bunker.points * ctx.comboMultiplier}`)
          }
          break
        }
      }
    }
  }

  private static checkOverdriveLaser(ctx: CollisionContext): void {
    if (!ctx.player.overdriveActive) return

    // The beam is a vertical slab from the top of the screen to the ship's nose.
    const beamRect: Rect = {
      x: ctx.player.x,
      y: ctx.player.y / 2,
      width: OVERDRIVE_LASER_WIDTH,
      height: Math.max(0, ctx.player.y),
    }

    // 1. Destroy normal enemies in beam path
    for (const enemy of enemySnapshot) {
      if (!enemy.active) continue
      const enemyRect: Rect = { x: enemy.x, y: enemy.y, width: enemy.width, height: enemy.height }
      if (!CollisionSystem.checkAABB(beamRect, enemyRect)) continue

      CollisionSystem.destroyEnemy(ctx, enemy, '#00ffff')
      ctx.onOverdriveKill?.()
    }

    // 2. Damage boss in beam path — continuous, so scale by the frame step.
    const boss = ctx.boss
    if (boss && boss.isAlive) {
      const bossRect: Rect = { x: boss.x, y: boss.y, width: boss.width, height: boss.height }
      if (CollisionSystem.checkAABB(beamRect, bossRect)) {
        const res = boss.takeDamage(OVERDRIVE_LASER_DPS * (ctx.dt ?? DEFAULT_DT))
        ctx.fx.bulletSpark(ctx.player.x, boss.y + boss.height / 4, '#00ffff')
        if (res.defeated) {
          ctx.fx.bigExplosion(boss.x, boss.y, '#00ffff')
          ctx.fx.addShake(16, 1.2)
          ctx.sound.explosion()
          ctx.addScore(boss.points * ctx.comboMultiplier)
          ctx.fx.scorePopup(boss.x, boss.y - 20, `+${boss.points * ctx.comboMultiplier}`)
        }
      }
    }

    // 3. Detonate mines & damage bunkers in beam path
    if (ctx.hazards) {
      for (let i = 0; i < ctx.hazards.mines.length; i++) {
        const mine = ctx.hazards.mines[i]
        if (!mine.active) continue
        const mRect: Rect = { x: mine.x, y: mine.y, width: mine.width, height: mine.height }
        if (CollisionSystem.checkAABB(beamRect, mRect)) {
          mine.active = false
          ctx.fx.bigExplosion(mine.x, mine.y, '#00ffff')
          ctx.sound.explosion()
          ctx.registerHit()
          ctx.addScore(mine.points * ctx.comboMultiplier)
          ctx.fx.scorePopup(mine.x, mine.y - 10, `+${mine.points * ctx.comboMultiplier}`)
          ctx.hazards.triggerMineChain(i)
          CollisionSystem.destroyEnemiesInRadius(ctx, mine.x, mine.y, MINE_CHAIN_RADIUS, '#00ffff')
        }
      }

      for (const bunker of ctx.hazards.bunkers) {
        if (!bunker.active) continue
        const bunkerRect: Rect = { x: bunker.x, y: bunker.y, width: bunker.width, height: bunker.height }
        if (CollisionSystem.checkAABB(beamRect, bunkerRect)) {
          bunker.hp -= OVERDRIVE_LASER_DPS * (ctx.dt ?? DEFAULT_DT)
          bunker.damageFlashTimer = 0.08
          ctx.fx.bulletSpark(bunker.x, bunker.y, '#00ffff')
          if (bunker.hp <= 0) {
            bunker.active = false
            ctx.fx.bigExplosion(bunker.x, bunker.y, '#00ffff')
            ctx.sound.explosion()
            ctx.addScore(bunker.points * ctx.comboMultiplier)
            ctx.fx.scorePopup(bunker.x, bunker.y - 15, `+${bunker.points * ctx.comboMultiplier}`)
          }
        }
      }
    }
  }
}
