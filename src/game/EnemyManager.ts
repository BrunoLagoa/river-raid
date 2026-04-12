import { ObjectPool } from './ObjectPool'
import {
  ENEMY_SPAWN_INTERVAL_START, ENEMY_SPAWN_INTERVAL_MIN, ENEMY_SPAWN_INTERVAL_DECAY,
  ENEMY_SPAWN_DUAL_TIME, ENEMY_SPAWN_TRIPLE_TIME, ENEMY_SPAWN_QUAD_TIME,
  ENEMY_SPAWN_DUAL_CHANCE, ENEMY_SPAWN_TRIPLE_CHANCE, ENEMY_SPAWN_QUAD_CHANCE,
  ENEMY_SPAWN_Y, ENEMY_OFFSCREEN_Y,
} from './constants'
import { EnemyRenderer } from './EnemyRenderer'

export type EnemyType = 'helicopter' | 'plane' | 'boat' | 'bridge' | 'tank' | 'gunboat'

export interface EnemyBullet {
  x: number
  y: number
  speed: number
  width: number
  height: number
  active: boolean
  fromPlane: boolean
}

export interface BaseEnemy {
  type: EnemyType
  x: number
  y: number
  width: number
  height: number
  speed: number
  active: boolean
  points: number
}

export interface HelicopterEnemy extends BaseEnemy {
  type: 'helicopter'
  canShoot: boolean
  shootCooldown: number
  shootInterval: number
  phase: number
  phaseSpeed: number
  amplitude: number
  originX: number
}

export interface PlaneEnemy extends BaseEnemy {
  type: 'plane'
  canShoot: boolean
  shootCooldown: number
  shootInterval: number
}

export interface BoatEnemy extends BaseEnemy {
  type: 'boat'
  phase: number
  phaseSpeed: number
  amplitude: number
  originX: number
}

export interface BridgeEnemy extends BaseEnemy {
  type: 'bridge'
}

export interface TankEnemy extends BaseEnemy {
  type: 'tank'
}

export interface GunboatEnemy extends BaseEnemy {
  type: 'gunboat'
  canShoot: boolean
  shootCooldown: number
  shootInterval: number
}

export type Enemy = HelicopterEnemy | PlaneEnemy | BoatEnemy | BridgeEnemy | TankEnemy | GunboatEnemy

const ENEMY_CONFIGS: Record<EnemyType, { width: number; height: number; points: number }> = {
  helicopter: { width: 28, height: 20, points: 60 },
  plane: { width: 32, height: 28, points: 100 },
  boat: { width: 24, height: 16, points: 30 },
  bridge: { width: 200, height: 16, points: 500 },
  tank: { width: 22, height: 14, points: 120 },
  gunboat: { width: 28, height: 18, points: 160 },
}

export const ENEMY_COLORS: Record<EnemyType, string> = {
  helicopter: '#ff4444',
  plane: '#dddddd',
  boat: '#8888dd',
  bridge: '#2d1a12',
  tank: '#55aa55',
  gunboat: '#44aacc',
}

export class EnemyManager {
  private enemyPool = new ObjectPool<Enemy>(
    60,
    () => ({
      type: 'bridge',
      x: 0,
      y: 0,
      width: ENEMY_CONFIGS.bridge.width,
      height: ENEMY_CONFIGS.bridge.height,
      speed: 0,
      active: false,
      points: ENEMY_CONFIGS.bridge.points,
    }),
    (enemy) => {
      enemy.active = true
    },
  )

  private bulletPool = new ObjectPool<EnemyBullet>(
    80,
    () => ({ x: 0, y: 0, speed: 0, width: 4, height: 8, active: false, fromPlane: false }),
    (bullet) => {
      bullet.active = true
    },
  )

  get enemies(): Enemy[] {
    return this.enemyPool.activeItems
  }

  get bullets(): EnemyBullet[] {
    return this.bulletPool.activeItems
  }

  private renderer = new EnemyRenderer()
  private spawnTimer = 0
  private spawnInterval = ENEMY_SPAWN_INTERVAL_START
  private gameTime = 0
  private canvasHeight: number

  constructor(_canvasWidth: number, canvasHeight: number) {
    this.canvasHeight = canvasHeight
  }

  setCanvasHeight(h: number): void {
    this.canvasHeight = h
  }

  update(dt: number, world: { getBoundsAtY: (y: number) => { left: number; right: number } }, riverSegments: { centerX: number; width: number; y: number }[], scrollSpeed = 120): void {
    this.gameTime += dt

    this.spawnInterval = Math.max(ENEMY_SPAWN_INTERVAL_MIN, 1.2 - this.gameTime * ENEMY_SPAWN_INTERVAL_DECAY)

    this.spawnTimer -= dt
    if (this.spawnTimer <= 0) {
      this.spawn(riverSegments, 0)
      if (this.gameTime > ENEMY_SPAWN_DUAL_TIME && Math.random() < ENEMY_SPAWN_DUAL_CHANCE) {
        this.spawn(riverSegments, -60)
      }
      if (this.gameTime > ENEMY_SPAWN_TRIPLE_TIME && Math.random() < ENEMY_SPAWN_TRIPLE_CHANCE) {
        this.spawn(riverSegments, -120)
      }
      if (this.gameTime > ENEMY_SPAWN_QUAD_TIME && Math.random() < ENEMY_SPAWN_QUAD_CHANCE) {
        this.spawn(riverSegments, -180)
      }
      this.spawnTimer = this.spawnInterval
    }

    for (const enemy of this.enemies) {
      enemy.y += scrollSpeed * dt * (enemy.type === 'bridge' ? 1 : 0.3)

      if (enemy.type === 'helicopter') {
        enemy.phase += enemy.phaseSpeed * dt
        enemy.x = enemy.originX + Math.sin(enemy.phase) * enemy.amplitude
      }

      if (enemy.type === 'boat') {
        enemy.phase += enemy.phaseSpeed * dt
        enemy.x = enemy.originX + Math.sin(enemy.phase) * enemy.amplitude
      }

      if (enemy.type !== 'bridge') {
        const bounds = world.getBoundsAtY(enemy.y)
        const hw = enemy.width / 2
        enemy.x = Math.max(bounds.left + hw + 2, Math.min(bounds.right - hw - 2, enemy.x))
      }

      if (enemy.type === 'helicopter' || enemy.type === 'plane' || enemy.type === 'gunboat') {
        if (enemy.canShoot && enemy.y > 0) {
          enemy.shootCooldown -= dt
          if (enemy.shootCooldown <= 0) {
            const bullet = this.bulletPool.acquire()
            const bulletSpeed = enemy.type === 'plane' ? 350 + this.gameTime * 0.8 : enemy.type === 'gunboat' ? 260 + this.gameTime * 0.5 : 220 + this.gameTime * 0.4
            bullet.x = enemy.x
            bullet.y = enemy.y + enemy.height / 2
            bullet.speed = bulletSpeed
            bullet.width = enemy.type === 'plane' ? 5 : 4
            bullet.height = enemy.type === 'plane' ? 10 : 8
            bullet.fromPlane = enemy.type === 'plane'
            enemy.shootCooldown = enemy.shootInterval + Math.random() * 0.3
          }
        }
      }

      if (enemy.y > this.canvasHeight + ENEMY_OFFSCREEN_Y) {
        enemy.active = false
      }
    }

    for (const bullet of this.bullets) {
      bullet.y += bullet.speed * dt
      if (bullet.y > this.canvasHeight + 20) {
        bullet.active = false
      }
    }
  }

  private spawn(riverSegments: { centerX: number; width: number; y: number }[], yOffset = 0): void {
    if (riverSegments.length === 0) return

    const topSegment = riverSegments[riverSegments.length - 1]

    const zone = this.gameTime < 35 ? 0 : this.gameTime < 90 ? 1 : 2
    const weights: [EnemyType, number][] = zone === 0
      ? [
          ['helicopter', 42],
          ['plane', 28],
          ['boat', 20],
          ['bridge', 10],
        ]
      : zone === 1
        ? [
            ['helicopter', 30],
            ['plane', 24],
            ['boat', 18],
            ['bridge', 10],
            ['tank', 10],
            ['gunboat', 8],
          ]
        : [
            ['helicopter', 24],
            ['plane', 20],
            ['boat', 14],
            ['bridge', 10],
            ['tank', 16],
            ['gunboat', 16],
          ]
    const roll = Math.random() * 100
    let cumulative = 0
    let type: EnemyType = 'helicopter'
    for (const [t, w] of weights) {
      cumulative += w
      if (roll < cumulative) {
        type = t
        break
      }
    }

    const config = ENEMY_CONFIGS[type]

    let x: number
    let width = config.width

    if (type === 'bridge') {
      x = topSegment.centerX
      width = Math.max(60, topSegment.width - 4)
    } else {
      const leftBound = topSegment.centerX - topSegment.width / 2 + config.width
      const rightBound = topSegment.centerX + topSegment.width / 2 - config.width
      x = leftBound + Math.random() * (rightBound - leftBound)
    }

    const enemy = this.enemyPool.acquire()

    if (type === 'helicopter') {
      Object.assign(enemy, {
        type: 'helicopter',
        x,
        y: ENEMY_SPAWN_Y + yOffset,
        width,
        height: config.height,
        speed: 80,
        active: true,
        points: config.points,
        canShoot: Math.random() < 0.5,
        shootCooldown: 1.0 + Math.random() * 2.0,
        shootInterval: 2.0 + Math.random(),
        originX: x,
        phase: Math.random() * Math.PI * 2,
        phaseSpeed: 2 + Math.random(),
        amplitude: 30 + Math.random() * 40,
      } as HelicopterEnemy)
      return
    }

    if (type === 'plane') {
      Object.assign(enemy, {
        type: 'plane',
        x,
        y: ENEMY_SPAWN_Y + yOffset,
        width,
        height: config.height,
        speed: 200,
        active: true,
        points: config.points,
        canShoot: Math.random() < 0.6,
        shootCooldown: 1.0 + Math.random() * 2.0,
        shootInterval: 0.6 + Math.random() * 0.4,
      } as PlaneEnemy)
      return
    }

    if (type === 'boat') {
      Object.assign(enemy, {
        type: 'boat',
        x,
        y: ENEMY_SPAWN_Y + yOffset,
        width,
        height: config.height,
        speed: 40,
        active: true,
        points: config.points,
        originX: x,
        phase: Math.random() * Math.PI * 2,
        phaseSpeed: 0.8 + Math.random() * 0.5,
        amplitude: 20 + Math.random() * 20,
      } as BoatEnemy)
      return
    }

    if (type === 'gunboat') {
      Object.assign(enemy, {
        type: 'gunboat',
        x,
        y: ENEMY_SPAWN_Y + yOffset,
        width,
        height: config.height,
        speed: 65,
        active: true,
        points: config.points,
        canShoot: Math.random() < 0.8,
        shootCooldown: 0.8 + Math.random() * 1.2,
        shootInterval: 1.0 + Math.random() * 0.5,
      } as GunboatEnemy)
      return
    }

    if (type === 'tank') {
      Object.assign(enemy, {
        type: 'tank',
        x,
        y: ENEMY_SPAWN_Y + yOffset,
        width,
        height: config.height,
        speed: 55,
        active: true,
        points: config.points,
      } as TankEnemy)
      return
    }

    Object.assign(enemy, {
      type: 'bridge',
      x,
      y: ENEMY_SPAWN_Y + yOffset,
      width,
      height: config.height,
      speed: 0,
      active: true,
      points: config.points,
    } as BridgeEnemy)
  }

  render(ctx: CanvasRenderingContext2D): void {
    this.renderer.render(ctx, this.enemies, this.bullets, this.gameTime)
  }

  reset(_canvasWidth: number, canvasHeight: number): void {
    this.canvasHeight = canvasHeight
    this.enemyPool.resetAll()
    this.bulletPool.resetAll()
    this.spawnTimer = 0
    this.spawnInterval = ENEMY_SPAWN_INTERVAL_START
    this.gameTime = 0
  }
}
