// ─── EnemyTypes.ts ───────────────────────────────────────────────────────────
// Tipos e catálogo dos inimigos.
//
// Separado do EnemyManager para quebrar o ciclo EnemyManager ↔ EnemyRenderer:
// o manager instancia o renderer, e o renderer precisava do catálogo — os dois
// se importavam em runtime. O EnemyManager reexporta tudo daqui, então os
// consumidores existentes continuam importando dele.

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
  nearMissRewarded?: boolean
}

/** Where the AI believes the player currently is. Enables aimed/leading fire. */
export interface AimTarget {
  x: number
  y: number
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
  /** Lateral velocity (px/s) — carries momentum so motion has weight. */
  vx?: number
  /** Self-propelled vertical velocity (px/s), on top of the river scroll. */
  vy?: number
  /** Per-enemy phase offset that desyncs shared wave-based movement. */
  moveSeed?: number
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

export const ENEMY_CONFIGS: Record<EnemyType, { width: number; height: number; points: number }> = {
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
