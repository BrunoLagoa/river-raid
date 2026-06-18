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
  ENEMY_ESCALATION_START, ENEMY_ESCALATION_FULL,
  ENEMY_ESCALATION_ELITE_SHIFT, ENEMY_ESCALATION_SHOOT_SPEEDUP,
} from './constants'
import { EnemyRenderer } from './EnemyRenderer'
import type { RandomSource } from './random'

export type EnemyType = 'helicopter' | 'plane' | 'boat' | 'bridge' | 'tank' | 'gunboat'
export type AiTier = 'basic' | 'smart' | 'elite'
export type EnemyBehaviorState = 'patrol' | 'recover' | 'reposition'
export type LaneIntent = -1 | 0 | 1

export interface EnemyBullet {
  x: number
  y: number
  /** Downward (vertical) speed in px/s. */
  speed: number
  /** Horizontal speed in px/s. Non-zero only for aimed shots from smart/elite enemies. */
  vx: number
  width: number
  height: number
  active: boolean
  fromPlane: boolean
}

/** Where the AI believes the player currently is. Enables aimed/leading fire. */
export interface AimTarget {
  x: number
  y: number
}

/** Structural shape shared by enemies that oscillate sinusoidally across the river. */
type OscillatingEnemy = BaseEnemy & {
  phase: number
  phaseSpeed: number
  amplitude: number
  originX: number
}

/** Per-frame steering context shared by all movement strategies of a single enemy. */
interface MovementContext {
  safe: { left: number; right: number; center: number; halfSpan: number }
  shouldUseRiverSteering: boolean
  isRecovering: boolean
  laneTargetX: number
  tierPhaseMult: number
  tierAmplitudeMult: number
  recoverStrafeFactor: number
  repositionSteerFactor: number
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
  bankRecoverTimer?: number
  bankRecoverCooldown?: number
  bankRecoverDir?: number
  aiState?: EnemyBehaviorState
  stateTimer?: number
  laneIntent?: LaneIntent
  laneCooldown?: number
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
  private static readonly AI_EDGE_SOFT_ZONE = 36
  private static readonly AI_CENTER_STEER_BASIC = 0.4
  private static readonly AI_CENTER_STEER_SMART = 1.2
  private static readonly AI_CENTER_STEER_ELITE = 1.8
  private static readonly AI_ORIGIN_RECENTER_BASIC = 0.9
  private static readonly AI_ORIGIN_RECENTER_SMART = 1.4
  private static readonly AI_ORIGIN_RECENTER_ELITE = 2.0
  private static readonly AI_ENEMY_BANK_MARGIN = 8
  private static readonly AI_BANK_HYSTERESIS = 5
  private static readonly AI_BANK_RECOVER_TIME = 0.2
  private static readonly AI_BANK_RECOVER_COOLDOWN = 0.16
  private static readonly AI_BANK_RECOVER_PUSH_BASIC = 46
  private static readonly AI_BANK_RECOVER_PUSH_SMART = 66
  private static readonly AI_BANK_RECOVER_PUSH_ELITE = 84
  private static readonly AI_RECOVER_STRAFE_DAMP = 0.25
  private static readonly SPAWN_CURVE_SAMPLE_STEPS = 22
  private static readonly SPAWN_CURVE_DRIFT_THRESHOLD = 28
  private static readonly SPAWN_NARROW_WIDTH_THRESHOLD = 170
  private static readonly SPAWN_AGGRESSIVE_WEIGHT_MULT = 0.62
  private static readonly SPAWN_MOVEMENT_AMPLITUDE_MULT = 0.72
  private static readonly AI_LANE_COOLDOWN_MIN = 0.45
  private static readonly AI_LANE_COOLDOWN_MAX = 0.95
  private static readonly AI_LANE_TARGET_RATIO = 0.48
  private static readonly AI_LANE_CENTER_BAND = 18
  private static readonly AI_LANE_NEARBY_Y = 70
  private static readonly AI_REPOSITION_TIME = 0.45
  private static readonly AI_REPOSITION_STEER_MULT = 1.35
  // Aimed fire: how far a bullet may slant horizontally relative to its fall
  // speed. Capped so shots always travel mostly downward and stay dodgeable.
  private static readonly AIM_MAX_RATIO = 0.7
  // Minimum vertical gap before an enemy bothers aiming (avoids wild angles
  // when the player is nearly level with the shooter).
  private static readonly AIM_MIN_DY = 24
  // Smoothing applied to the estimated player velocity used for elite lead.
  private static readonly AIM_TARGET_VX_SMOOTH = 0.6

  private random: RandomSource
  private canvasWidth: number
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
      bankRecoverTimer: 0,
      bankRecoverCooldown: 0,
      bankRecoverDir: 0,
      aiState: 'patrol',
      stateTimer: 0,
      laneIntent: 0,
      laneCooldown: 0,
    }),
    (enemy) => {
      enemy.active = true
    },
  )

  private bulletPool = new ObjectPool<EnemyBullet>(
    80,
    () => ({ x: 0, y: 0, speed: 0, vx: 0, width: 4, height: 8, active: false, fromPlane: false }),
    (bullet) => {
      bullet.active = true
      bullet.vx = 0
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
  // biome-driven config (set each frame by Game)
  private biomeEnemyWeights: Record<EnemyType, number> | null = null
  private biomeSpawnRateMult = 1.0
  private biomeTierBias: Record<AiTier, number> = { basic: 1, smart: 1, elite: 1 }
  // Player tracking for aimed fire — updated each frame from the target passed
  // by Game. Null until a target is seen; targetVx is a smoothed estimate.
  private lastTargetX: number | null = null
  private targetVx = 0

  constructor(canvasWidth: number, canvasHeight: number, random: RandomSource = Math.random) {
    this.canvasWidth = canvasWidth
    this.canvasHeight = canvasHeight
    this.random = random
  }

  setCanvasHeight(h: number): void {
    this.canvasHeight = h
  }

  /** Called each frame with the current EffectiveBiomeConfig values. */
  setEnemyBiomeConfig(
    enemyWeights: Record<EnemyType, number>,
    spawnRateMult: number,
    tierBias: Record<AiTier, number>,
  ): void {
    this.biomeEnemyWeights = enemyWeights
    this.biomeSpawnRateMult = spawnRateMult
    this.biomeTierBias = tierBias
  }

  update(
    dt: number,
    world: { getBoundsAtY: (y: number) => { left: number; right: number } },
    riverSegments: { centerX: number; width: number; y: number }[],
    scrollSpeed = 120,
    target?: AimTarget,
  ): void {
    this.gameTime += dt
    this.trackTarget(dt, target)

    this.spawnInterval = Math.max(
      ENEMY_SPAWN_INTERVAL_MIN,
      (1.2 - this.gameTime * ENEMY_SPAWN_INTERVAL_DECAY) / this.biomeSpawnRateMult,
    )

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
      enemy.bankRecoverCooldown = Math.max(0, (enemy.bankRecoverCooldown ?? 0) - dt)
      enemy.bankRecoverTimer = Math.max(0, (enemy.bankRecoverTimer ?? 0) - dt)

      const tierPhaseMult = this.getTierPhaseSpeedMult(enemy.aiTier)
      const tierAmplitudeMult = this.getTierAmplitudeMult(enemy.aiTier)
      const shouldUseRiverSteering = enemy.y > 0
      const halfWidth = enemy.width / 2
      const safe = this.getSafeBounds(world, enemy.y, halfWidth + EnemyManager.AI_ENEMY_BANK_MARGIN)
      const isRecovering = (enemy.bankRecoverTimer ?? 0) > 0

      enemy.stateTimer = Math.max(0, (enemy.stateTimer ?? 0) - dt)
      if ((enemy.aiState ?? 'patrol') === 'reposition' && (enemy.stateTimer ?? 0) <= 0) {
        enemy.aiState = 'patrol'
      }

      if (shouldUseRiverSteering && enemy.type !== 'bridge') {
        if (enemy.laneIntent === undefined) {
          enemy.laneIntent = this.resolveLaneFromX(enemy.x, safe)
        }
        enemy.laneCooldown = Math.max(0, (enemy.laneCooldown ?? 0) - dt)
        if ((enemy.laneCooldown ?? 0) <= 0) {
          const previousLane = enemy.laneIntent
          const nextLane = this.chooseLaneIntent(enemy, safe)
          enemy.laneIntent = nextLane
          enemy.laneCooldown = this.getNextLaneCooldown()
          if (previousLane !== undefined && previousLane !== nextLane && !isRecovering) {
            enemy.aiState = 'reposition'
            enemy.stateTimer = EnemyManager.AI_REPOSITION_TIME
          }
        }
      }

      if (shouldUseRiverSteering && enemy.type !== 'bridge') {
        const hitLeft = enemy.x <= safe.left + EnemyManager.AI_BANK_HYSTERESIS
        const hitRight = enemy.x >= safe.right - EnemyManager.AI_BANK_HYSTERESIS
        if ((enemy.bankRecoverCooldown ?? 0) <= 0 && (hitLeft || hitRight)) {
          enemy.bankRecoverTimer = EnemyManager.AI_BANK_RECOVER_TIME
          enemy.bankRecoverCooldown = EnemyManager.AI_BANK_RECOVER_COOLDOWN
          enemy.bankRecoverDir = hitLeft ? 1 : -1
          enemy.aiState = 'recover'
          enemy.stateTimer = EnemyManager.AI_BANK_RECOVER_TIME
        }

        if ((enemy.bankRecoverTimer ?? 0) > 0) {
          enemy.x += (enemy.bankRecoverDir ?? 0) * this.getTierRecoverPush(enemy.aiTier) * dt
        } else if ((enemy.aiState ?? 'patrol') === 'recover') {
          enemy.aiState = 'reposition'
          enemy.stateTimer = EnemyManager.AI_REPOSITION_TIME
        }
      }

      const ctx: MovementContext = {
        safe,
        shouldUseRiverSteering,
        isRecovering,
        laneTargetX: this.getLaneTargetX(enemy, safe),
        tierPhaseMult,
        tierAmplitudeMult,
        recoverStrafeFactor: isRecovering ? EnemyManager.AI_RECOVER_STRAFE_DAMP : 1,
        repositionSteerFactor: (enemy.aiState ?? 'patrol') === 'reposition'
          ? EnemyManager.AI_REPOSITION_STEER_MULT
          : 1,
      }

      // Oscillating types (and movement-capable gunboats) sway sinusoidally and
      // chase their lane anchor; strafing types (planes, static gunboats) drift
      // toward the player's lane. Each strategy lives in one place now.
      if (enemy.type === 'helicopter' || enemy.type === 'boat' || enemy.type === 'tank') {
        this.applyOscillatingMovement(enemy, dt, ctx)
      } else if (enemy.type === 'gunboat') {
        if (enemy.hasMovement) {
          this.applyOscillatingMovement(enemy, dt, ctx)
        } else {
          this.applyStrafeMovement(enemy, dt, ctx)
        }
      } else if (enemy.type === 'plane') {
        this.applyStrafeMovement(enemy, dt, ctx)
      }

      if (enemy.type !== 'bridge') {
        if (shouldUseRiverSteering) {
          enemy.x = this.clampToSafeBounds(enemy.x, safe)
        } else {
          const bounds = world.getBoundsAtY(enemy.y)
          enemy.x = Math.max(bounds.left + halfWidth + 2, Math.min(bounds.right - halfWidth - 2, enemy.x))
        }
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
            bullet.vx = this.computeAimVx(enemy, bullet.speed, target)
            bullet.width = enemy.type === 'plane' ? 5 : 4
            bullet.height = enemy.type === 'plane' ? 10 : 8
            bullet.fromPlane = enemy.type === 'plane'
            const tierInterval = this.getTierShootIntervalMult(enemy.aiTier)
            const tierRandom = this.getTierShootRandomMult(enemy.aiTier)
            // Late-game escalation tightens cadence on top of the tier multiplier.
            const escalationSpeedup = 1 - this.getEscalation() * ENEMY_ESCALATION_SHOOT_SPEEDUP
            enemy.shootCooldown = (enemy.shootInterval * tierInterval + this.random() * 0.3 * tierRandom) * escalationSpeedup
          }
        }
      }

      if (enemy.y > this.canvasHeight + ENEMY_OFFSCREEN_Y) {
        enemy.active = false
      }
    }

    for (const bullet of this.bullets) {
      bullet.x += bullet.vx * dt
      bullet.y += bullet.speed * dt
      if (bullet.y > this.canvasHeight + 20) {
        bullet.active = false
      }
    }
  }

  /** Updates the smoothed player-velocity estimate used for elite leading fire. */
  private trackTarget(dt: number, target?: AimTarget): void {
    if (!target) {
      this.lastTargetX = null
      this.targetVx = 0
      return
    }
    if (this.lastTargetX !== null && dt > 0) {
      const instantVx = (target.x - this.lastTargetX) / dt
      const s = EnemyManager.AIM_TARGET_VX_SMOOTH
      this.targetVx = this.targetVx * s + instantVx * (1 - s)
    }
    this.lastTargetX = target.x
  }

  /**
   * Sinusoidal sway with lane-anchored origin recentering, shared by
   * helicopters, boats, tanks and movement-capable gunboats.
   */
  private applyOscillatingMovement(enemy: OscillatingEnemy, dt: number, ctx: MovementContext): void {
    enemy.phase += enemy.phaseSpeed * ctx.tierPhaseMult * dt
    if (ctx.shouldUseRiverSteering) {
      const laneWeight = this.getTierLaneWeight(enemy.aiTier)
      const anchorX = ctx.isRecovering
        ? ctx.safe.center
        : ctx.safe.center + (ctx.laneTargetX - ctx.safe.center) * laneWeight
      const recenter = this.getTierOriginRecenter(enemy.aiTier) * (ctx.isRecovering ? 1.5 : ctx.repositionSteerFactor)
      enemy.originX += (anchorX - enemy.originX) * recenter * dt
      const effectiveAmplitude = Math.min(
        enemy.amplitude * ctx.tierAmplitudeMult * ctx.recoverStrafeFactor,
        Math.max(6, ctx.safe.halfSpan - 6),
      )
      const desiredX = enemy.originX + Math.sin(enemy.phase) * effectiveAmplitude
      enemy.x += (desiredX - enemy.x) * this.getTierCenterSteer(enemy.aiTier) * dt
    } else {
      enemy.x = enemy.originX + Math.sin(enemy.phase) * enemy.amplitude * ctx.tierAmplitudeMult
    }
  }

  /**
   * Edge-aware lateral strafe that drifts toward the player's lane, shared by
   * planes and static gunboats. Basic tier holds course (zero strafe speed).
   */
  private applyStrafeMovement(enemy: Enemy, dt: number, ctx: MovementContext): void {
    const strafeSpeed = enemy.aiTier === 'elite'
      ? ENEMY_TIER_ELITE_STRAFE_SPEED
      : enemy.aiTier === 'smart'
        ? ENEMY_TIER_SMART_STRAFE_SPEED
        : 0
    if (strafeSpeed === 0) return
    const strafeFreq = enemy.aiTier === 'elite' ? ENEMY_TIER_ELITE_STRAFE_FREQ : ENEMY_TIER_SMART_STRAFE_FREQ
    const wave = Math.sin(this.gameTime * strafeFreq + enemy.y * 0.01) * strafeSpeed
    if (ctx.shouldUseRiverSteering) {
      const nearestEdge = Math.min(enemy.x - ctx.safe.left, ctx.safe.right - enemy.x)
      const edgeFactor = Math.max(0, Math.min(1, nearestEdge / EnemyManager.AI_EDGE_SOFT_ZONE))
      enemy.x += wave * edgeFactor * ctx.recoverStrafeFactor * dt
      enemy.x += (ctx.laneTargetX - enemy.x) * this.getTierCenterSteer(enemy.aiTier) * ctx.repositionSteerFactor * dt
    } else {
      enemy.x += wave * dt
    }
  }

  /**
   * Horizontal bullet velocity for aimed fire. Basic tier never aims (returns 0);
   * smart aims at the player's current column, elite leads the player using the
   * smoothed velocity estimate. The slant is capped so shots stay dodgeable.
   */
  private computeAimVx(enemy: Enemy, bulletSpeed: number, target?: AimTarget): number {
    if (!target || enemy.aiTier === 'basic' || bulletSpeed <= 0) return 0
    const dy = target.y - enemy.y
    if (dy <= EnemyManager.AIM_MIN_DY) return 0
    const timeToReach = dy / bulletSpeed
    const lead = enemy.aiTier === 'elite' ? this.targetVx * timeToReach : 0
    const aimX = target.x + lead
    const desiredVx = (aimX - enemy.x) / timeToReach
    const maxVx = bulletSpeed * EnemyManager.AIM_MAX_RATIO
    return Math.max(-maxVx, Math.min(maxVx, desiredVx))
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

  private getTierCenterSteer(tier: AiTier): number {
    if (tier === 'smart') return EnemyManager.AI_CENTER_STEER_SMART
    if (tier === 'elite') return EnemyManager.AI_CENTER_STEER_ELITE
    return EnemyManager.AI_CENTER_STEER_BASIC
  }

  private getTierOriginRecenter(tier: AiTier): number {
    if (tier === 'smart') return EnemyManager.AI_ORIGIN_RECENTER_SMART
    if (tier === 'elite') return EnemyManager.AI_ORIGIN_RECENTER_ELITE
    return EnemyManager.AI_ORIGIN_RECENTER_BASIC
  }

  private getTierRecoverPush(tier: AiTier): number {
    if (tier === 'smart') return EnemyManager.AI_BANK_RECOVER_PUSH_SMART
    if (tier === 'elite') return EnemyManager.AI_BANK_RECOVER_PUSH_ELITE
    return EnemyManager.AI_BANK_RECOVER_PUSH_BASIC
  }

  private getTierLaneWeight(tier: AiTier): number {
    if (tier === 'smart') return 0.42
    if (tier === 'elite') return 0.58
    return 0.24
  }

  private getNextLaneCooldown(): number {
    return EnemyManager.AI_LANE_COOLDOWN_MIN + this.random() * (EnemyManager.AI_LANE_COOLDOWN_MAX - EnemyManager.AI_LANE_COOLDOWN_MIN)
  }

  private resolveLaneFromX(x: number, safe: { left: number; right: number; center: number }): LaneIntent {
    if (x < safe.center - EnemyManager.AI_LANE_CENTER_BAND) return -1
    if (x > safe.center + EnemyManager.AI_LANE_CENTER_BAND) return 1
    return 0
  }

  private getLaneTargetX(enemy: Enemy, safe: { left: number; right: number; center: number; halfSpan: number }): number {
    const lane = enemy.laneIntent ?? 0
    const target = safe.center + lane * safe.halfSpan * EnemyManager.AI_LANE_TARGET_RATIO
    return this.clampToSafeBounds(target, safe)
  }

  private chooseLaneIntent(enemy: Enemy, safe: { left: number; right: number; center: number }): LaneIntent {
    const lanes: LaneIntent[] = [-1, 0, 1]
    const counts = new Map<LaneIntent, number>([
      [-1, 0],
      [0, 0],
      [1, 0],
    ])

    for (const other of this.enemies) {
      if (other === enemy || !other.active || other.type === 'bridge') continue
      if (Math.abs(other.y - enemy.y) > EnemyManager.AI_LANE_NEARBY_Y) continue
      const lane = this.resolveLaneFromX(other.x, safe)
      counts.set(lane, (counts.get(lane) as number) + 1)
    }

    if (enemy.x < safe.left + 24) counts.set(-1, (counts.get(-1) as number) + 2)
    if (enemy.x > safe.right - 24) counts.set(1, (counts.get(1) as number) + 2)

    let best = Number.POSITIVE_INFINITY
    for (const lane of lanes) {
      best = Math.min(best, counts.get(lane) as number)
    }
    const candidates = lanes.filter((lane) => (counts.get(lane) as number) === best)
    return candidates[Math.floor(this.random() * candidates.length)]
  }

  private getSafeBounds(
    world: { getBoundsAtY: (y: number) => { left: number; right: number } },
    y: number,
    padding: number,
  ): { left: number; right: number; center: number; halfSpan: number } {
    const bounds = world.getBoundsAtY(y)
    const left = bounds.left + padding
    const right = bounds.right - padding
    if (right <= left) {
      const center = (bounds.left + bounds.right) / 2
      return { left: center, right: center, center, halfSpan: 0 }
    }
    return {
      left,
      right,
      center: (left + right) / 2,
      halfSpan: (right - left) / 2,
    }
  }

  private clampToSafeBounds(x: number, safe: { left: number; right: number }): number {
    return Math.max(safe.left, Math.min(safe.right, x))
  }

  /**
   * Long-game escalation factor in [0, 1]: 0 until ENEMY_ESCALATION_START, then
   * ramps linearly to 1 at ENEMY_ESCALATION_FULL. Drives the late-game pressure
   * (more elites, faster fire) that keeps difficulty climbing past the early
   * ramps' saturation point.
   */
  private getEscalation(): number {
    const span = ENEMY_ESCALATION_FULL - ENEMY_ESCALATION_START
    if (span <= 0) return this.gameTime >= ENEMY_ESCALATION_FULL ? 1 : 0
    return Math.max(0, Math.min(1, (this.gameTime - ENEMY_ESCALATION_START) / span))
  }

  private resolveAiTier(type: EnemyType): AiTier {
    // Base probabilities by game time
    let basicW: number, smartW: number, eliteW: number
    if (this.gameTime < 40) {
      basicW = 1; smartW = 0; eliteW = 0
    } else if (this.gameTime < 100) {
      if (type === 'plane' || type === 'gunboat') {
        basicW = 0; smartW = 1; eliteW = 0
      } else {
        basicW = 0.65; smartW = 0.35; eliteW = 0
      }
    } else {
      // Late game: the elite share keeps growing with escalation so veteran runs
      // face progressively smarter (aiming/leading) enemies instead of a plateau.
      const eliteShift = this.getEscalation() * ENEMY_ESCALATION_ELITE_SHIFT
      basicW = 0
      if (type === 'plane' || type === 'gunboat') {
        eliteW = Math.min(1, 0.5 + eliteShift)
      } else {
        eliteW = Math.min(1, 0.25 + eliteShift)
      }
      smartW = 1 - eliteW
    }

    // Apply biome tier bias
    basicW *= this.biomeTierBias.basic
    smartW *= this.biomeTierBias.smart
    eliteW *= this.biomeTierBias.elite

    const total = basicW + smartW + eliteW
    if (total === 0) return 'basic'
    const roll = this.random() * total
    if (roll < basicW) return 'basic'
    if (roll < basicW + smartW) return 'smart'
    return 'elite'
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
    const spawnRisk = this.getSpawnRisk(riverSegments)

    // Use biome weights when available, otherwise fall back to time-based zones
    let baseWeights: [EnemyType, number][]
    if (this.biomeEnemyWeights) {
      baseWeights = Object.entries(this.biomeEnemyWeights) as [EnemyType, number][]
    } else {
      const zone = this.gameTime < 35 ? 0 : this.gameTime < 90 ? 1 : 2
      baseWeights = zone === 0
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
    }
    const weights = baseWeights

    const adjustedWeights: [EnemyType, number][] = weights.map(([t, w]) => {
      if (spawnRisk.high && (t === 'plane' || t === 'gunboat')) {
        return [t, w * EnemyManager.SPAWN_AGGRESSIVE_WEIGHT_MULT]
      }
      return [t, w]
    })
    const totalWeight = adjustedWeights.reduce((acc, [, w]) => acc + w, 0)

    let type: EnemyType = 'helicopter'
    for (let i = 0; i < ENEMY_SPAWN_MAX_POSITION_TRIES; i++) {
      const roll = this.random() * totalWeight
      let cumulative = 0
      type = 'helicopter'
      for (const [t, w] of adjustedWeights) {
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
      /* v8 ignore next */
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
    const movementAmplitudeMult = spawnRisk.high ? EnemyManager.SPAWN_MOVEMENT_AMPLITUDE_MULT : 1
    const segBounds = {
      left: topSegment.centerX - topSegment.width / 2,
      right: topSegment.centerX + topSegment.width / 2,
      center: topSegment.centerX,
    }

    // NOTE: the order of this.random() calls below is load-bearing — seeded runs
    // must stay reproducible. baseFields() consumes exactly one random (lane
    // cooldown); keep it at the same position it occupied in the old literals.
    if (type === 'helicopter') {
      Object.assign(enemy, this.baseFields(type, x, y, width, config, 80, aiTier, segBounds), {
        canShoot: this.random() < 0.5,
        shootCooldown: 1.0 + this.random() * 2.0,
        shootInterval: (2.0 + this.random()) * this.getTierShootIntervalMult(aiTier),
        originX: x,
        phase: this.random() * Math.PI * 2,
        phaseSpeed: 2 + this.random(),
        amplitude: (30 + this.random() * 40) * movementAmplitudeMult,
      } as Partial<HelicopterEnemy>)
      return true
    }

    if (type === 'plane') {
      Object.assign(enemy, this.baseFields(type, x, y, width, config, 200, aiTier, segBounds), {
        canShoot: this.random() < 0.6,
        shootCooldown: 1.0 + this.random() * 2.0,
        shootInterval: (0.6 + this.random() * 0.4) * this.getTierShootIntervalMult(aiTier),
      } as Partial<PlaneEnemy>)
      return true
    }

    if (type === 'boat') {
      Object.assign(enemy, this.baseFields(type, x, y, width, config, 40, aiTier, segBounds), {
        originX: x,
        phase: this.random() * Math.PI * 2,
        phaseSpeed: 0.8 + this.random() * 0.5,
        amplitude: (20 + this.random() * 20) * movementAmplitudeMult,
      } as Partial<BoatEnemy>)
      return true
    }

    if (type === 'gunboat') {
      const hasMovement = this.random() < 0.5
      Object.assign(enemy, this.baseFields(type, x, y, width, config, 70, aiTier, segBounds), {
        canShoot: this.random() < 0.8,
        shootCooldown: 0.8 + this.random() * 1.2,
        shootInterval: (1.0 + this.random() * 0.5) * this.getTierShootIntervalMult(aiTier),
        hasMovement,
        originX: x,
        phase: this.random() * Math.PI * 2,
        phaseSpeed: 2 + this.random(),
        amplitude: hasMovement ? (20 + this.random() * 20) * movementAmplitudeMult : 0,
      } as Partial<GunboatEnemy>)
      return true
    }

    if (type === 'tank') {
      Object.assign(enemy, this.baseFields(type, x, y, width, config, 55, aiTier, segBounds), {
        canShoot: this.random() < 0.5,
        shootCooldown: 1.0 + this.random() * 2.0,
        shootInterval: (2.0 + this.random()) * this.getTierShootIntervalMult(aiTier),
        originX: x,
        phase: this.random() * Math.PI * 2,
        phaseSpeed: 2 + this.random(),
        amplitude: (30 + this.random() * 40) * movementAmplitudeMult,
      } as Partial<TankEnemy>)
      return true
    }

    Object.assign(enemy, this.baseFields(type, x, y, width, config, 0, aiTier, segBounds))
    return true
  }

  /**
   * Common fields every enemy shares at spawn. Consumes exactly one random()
   * (the lane cooldown), so callers must invoke it at the original RNG position.
   */
  private baseFields(
    type: EnemyType,
    x: number,
    y: number,
    width: number,
    config: { height: number; points: number },
    speed: number,
    aiTier: AiTier,
    segBounds: { left: number; right: number; center: number },
  ): Partial<Enemy> {
    return {
      type,
      aiTier,
      x,
      y,
      width,
      height: config.height,
      speed,
      active: true,
      points: config.points,
      bankRecoverTimer: 0,
      bankRecoverCooldown: 0,
      bankRecoverDir: 0,
      aiState: 'patrol',
      stateTimer: 0,
      laneIntent: this.resolveLaneFromX(x, segBounds),
      laneCooldown: this.getNextLaneCooldown(),
    } as Partial<Enemy>
  }

  private getSpawnRisk(riverSegments: { centerX: number; width: number; y: number }[]): { high: boolean } {
    if (riverSegments.length === 0) return { high: false }
    const topIdx = riverSegments.length - 1
    const sampleIdx = Math.max(0, topIdx - EnemyManager.SPAWN_CURVE_SAMPLE_STEPS)
    const top = riverSegments[topIdx]
    const sample = riverSegments[sampleIdx]
    const centerDrift = Math.abs(top.centerX - sample.centerX)
    const narrow = top.width <= Math.min(EnemyManager.SPAWN_NARROW_WIDTH_THRESHOLD, this.canvasWidth * 0.38)
    const highCurve = centerDrift >= EnemyManager.SPAWN_CURVE_DRIFT_THRESHOLD
    return { high: narrow || highCurve }
  }

  render(ctx: CanvasRenderingContext2D, colorblind = false): void {
    this.renderer.render(ctx, this.enemies, this.bullets, this.gameTime, colorblind)
  }

  reset(canvasWidth: number, canvasHeight: number): void {
    this.canvasWidth = canvasWidth
    this.canvasHeight = canvasHeight
    this.enemyPool.resetAll()
    this.bulletPool.resetAll()
    this.spawnTimer = 0
    this.spawnInterval = ENEMY_SPAWN_INTERVAL_START
    this.gameTime = 0
    this.lastTargetX = null
    this.targetVx = 0
  }
}
