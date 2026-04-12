import type { Player } from './Player'
import { ENEMY_COLORS, type EnemyManager } from './EnemyManager'
import type { FuelSystem } from './FuelSystem'
import type { Fx } from './Fx'
import type { SoundManager } from './SoundManager'
import type { World } from './World'

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
  fx: Fx
  sound: SoundManager
  world: World
  triggerGameOver: () => void
  addScore: (points: number) => void
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

    // Player vs Banks
    if (ctx.world.isOutOfBounds(ctx.player.x, ctx.player.y, ctx.player.width / 2)) {
      ctx.player.explode()
      ctx.fx.explosion(ctx.player.x, ctx.player.y, '#ff4400')
      ctx.fx.flash('#ff0000', 0.4)
      ctx.sound.explosion()
      ctx.triggerGameOver()
      return
    }

    // Player vs Enemies
    for (const enemy of ctx.enemyManager.enemies) {
      if (!enemy.active) continue
      const enemyRect: Rect = { x: enemy.x, y: enemy.y, width: enemy.width, height: enemy.height }
      if (CollisionSystem.checkAABB(playerRect, enemyRect)) {
        ctx.fx.explosion(enemy.x, enemy.y, ENEMY_COLORS[enemy.type] || '#ffffff')
        ctx.player.explode()
        ctx.fx.flash('#ff0000', 0.4)
        enemy.active = false
        ctx.sound.explosion()
        ctx.triggerGameOver()
        return
      }
    }

    // Player vs Enemy Bullets
    for (const bullet of ctx.enemyManager.bullets) {
      if (!bullet.active) continue
      const bulletRect: Rect = { x: bullet.x, y: bullet.y, width: bullet.width, height: bullet.height }
      if (CollisionSystem.checkAABB(playerRect, bulletRect)) {
        ctx.player.explode()
        ctx.fx.explosion(ctx.player.x, ctx.player.y, '#ff4400')
        ctx.fx.flash('#ff0000', 0.4)
        bullet.active = false
        ctx.sound.explosion()
        ctx.triggerGameOver()
        return
      }
    }

    // Player Bullets vs Enemies
    for (const bullet of ctx.player.bullets) {
      if (!bullet.active) continue
      const bulletRect: Rect = {
        x: bullet.x,
        y: bullet.y,
        width: bullet.width,
        height: bullet.height,
      }
      for (const enemy of ctx.enemyManager.enemies) {
        if (!enemy.active) continue
        const enemyRect: Rect = {
          x: enemy.x,
          y: enemy.y,
          width: enemy.width,
          height: enemy.height,
        }
        if (CollisionSystem.checkAABB(bulletRect, enemyRect)) {
          bullet.active = false
          const color = ENEMY_COLORS[enemy.type] || '#ffffff'
          ctx.fx.explosion(enemy.x, enemy.y, color)
          ctx.fx.scorePopup(enemy.x, enemy.y - 15, `+${enemy.points}`)
          if (enemy.type === 'bridge' && Math.random() < 0.5) {
            ctx.fuelSystem.spawnAt(enemy.x, enemy.y)
          }
          enemy.active = false
          ctx.addScore(enemy.points)
          ctx.sound.enemyHit()
          break
        }
      }
    }

    // Player vs Fuel
    if (ctx.fuelSystem.checkPickup(playerRect)) {
      ctx.sound.fuelCollect()
    }
  }
}
