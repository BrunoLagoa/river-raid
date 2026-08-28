export const PLAYER_WIDTH = 28
export const PLAYER_HEIGHT = 32
export const PLAYER_SPEED = 300
export const PLAYER_VERTICAL_SPEED = 240
// Vertical travel limits (ship can move forward/back within these bounds).
export const PLAYER_MIN_Y_RATIO = 0.32        // highest point: 32% from the top
export const PLAYER_MAX_Y_MARGIN = 40         // lowest point: this many px from the bottom
export const PLAYER_SHOOT_INTERVAL = 0.18
export const PLAYER_MAX_BULLETS = 20
export const PLAYER_BULLET_SPEED = 500
export const PLAYER_BULLET_W = 3
export const PLAYER_BULLET_H = 12
export const PLAYER_EXPLODING_DURATION = 1.2
export const PLAYER_RESPAWN_Y_OFFSET = 80
export const PLAYER_INVINCIBILITY_TIME = 2.5
export const PLAYER_SHIELD_BREAK_INVINCIBILITY = 1.5
export const PLAYER_DOUBLE_SHOT_DURATION = 10.0
export const PLAYER_DOUBLE_SHOT_SPREAD = 8
export const PLAYER_DOUBLE_SHOT_SPEED_MULTIPLIER = 1.5

export const BASE_SCROLL_SPEED = 120
export const MAX_SCROLL_SPEED = 200
export const SCROLL_ACCEL = 0.4
export const SPEED_MOD_FAST = 1.4
export const SPEED_MOD_SLOW = 0.4

export const COMBO_LEVEL_2 = 5
export const COMBO_LEVEL_3 = 12
export const COMBO_LEVEL_4 = 25
export const COMBO_TIMER = 6.0
export const COMBO_ANIM_UP = 1.0
export const COMBO_ANIM_DOWN = 0.5
export const COMBO_SHOT_PENALTY = 0.3

export const FUEL_INITIAL = 100
export const FUEL_MAX = 100
export const FUEL_DRAIN_RATE = 5
export const FUEL_DRAIN_SPEED_FACTOR = 0.012
export const FUEL_LOW_THRESHOLD = 20
export const FUEL_LOW_FLASH_INTERVAL = 0.8
export const FUEL_PICKUP_AMOUNT = 30
export const FUEL_RESPAWN_MIN = 30
export const FUEL_SPAWN_INTERVAL = 6.0
export const FUEL_TANK_W = 28
export const FUEL_TANK_H = 52

export const POWERUP_DROP_CHANCE = 0.08
export const POWERUP_SIZE = 16
export const POWERUP_DOUBLE_SHOT_DURATION = 10.0
export const POWERUP_SCORE = 100
export const SLOW_MOTION_DURATION = 5.0
export const SLOW_MOTION_FACTOR = 0.5
export const POWERUP_RAPID_FIRE_DURATION = 8.0
export const POWERUP_RAPID_FIRE_COOLDOWN_MULTIPLIER = 0.4
export const POWERUP_MAGNET_FUEL_DURATION = 8.0
export const POWERUP_MAGNET_FUEL_SPEED = 180
export const POWERUP_BOMB_SHOCKWAVE_DURATION = 0.35

export const DEFAULT_LIVES = 3
export const GAME_OVER_DELAY = 1200
export const RESPAWN_DELAY = 1300
export const HIGH_SCORE_KEY = 'river-raid-highscore'

// Loop / frame
export const DT_CLAMP_MAX = 0.05

// Pixels of river scroll per displayed "meter" of distance
export const DISTANCE_PX_PER_METER = 12

// Smoke trail (player exhaust)
export const SMOKE_TRAIL_SPAWN_CHANCE = 0.5
export const SMOKE_TRAIL_FAST_SPEED_MOD = 1.2
export const SMOKE_TRAIL_SLOW_SPEED_MOD = 0.6

// Bomb shockwave render
export const SHOCKWAVE_MAX_RADIUS_RATIO = 0.85
export const SHOCKWAVE_BASE_ALPHA = 0.55

// Drop chance when a bridge is destroyed
export const BRIDGE_FUEL_DROP_CHANCE = 0.5

// Achievement thresholds
export const ACHIEVEMENT_SHARPSHOOTER_KILLS = 50
export const ACHIEVEMENT_POWER_COLLECTOR_COUNT = 10
export const ACHIEVEMENT_FUEL_SAVER_SECONDS = 60
export const ACHIEVEMENT_FUEL_SAVER_FUEL_PCT = 75
export const ACHIEVEMENT_SURVIVOR_SCORE = 10000
export const ACHIEVEMENT_HIGH_FLYER_SCORE = 50000
export const ACHIEVEMENT_COMBO_MASTER_MULT = 4

// Difficulty presets — scale spawn pressure and fuel drain.
// 'normal' keeps the original balance (all multipliers 1.0) so existing
// behaviour/tests are unchanged; easy/hard adjust around it.
export type Difficulty = 'easy' | 'normal' | 'hard'
export interface DifficultyPreset {
  enemySpawnRateMult: number
  fuelDrainMult: number
}
export const DIFFICULTY_PRESETS: Record<Difficulty, DifficultyPreset> = {
  easy: { enemySpawnRateMult: 0.75, fuelDrainMult: 0.8 },
  normal: { enemySpawnRateMult: 1.0, fuelDrainMult: 1.0 },
  hard: { enemySpawnRateMult: 1.35, fuelDrainMult: 1.25 },
}
export function isDifficulty(v: unknown): v is Difficulty {
  return v === 'easy' || v === 'normal' || v === 'hard'
}

export const ENEMY_SPAWN_DUAL_TIME = 10
export const ENEMY_SPAWN_TRIPLE_TIME = 30
export const ENEMY_SPAWN_QUAD_TIME = 60
export const ENEMY_SPAWN_DUAL_CHANCE = 0.5
export const ENEMY_SPAWN_TRIPLE_CHANCE = 0.4
export const ENEMY_SPAWN_QUAD_CHANCE = 0.3
export const ENEMY_SPAWN_INTERVAL_START = 1.5
export const ENEMY_SPAWN_INTERVAL_MIN = 0.25
export const ENEMY_SPAWN_INTERVAL_DECAY = 0.008
export const ENEMY_SPAWN_Y = -20
export const ENEMY_OFFSCREEN_Y = 50
/** Default enemy shell size; planes fire the larger variant. */
export const ENEMY_BULLET_WIDTH = 4
export const ENEMY_BULLET_HEIGHT = 8
export const ENEMY_BULLET_PLANE_WIDTH = 5
export const ENEMY_BULLET_PLANE_HEIGHT = 10

export const ENEMY_ACTIVE_CAP_BASE = 10
export const ENEMY_ACTIVE_CAP_GROWTH_PER_SECOND = 0.08
export const ENEMY_ACTIVE_CAP_MAX = 22

export const ENEMY_MAX_HELICOPTERS_ACTIVE = 7
export const ENEMY_MAX_PLANES_ACTIVE = 6
export const ENEMY_MAX_BOATS_ACTIVE = 6
export const ENEMY_MAX_BRIDGES_ACTIVE = 1
export const ENEMY_MAX_TANKS_ACTIVE = 4
export const ENEMY_MAX_GUNBOATS_ACTIVE = 4

export const ENEMY_SPAWN_MAX_PER_CYCLE_BASE = 1
export const ENEMY_SPAWN_MAX_PER_CYCLE_GROWTH_PER_SECOND = 0.02
export const ENEMY_SPAWN_MAX_PER_CYCLE_MAX = 3

export const ENEMY_SPAWN_MIN_Y_GAP = 70
export const ENEMY_SPAWN_MIN_X_GAP = 20
export const ENEMY_SPAWN_MAX_POSITION_TRIES = 8

export const ENEMY_TIER_BASIC_SHOOT_INTERVAL_MULT = 1.0
export const ENEMY_TIER_SMART_SHOOT_INTERVAL_MULT = 0.88
export const ENEMY_TIER_ELITE_SHOOT_INTERVAL_MULT = 0.72

export const ENEMY_TIER_BASIC_BULLET_SPEED_MULT = 1.0
export const ENEMY_TIER_SMART_BULLET_SPEED_MULT = 1.08
export const ENEMY_TIER_ELITE_BULLET_SPEED_MULT = 1.18

export const ENEMY_TIER_BASIC_SHOOT_RANDOM_MULT = 1.0
export const ENEMY_TIER_SMART_SHOOT_RANDOM_MULT = 0.7
export const ENEMY_TIER_ELITE_SHOOT_RANDOM_MULT = 0.4

export const ENEMY_TIER_BASIC_PHASE_SPEED_MULT = 1.0
export const ENEMY_TIER_SMART_PHASE_SPEED_MULT = 1.15
export const ENEMY_TIER_ELITE_PHASE_SPEED_MULT = 1.3

export const ENEMY_TIER_BASIC_AMPLITUDE_MULT = 1.0
export const ENEMY_TIER_SMART_AMPLITUDE_MULT = 1.1
export const ENEMY_TIER_ELITE_AMPLITUDE_MULT = 1.2

export const ENEMY_TIER_SMART_STRAFE_SPEED = 18
export const ENEMY_TIER_ELITE_STRAFE_SPEED = 30
export const ENEMY_TIER_SMART_STRAFE_FREQ = 1.8
export const ENEMY_TIER_ELITE_STRAFE_FREQ = 2.4

// AI tier unlock schedule. Before SMART, every enemy is 'basic' (dumb straight
// fire). From SMART on, 'smart' aimers appear; from ELITE on, 'elite' leaders
// appear and the long-game escalation (below) takes over.
export const ENEMY_TIER_SMART_UNLOCK_TIME = 30  // s — warm-up ends, aimers appear
export const ENEMY_TIER_ELITE_UNLOCK_TIME = 80  // s — leaders appear, escalation begins

// Long-game escalation. The early-game ramps (spawn rate, active cap, tier
// unlocks) all saturate by ~100s; without this the difficulty would plateau.
// Escalation grows linearly from 0 at START to 1 at FULL and keeps the late
// game climbing — soft-capped so it never becomes impossible.
export const ENEMY_ESCALATION_START = 80       // s — when escalation begins (= elite unlock)
export const ENEMY_ESCALATION_FULL = 360       // s — when escalation maxes out
// At full escalation, shift this much weight from 'smart' to 'elite' so veteran
// runs face progressively more aiming/leading enemies.
export const ENEMY_ESCALATION_ELITE_SHIFT = 0.5
// At full escalation, enemies fire up to this fraction faster (cadence speedup).
export const ENEMY_ESCALATION_SHOOT_SPEEDUP = 0.18

export const EXTRA_LIFE_SCORE_INTERVAL = 10000
export const NEAR_MISS_DISTANCE = 40
export const NEAR_MISS_POINTS = 10
export const NEAR_MISS_COOLDOWN = 0.3

// Weather system particle limits & timing
export const WEATHER_MAX_RAIN_DROPS = 80
export const WEATHER_MAX_SNOW_FLAKES = 60
export const WEATHER_MAX_SAND_GRAINS = 70
export const WEATHER_MAX_SMOG_PUFFS = 40
export const WEATHER_LIGHTNING_FLASH_DURATION = 0.08
export const WEATHER_LIGHTNING_INTERVAL_MIN = 6.0
export const WEATHER_LIGHTNING_INTERVAL_MAX = 14.0

// Dynamic lighting parameters
export const LIGHTING_HEADLIGHT_ANGLE = 0.52
export const LIGHTING_HEADLIGHT_RANGE = 260
export const LIGHTING_NIGHT_ALPHA = 0.65
export const LIGHTING_DAWN_ALPHA = 0.35
export const LIGHTING_SUNSET_ALPHA = 0.20
export const LIGHTING_BULLET_RADIUS = 32
export const LIGHTING_EXPLOSION_RADIUS = 80

// Overdrive Super Weapon System
export const OVERDRIVE_MAX = 100
export const OVERDRIVE_KILL_GAIN = 4
export const OVERDRIVE_NEAR_MISS_GAIN = 12
export const OVERDRIVE_DURATION = 6.0
/** Beam damage per SECOND (dt-scaled) — frame-rate independent. */
export const OVERDRIVE_LASER_DPS = 90
/** Full beam width in px; the hitbox and the rendered beam share it. */
export const OVERDRIVE_LASER_WIDTH = 24

// Boss Battles System
export const BOSS_SPAWN_INTERVAL = 90
export const BOSS_DREADNOUGHT_HP = 160
export const BOSS_TURRET_HP = 35
export const BOSS_TURRET_SHOOT_INTERVAL = 1.4
export const BOSS_CORE_SHOOT_INTERVAL = 1.8
export const BOSS_POINTS = 5000
export const BOSS_WIDTH = 110
export const BOSS_HEIGHT = 160
export const BOSS_TURRET_SCORE = 500
/** Player bullet damage against a turret / against the bare hull. */
export const BOSS_TURRET_BULLET_DAMAGE = 10
export const BOSS_HULL_BULLET_DAMAGE = 8
/** Share of a turret's HP that also comes off the hull pool when it blows. */
export const BOSS_TURRET_HULL_DAMAGE_RATIO = 0.7
/** Hull integrity below this ratio flips the boss into its berserk phase. */
export const BOSS_PHASE3_HEALTH_RATIO = 0.25
export const BOSS_ENTRY_SPEED = 120
export const BOSS_ENTRY_TARGET_Y = 120
export const BOSS_STRAFE_SPEED = 45
export const BOSS_STRAFE_SPEED_BERSERK = 75
export const BOSS_STRAFE_RATE = 1.4
export const BOSS_STRAFE_RATE_BERSERK = 2.2
export const BOSS_STRAFE_MARGIN = 10
export const BOSS_TURRET_BULLET_SPEED = 240
/** Fraction of the shell speed that becomes horizontal lead when aiming. */
export const BOSS_TURRET_AIM_FACTOR = 0.55
export const BOSS_CORE_BULLET_SPEED = 260
export const BOSS_CORE_BURST_VX = [-45, 0, 45]
export const BOSS_CORE_BERSERK_INTERVAL_MULT = 0.55
export const BOSS_DEATH_EXPLOSION_TIME = 2.4
export const BOSS_DAMAGE_FLASH_TIME = 0.12
/** River scroll is cut to this fraction (floored) while a boss is fighting. */
export const BOSS_FIGHT_SCROLL_FACTOR = 0.96
export const BOSS_FIGHT_MIN_SCROLL_SPEED = 60

