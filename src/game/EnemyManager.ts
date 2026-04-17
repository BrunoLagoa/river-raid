import { ObjectPool } from './ObjectPool'
import {
  ENEMY_SPAWN_INTERVAL_START, ENEMY_SPAWN_INTERVAL_MIN, ENEMY_SPAWN_INTERVAL_DECAY,
  ENEMY_SPAWN_DUAL_TIME, ENEMY_SPAWN_TRIPLE_TIME, ENEMY_SPAWN_QUAD_TIME,
  ENEMY_SPAWN_DUAL_CHANCE, ENEMY_SPAWN_TRIPLE_CHANCE, ENEMY_SPAWN_QUAD_CHANCE,
  ENEMY_SPAWN_Y, ENEMY_OFFSCREEN_Y,
  ENEMY_ACTIVE_CAP_BASE, ENEMY_ACTIVE_CAP_GROWTH_PER_SECOND, ENEMY_ACTIVE_CAP_MAX,
  ENEMY_MAX_HELICOPTERS_ACTIVE, ENEMY_MAX_PLANES_ACTIVE, ENEMY_MAX_BOATS_ACTIVE,
  ENEMY_MAX_BRIDGES_ACTIVE, ENEMY_MAX_TANKS_ACTIVE, ENEMY_MAX_GUNBOATS_ACTIVE,
  ENEMY_SPAWN_MAX_PER_CYCLE_BASE, ENEMY_SPAWN_MAX_PER_CYCLE_GROWTH_PER_SECOND,
  ENEMY_SPAWN_MAX_PER_CYCLE_MAX, ENEMY_SPAWN_MIN_Y_GAP, ENEMY_SPAWN_MIN_X_GAP,
  ENEMY_SPAWN_MAX_POSITION_TRIES,
  ENEMY_TIER_BASIC_SHOOT_INTERVAL_MULT, ENEMY_TIER_SMART_SHOOT_INTERVAL_MULT,
  ENEMY_TIER_ELITE_SHOOT_INTERVAL_MULT, ENEMY_TIER_BASIC_BULLET_SPEED_MULT,
  ENEMY_TIER_SMART_BULLET_SPEED_MULT, ENEMY_TIER_ELITE_BULLET_SPEED_MULT,
  ENEMY_TIER_BASIC_SHOOT_RANDOM_MULT, ENEMY_TIER_SMART_SHOOT_RANDOM_MULT,
  ENEMY_TIER_ELITE_SHOOT_RANDOM_MULT, ENEMY_TIER_BASIC_PHASE_SPEED_MULT,
  ENEMY_TIER_SMART_PHASE_SPEED_MULT, ENEMY_TIER_ELITE_PHASE_SPEED_MULT,
  ENEMY_TIER_BASIC_AMPLITUDE_MULT, ENEMY_TIER_SMART_AMPLITUDE_MULT,
  ENEMY_TIER_ELITE_AMPLITUDE_MULT, ENEMY_TIER_SMART_STRAFE_SPEED,
  ENEMY_TIER_ELITE_STRAFE_SPEED, ENEMY_TIER_SMART_STRAFE_FREQ,
  ENEMY_TIER_ELITE_STRAFE_FREQ,
} from './constants'
import { EnemyRenderer } from './EnemyRenderer'
import type { RandomSource } from './random'

export type EnemyType = 'helicopter' | 'plane' | 'boat' | 'bridge' | 'tank' | 'gunboat'
export type AiTier = 'basic' | 'smart' | 'elite'

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
  aiTier: AiTier
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
  canShoot: boolean
  shootCooldown: number
  shootInterval: number
  originX: number
  phase: number
  phaseSpeed: number
  amplitude: number
}

export interface GunboatEnemy extends BaseEnemy {
  type: 'gunboat'
  canShoot: boolean
  shootCooldown: number
  shootInterval: number
  hasMovement: boolean
  originX: number
  phase: number
  phaseSpeed: number
  amplitude: number
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
  private random: RandomSource
  private enemyPool = new ObjectPool<Enemy>(
    60,
    () => ({
      type: 'bridge',
      aiTier: 'basic',
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

  get activeEnemyCount(): number {
    return this.enemies.length
  }

  get activeBulletCount(): number {
    return this.bullets.length
  }

  private renderer = new EnemyRenderer()
  private spawnTimer = 0
  private spawnInterval = ENEMY_SPAWN_INTERVAL_START
  private gameTime = 0
  private canvasHeight: number

  constructor(_canvasWidth: number, canvasHeight: number, random: RandomSource = Math.random) {
    this.canvasHeight = canvasHeight
    this.random = random
  }

  setCanvasHeight(h: number): void {
    this.canvasHeight = h
  }

  update(dt: number, world: { getBoundsAtY: (y: number) => { left: number; right: number } }, riverSegments: { centerX: number; width: number; y: number }[], scrollSpeed = 120): void {
    this.gameTime += dt

    this.spawnInterval = Math.max(ENEMY_SPAWN_INTERVAL_MIN, 1.2 - this.gameTime * ENEMY_SPAWN_INTERVAL_DECAY)

    this.spawnTimer -= dt
    if (this.spawnTimer <= 0) {
      const spawnRequests: number[] = [0]
      if (this.gameTime > ENEMY_SPAWN_DUAL_TIME && this.random() < ENEMY_SPAWN_DUAL_CHANCE) {
        spawnRequests.push(-60)
      }
      if (this.gameTime > ENEMY_SPAWN_TRIPLE_TIME && this.random() < ENEMY_SPAWN_TRIPLE_CHANCE) {
        spawnRequests.push(-120)
      }
      if (this.gameTime > ENEMY_SPAWN_QUAD_TIME && this.random() < ENEMY_SPAWN_QUAD_CHANCE) {
        spawnRequests.push(-180)
      }

      const maxPerCycle = this.getMaxSpawnsPerCycle()
      let spawned = 0
      for (const yOffset of spawnRequests) {
        if (spawned >= maxPerCycle) break
        if (!this.canSpawnAnyMore()) break
        if (this.spawn(riverSegments, yOffset)) {
          spawned++
        }
      }

      this.spawnTimer = this.spawnInterval
    }

    for (const enemy of this.enemies) {
      enemy.y += scrollSpeed * dt * (enemy.type === 'bridge' ? 1 : 0.3)

      const tierPhaseMult = this.getTierPhaseSpeedMult(enemy.aiTier)
      const tierAmplitudeMult = this.getTierAmplitudeMult(enemy.aiTier)

      if (enemy.type === 'helicopter') {
        enemy.phase += enemy.phaseSpeed * tierPhaseMult * dt
        enemy.x = enemy.originX + Math.sin(enemy.phase) * enemy.amplitude * tierAmplitudeMult
      }

      if (enemy.type === 'boat') {
        enemy.phase += enemy.phaseSpeed * tierPhaseMult * dt
        enemy.x = enemy.originX + Math.sin(enemy.phase) * enemy.amplitude * tierAmplitudeMult
      }

      if (enemy.type === 'tank') {
        enemy.phase += enemy.phaseSpeed * tierPhaseMult * dt
        enemy.x = enemy.originX + Math.sin(enemy.phase) * enemy.amplitude * tierAmplitudeMult
      }

      if (enemy.type === 'gunboat') {
        if (enemy.hasMovement) {
          enemy.phase += enemy.phaseSpeed * tierPhaseMult * dt
          enemy.x = enemy.originX + Math.sin(enemy.phase) * enemy.amplitude * tierAmplitudeMult
        } else {
          const strafeSpeed = enemy.aiTier === 'elite'
            ? ENEMY_TIER_ELITE_STRAFE_SPEED
            : enemy.aiTier === 'smart'
              ? ENEMY_TIER_SMART_STRAFE_SPEED
              : 0
          const strafeFreq = enemy.aiTier === 'elite'
            ? ENEMY_TIER_ELITE_STRAFE_FREQ
            : enemy.aiTier === 'smart'
              ? ENEMY_TIER_SMART_STRAFE_FREQ
              : 0
          if (strafeSpeed > 0) {
            enemy.x += Math.sin(this.gameTime * strafeFreq + enemy.y * 0.01) * strafeSpeed * dt
          }
        }
      }

      if (enemy.type === 'plane') {
        const strafeSpeed = enemy.aiTier === 'elite'
          ? ENEMY_TIER_ELITE_STRAFE_SPEED
          : enemy.aiTier === 'smart'
            ? ENEMY_TIER_SMART_STRAFE_SPEED
            : 0
        const strafeFreq = enemy.aiTier === 'elite'
          ? ENEMY_TIER_ELITE_STRAFE_FREQ
          : enemy.aiTier === 'smart'
            ? ENEMY_TIER_SMART_STRAFE_FREQ
            : 0
        if (strafeSpeed > 0) {
          enemy.x += Math.sin(this.gameTime * strafeFreq + enemy.y * 0.01) * strafeSpeed * dt
        }
      }

      if (enemy.type !== 'bridge') {
        const bounds = world.getBoundsAtY(enemy.y)
        const hw = enemy.width / 2
        enemy.x = Math.max(bounds.left + hw + 2, Math.min(bounds.right - hw - 2, enemy.x))
      }

      if (enemy.type === 'helicopter' || enemy.type === 'plane' || enemy.type === 'gunboat' || enemy.type === 'tank') {
        if (enemy.canShoot && enemy.y > 0) {
          enemy.shootCooldown -= dt
          if (enemy.shootCooldown <= 0) {
            const bullet = this.bulletPool.acquire()
            const baseBulletSpeed = enemy.type === 'plane' ? 350 + this.gameTime * 0.8 : enemy.type === 'gunboat' ? 260 + this.gameTime * 0.5 : enemy.type === 'tank' ? 200 + this.gameTime * 0.4 : 220 + this.gameTime * 0.4
            const tierBulletSpeed = this.getTierBulletSpeedMult(enemy.aiTier)
            bullet.x = enemy.x
            bullet.y = enemy.y + enemy.height / 2
            bullet.speed = baseBulletSpeed * tierBulletSpeed
            bullet.width = enemy.type === 'plane' ? 5 : 4
            bullet.height = enemy.type === 'plane' ? 10 : 8
            bullet.fromPlane = enemy.type === 'plane'
            const tierInterval = this.getTierShootIntervalMult(enemy.aiTier)
            const tierRandom = this.getTierShootRandomMult(enemy.aiTier)
            enemy.shootCooldown = enemy.shootInterval * tierInterval + this.random() * 0.3 * tierRandom
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

  private canSpawnAnyMore(): boolean {
    return this.enemies.length < this.getActiveEnemyCap()
  }

  private getActiveEnemyCap(): number {
    const cap = ENEMY_ACTIVE_CAP_BASE + this.gameTime * ENEMY_ACTIVE_CAP_GROWTH_PER_SECOND
    return Math.min(ENEMY_ACTIVE_CAP_MAX, Math.floor(cap))
  }

  private getMaxSpawnsPerCycle(): number {
    const maxSpawns = ENEMY_SPAWN_MAX_PER_CYCLE_BASE + this.gameTime * ENEMY_SPAWN_MAX_PER_CYCLE_GROWTH_PER_SECOND
    return Math.min(ENEMY_SPAWN_MAX_PER_CYCLE_MAX, Math.max(1, Math.floor(maxSpawns)))
  }

  private countByType(type: EnemyType): number {
    let total = 0
    for (const enemy of this.enemies) {
      if (enemy.type === type) total++
    }
    return total
  }

  private getTypeCap(type: EnemyType): number {
    if (type === 'helicopter') return ENEMY_MAX_HELICOPTERS_ACTIVE
    if (type === 'plane') return ENEMY_MAX_PLANES_ACTIVE
    if (type === 'boat') return ENEMY_MAX_BOATS_ACTIVE
    if (type === 'bridge') return ENEMY_MAX_BRIDGES_ACTIVE
    if (type === 'tank') return ENEMY_MAX_TANKS_ACTIVE
    return ENEMY_MAX_GUNBOATS_ACTIVE
  }

  private getTierShootIntervalMult(tier: AiTier): number {
    if (tier === 'smart') return ENEMY_TIER_SMART_SHOOT_INTERVAL_MULT
    if (tier === 'elite') return ENEMY_TIER_ELITE_SHOOT_INTERVAL_MULT
    return ENEMY_TIER_BASIC_SHOOT_INTERVAL_MULT
  }

  private getTierBulletSpeedMult(tier: AiTier): number {
    if (tier === 'smart') return ENEMY_TIER_SMART_BULLET_SPEED_MULT
    if (tier === 'elite') return ENEMY_TIER_ELITE_BULLET_SPEED_MULT
    return ENEMY_TIER_BASIC_BULLET_SPEED_MULT
  }

  private getTierShootRandomMult(tier: AiTier): number {
    if (tier === 'smart') return ENEMY_TIER_SMART_SHOOT_RANDOM_MULT
    if (tier === 'elite') return ENEMY_TIER_ELITE_SHOOT_RANDOM_MULT
    return ENEMY_TIER_BASIC_SHOOT_RANDOM_MULT
  }

  private getTierPhaseSpeedMult(tier: AiTier): number {
    if (tier === 'smart') return ENEMY_TIER_SMART_PHASE_SPEED_MULT
    if (tier === 'elite') return ENEMY_TIER_ELITE_PHASE_SPEED_MULT
    return ENEMY_TIER_BASIC_PHASE_SPEED_MULT
  }

  private getTierAmplitudeMult(tier: AiTier): number {
    if (tier === 'smart') return ENEMY_TIER_SMART_AMPLITUDE_MULT
    if (tier === 'elite') return ENEMY_TIER_ELITE_AMPLITUDE_MULT
    return ENEMY_TIER_BASIC_AMPLITUDE_MULT
  }

  private resolveAiTier(type: EnemyType): AiTier {
    if (this.gameTime < 40) return 'basic'
    if (this.gameTime < 100) {
      if (type === 'plane' || type === 'gunboat') return 'smart'
      return this.random() < 0.35 ? 'smart' : 'basic'
    }
    if (type === 'plane' || type === 'gunboat') return this.random() < 0.5 ? 'elite' : 'smart'
    return this.random() < 0.25 ? 'elite' : 'smart'
  }

  private hasSpawnSpace(type: EnemyType, x: number, y: number, width: number): boolean {
    for (const enemy of this.enemies) {
      if (enemy.type !== type) continue
      const dy = Math.abs(enemy.y - y)
      if (dy >= ENEMY_SPAWN_MIN_Y_GAP) continue

      const minXGap = ENEMY_SPAWN_MIN_X_GAP + (enemy.width + width) / 2
      if (Math.abs(enemy.x - x) < minXGap) {
        return false
      }
    }
    return true
  }

  private spawn(riverSegments: { centerX: number; width: number; y: number }[], yOffset = 0): boolean {
    if (riverSegments.length === 0) return false
    if (!this.canSpawnAnyMore()) return false

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

    let type: EnemyType = 'helicopter'
    for (let i = 0; i < ENEMY_SPAWN_MAX_POSITION_TRIES; i++) {
      const roll = this.random() * 100
      let cumulative = 0
      type = 'helicopter'
      for (const [t, w] of weights) {
        cumulative += w
        if (roll < cumulative) {
          type = t
          break
        }
      }
      if (this.countByType(type) < this.getTypeCap(type)) break
    }

    if (this.countByType(type) >= this.getTypeCap(type)) return false

    const config = ENEMY_CONFIGS[type]
    let x = topSegment.centerX
    let width = config.width
    const y = ENEMY_SPAWN_Y + yOffset

    if (type === 'bridge') {
      width = Math.max(60, topSegment.width - 4)
      if (!this.hasSpawnSpace(type, x, y, width)) return false
    } else {
      const leftBound = topSegment.centerX - topSegment.width / 2 + config.width
      const rightBound = topSegment.centerX + topSegment.width / 2 - config.width
      let found = false
      for (let i = 0; i < ENEMY_SPAWN_MAX_POSITION_TRIES; i++) {
        x = leftBound + this.random() * (rightBound - leftBound)
        if (this.hasSpawnSpace(type, x, y, width)) {
          found = true
          break
        }
      }
      if (!found) return false
    }

    const aiTier = this.resolveAiTier(type)
    const enemy = this.enemyPool.acquire()

    if (type === 'helicopter') {
      Object.assign(enemy, {
        type: 'helicopter',
        aiTier,
        x,
        y,
        width,
        height: config.height,
        speed: 80,
        active: true,
        points: config.points,
        canShoot: this.random() < 0.5,
        shootCooldown: 1.0 + this.random() * 2.0,
        shootInterval: (2.0 + this.random()) * this.getTierShootIntervalMult(aiTier),
        originX: x,
        phase: this.random() * Math.PI * 2,
        phaseSpeed: 2 + this.random(),
        amplitude: 30 + this.random() * 40,
      } as HelicopterEnemy)
      return true
    }

    if (type === 'plane') {
      Object.assign(enemy, {
        type: 'plane',
        aiTier,
        x,
        y,
        width,
        height: config.height,
        speed: 200,
        active: true,
        points: config.points,
        canShoot: this.random() < 0.6,
        shootCooldown: 1.0 + this.random() * 2.0,
        shootInterval: (0.6 + this.random() * 0.4) * this.getTierShootIntervalMult(aiTier),
      } as PlaneEnemy)
      return true
    }

    if (type === 'boat') {
      Object.assign(enemy, {
        type: 'boat',
        aiTier,
        x,
        y,
        width,
        height: config.height,
        speed: 40,
        active: true,
        points: config.points,
        originX: x,
        phase: this.random() * Math.PI * 2,
        phaseSpeed: 0.8 + this.random() * 0.5,
        amplitude: 20 + this.random() * 20,
      } as BoatEnemy)
      return true
    }

    if (type === 'gunboat') {
      const hasMovement = this.random() < 0.5
      Object.assign(enemy, {
        type: 'gunboat',
        aiTier,
        x,
        y,
        width,
        height: config.height,
        speed: 70,
        active: true,
        points: config.points,
        canShoot: this.random() < 0.8,
        shootCooldown: 0.8 + this.random() * 1.2,
        shootInterval: (1.0 + this.random() * 0.5) * this.getTierShootIntervalMult(aiTier),
        hasMovement,
        originX: x,
        phase: this.random() * Math.PI * 2,
        phaseSpeed: 2 + this.random(),
        amplitude: hasMovement ? 20 + this.random() * 20 : 0,
      } as GunboatEnemy)
      return true
    }

    if (type === 'tank') {
      Object.assign(enemy, {
        type: 'tank',
        aiTier,
        x,
        y,
        width,
        height: config.height,
        speed: 55,
        active: true,
        points: config.points,
        canShoot: this.random() < 0.5,
        shootCooldown: 1.0 + this.random() * 2.0,
        shootInterval: (2.0 + this.random()) * this.getTierShootIntervalMult(aiTier),
        originX: x,
        phase: this.random() * Math.PI * 2,
        phaseSpeed: 2 + this.random(),
        amplitude: 30 + this.random() * 40,
      } as TankEnemy)
      return true
    }

    Object.assign(enemy, {
      type: 'bridge',
      aiTier,
      x,
      y,
      width,
      height: config.height,
      speed: 0,
      active: true,
      points: config.points,
    } as BridgeEnemy)
    return true
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
