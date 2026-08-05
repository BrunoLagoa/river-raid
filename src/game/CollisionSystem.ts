import type { Player } from './Player'
import { BULLET_STYLES } from './BulletStyles'
import { ENEMY_COLORS, type EnemyManager, type EnemyType } from './EnemyManager'
import type { FuelSystem } from './FuelSystem'
import type { Fx } from './Fx'
import type { PowerUpSystem } from './PowerUpSystem'
import type { SoundManager } from './SoundManager'
import type { World } from './World'
import { POWERUP_DOUBLE_SHOT_DURATION, POWERUP_SCORE, POWERUP_RAPID_FIRE_DURATION, POWERUP_MAGNET_FUEL_DURATION, POWERUP_BOMB_SHOCKWAVE_DURATION, BRIDGE_FUEL_DROP_CHANCE } from './constants'
import { SpatialGrid } from './SpatialGrid'
import type { RandomSource } from './random'

const enemyGrid = new SpatialGrid(64)
const bulletGrid = new SpatialGrid(64)
// Reused across queries to avoid per-frame array allocation in hot paths.
const candidates: number[] = []

interface GridItem { x: number; y: number; width: number; height: number; active: boolean }

export interface Rect {
  x: number
  y: number
  width: number
  height: number
}

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
  onPowerUpCollected?: (type: string) => void
  /** Deterministic RNG; falls back to Math.random if not provided. */
  random?: RandomSource
}

export class CollisionSystem {
  static checkAABB(a: Rect, b: Rect): boolean {
    return (
      a.x - a.width / 2 < b.x + b.width / 2 &&
      a.x + a.width / 2 > b.x - b.width / 2 &&
      a.y - a.height / 2 < b.y + b.height / 2 &&
      a.y + a.height / 2 > b.y - b.height / 2
    )
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
    CollisionSystem.buildGrid(ctx.enemyManager.enemies, enemyGrid)

    if (CollisionSystem.checkPlayerVsEnemies(ctx, playerRect)) return
    if (CollisionSystem.checkPlayerVsEnemyBullets(ctx, playerRect)) return

    CollisionSystem.checkBulletsVsEnemies(ctx)
    CollisionSystem.checkPlayerVsFuel(ctx, playerRect)
    CollisionSystem.checkPlayerVsPowerUps(ctx, playerRect)
  }

  private static buildGrid(items: GridItem[], grid: SpatialGrid): void {
    grid.clear()
    for (let i = 0; i < items.length; i++) {
      const it = items[i]
      if (!it.active) continue
      grid.insert(i, it)
    }
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
      const enemy = ctx.enemyManager.enemies[idx]
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

    CollisionSystem.buildGrid(ctx.enemyManager.bullets, bulletGrid)
    bulletGrid.query(playerRect, candidates)

    for (const idx of candidates) {
      const bullet = ctx.enemyManager.bullets[idx]
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
        const enemy = ctx.enemyManager.enemies[idx]
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
          if (enemy.type === 'bridge') {
            ctx.fx.bigExplosion(enemy.x, enemy.y, ENEMY_COLORS[enemy.type] || '#ffffff')
          } else {
            ctx.fx.explosion(enemy.x, enemy.y, ENEMY_COLORS[enemy.type] || '#ffffff')
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
          const enemies = ctx.enemyManager.enemies
          let destroyed = 0
          for (let i = enemies.length - 1; i >= 0; i--) {
            const enemy = enemies[i]
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
}
