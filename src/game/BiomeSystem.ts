// ─── BiomeSystem.ts ──────────────────────────────────────────────────────────
// Manages biome progression along the river.
// Each biome defines a base colour palette, enemy mix, scenery weights, and
// river geometry parameters.  The system interpolates between biomes during
// fade transitions and exposes a single `EffectiveBiomeConfig` snapshot that
// all downstream systems consume each frame.
//
// Architecture: push model — BiomeSystem is the single source of truth.
// Downstream systems (Atmosphere, World, Scenery, EnemyManager) receive the
// pre-interpolated config and treat it as a static snapshot; they do NOT
// perform their own lerp.
//
// Determinism: BiomeSystem is time-driven only and contains no RandomSource.
// Given the same accumulated dt sequence it always produces the same config.

import type { PaletteRaw } from './Atmosphere'
import { lerpPaletteRaw } from './Atmosphere'

// ─── Public types ─────────────────────────────────────────────────────────────

export type BiomeId = 'forest' | 'desert' | 'industrial'

export type EnemyType = 'helicopter' | 'plane' | 'boat' | 'gunboat' | 'tank' | 'bridge'
export type SceneryType = 'palm' | 'tree' | 'house' | 'bush' | 'rock' | 'fueltank'
export type AiTier = 'basic' | 'smart' | 'elite'

export interface EffectiveBiomeConfig {
  // Identification
  fromBiomeId: BiomeId
  toBiomeId: BiomeId
  /** 0 = fully `from`, 1 = fully `to`. Is 0 during hold. */
  blend: number
  inTransition: boolean

  // For Atmosphere — already interpolated
  basePalette: PaletteRaw

  // For EnemyManager — already interpolated
  enemyWeights: Record<EnemyType, number>
  enemySpawnRateMult: number
  enemyTierBias: Record<AiTier, number>

  // For Scenery — already interpolated
  sceneryWeights: Record<SceneryType, number>

  // For World — already interpolated
  riverMinWidth: number
  riverMaxWidthRatio: number
}

// ─── Internal biome definition ────────────────────────────────────────────────

interface BiomeDefinition {
  id: BiomeId
  basePalette: PaletteRaw
  enemyWeights: Record<EnemyType, number>
  enemySpawnRateMult: number
  enemyTierBias: Record<AiTier, number>
  sceneryWeights: Record<SceneryType, number>
  riverMinWidth: number
  riverMaxWidthRatio: number
}

// ─── Timing constants ─────────────────────────────────────────────────────────

/** Total duration of each biome cycle in seconds */
export const BIOME_DURATION = 120
/** Duration of the cross-fade between biomes in seconds */
export const BIOME_FADE_DURATION = 10
/** Hold phase duration = total - fade */
const HOLD_DURATION = BIOME_DURATION - BIOME_FADE_DURATION

// ─── Biome definitions ────────────────────────────────────────────────────────

const BIOMES: BiomeDefinition[] = [
  // ── Forest ─────────────────────────────────────────────────────────────────
  {
    id: 'forest',
    basePalette: {
      landBase:       [26,  92,  26],
      landEdgeDark:   [15,  74,  15],
      landEdgeBright: [42,  90, 170],
      waterBase:      [26,  58, 138],
      waterFlow:      [42,  85, 170],
      waterWave:      [120, 180, 255, 0.08],
      waterDepth:     [0,   10,  40, 0.15],
      shimmer:        [100, 160, 255, 0.08],
      brightness: 1.0,
    },
    enemyWeights: {
      helicopter: 30, plane: 20, boat: 20, gunboat: 15, tank: 10, bridge: 5,
    },
    enemySpawnRateMult: 1.0,
    enemyTierBias: { basic: 1.0, smart: 1.0, elite: 1.0 },
    sceneryWeights: {
      palm: 25, tree: 35, house: 5, bush: 25, rock: 5, fueltank: 5,
    },
    riverMinWidth: 100,
    riverMaxWidthRatio: 0.72,
  },

  // ── Desert ─────────────────────────────────────────────────────────────────
  {
    id: 'desert',
    basePalette: {
      landBase:       [180, 140,  70],
      landEdgeDark:   [130,  95,  40],
      landEdgeBright: [220, 180, 110],
      waterBase:      [40,  120, 130],
      waterFlow:      [70,  150, 160],
      waterWave:      [180, 220, 220, 0.08],
      waterDepth:     [10,   30,  35, 0.15],
      shimmer:        [200, 220, 200, 0.10],
      brightness: 1.1,
    },
    enemyWeights: {
      helicopter: 20, plane: 20, boat: 10, gunboat: 15, tank: 25, bridge: 10,
    },
    enemySpawnRateMult: 1.0,
    enemyTierBias: { basic: 0.9, smart: 1.1, elite: 1.0 },
    sceneryWeights: {
      palm: 5, tree: 0, house: 8, bush: 15, rock: 60, fueltank: 12,
    },
    riverMinWidth: 110,
    riverMaxWidthRatio: 0.78,
  },

  // ── Industrial ─────────────────────────────────────────────────────────────
  {
    id: 'industrial',
    basePalette: {
      landBase:       [60,   65,  70],
      landEdgeDark:   [35,   38,  42],
      landEdgeBright: [110, 110, 120],
      waterBase:      [30,   40,  45],
      waterFlow:      [50,   60,  70],
      waterWave:      [100, 110, 120, 0.07],
      waterDepth:     [5,     8,  12, 0.20],
      shimmer:        [140, 145, 160, 0.06],
      brightness: 0.85,
    },
    enemyWeights: {
      helicopter: 15, plane: 15, boat: 5, gunboat: 20, tank: 30, bridge: 15,
    },
    enemySpawnRateMult: 0.85,
    enemyTierBias: { basic: 0.7, smart: 1.2, elite: 1.4 },
    sceneryWeights: {
      palm: 0, tree: 5, house: 50, bush: 10, rock: 25, fueltank: 10,
    },
    riverMinWidth: 80,
    riverMaxWidthRatio: 0.60,
  },
]

const BIOME_ORDER: BiomeId[] = ['forest', 'desert', 'industrial']

// ─── Helpers ──────────────────────────────────────────────────────────────────

function lerpN(a: number, b: number, t: number): number {
  return a + (b - a) * t
}

function smoothstep(t: number): number {
  return t * t * (3 - 2 * t)
}


function lerpWeights<K extends string>(
  a: Record<K, number>,
  b: Record<K, number>,
  t: number,
): Record<K, number> {
  const result = {} as Record<K, number>
  for (const key in a) {
    result[key as K] = lerpN(a[key as K], b[key as K], t)
  }
  return result
}

function biomeById(id: BiomeId): BiomeDefinition {
  return BIOMES.find(b => b.id === id)!
}

function nextBiomeId(id: BiomeId): BiomeId {
  const idx = BIOME_ORDER.indexOf(id)
  return BIOME_ORDER[(idx + 1) % BIOME_ORDER.length]
}

function makeConfig(from: BiomeDefinition, to: BiomeDefinition, blend: number, inTransition: boolean): EffectiveBiomeConfig {
  const t = blend
  return {
    fromBiomeId:        from.id,
    toBiomeId:          to.id,
    blend,
    inTransition,
    basePalette:        lerpPaletteRaw(from.basePalette,       to.basePalette,       t),
    enemyWeights:       lerpWeights(from.enemyWeights,         to.enemyWeights,       t),
    enemySpawnRateMult: lerpN(from.enemySpawnRateMult,         to.enemySpawnRateMult, t),
    enemyTierBias:      lerpWeights(from.enemyTierBias,        to.enemyTierBias,      t),
    sceneryWeights:     lerpWeights(from.sceneryWeights,       to.sceneryWeights,     t),
    riverMinWidth:      lerpN(from.riverMinWidth,              to.riverMinWidth,      t),
    riverMaxWidthRatio: lerpN(from.riverMaxWidthRatio,         to.riverMaxWidthRatio, t),
  }
}

// ─── BiomeSystem class ────────────────────────────────────────────────────────

type BiomePhase = 'hold' | 'transition'

export class BiomeSystem {
  private phase: BiomePhase = 'hold'
  private currentId: BiomeId = 'forest'
  private elapsed = 0          // time within current hold or transition
  private config: EffectiveBiomeConfig

  constructor() {
    const from = biomeById('forest')
    this.config = makeConfig(from, from, 0, false)
  }

  // ── Update ───────────────────────────────────────────────────────────────────

  update(dt: number): void {
    if (!Number.isFinite(dt) || dt <= 0) return

    // Process dt in slices — handles large dt values spanning multiple phases.
    let remaining = dt
    const MAX_ITERATIONS = 64   // safety cap

    for (let i = 0; i < MAX_ITERATIONS && remaining > 0; i++) {
      if (this.phase === 'hold') {
        const available = HOLD_DURATION - this.elapsed
        if (remaining < available) {
          // Stay in hold
          this.elapsed += remaining
          remaining = 0
        } else {
          // Consume to end of hold, start transition
          remaining -= available
          this.elapsed = 0
          this.phase = 'transition'
        }
      } else {
        // transition
        const available = BIOME_FADE_DURATION - this.elapsed
        if (remaining < available) {
          // Stay in transition — update blend
          this.elapsed += remaining
          remaining = 0
          const t = Math.min(this.elapsed / BIOME_FADE_DURATION, 1)
          const blend = smoothstep(t)
          const from = biomeById(this.currentId)
          const to   = biomeById(nextBiomeId(this.currentId))
          this.config = makeConfig(from, to, blend, true)
        } else {
          // Consume to end of transition, advance biome
          remaining -= available
          this.currentId = nextBiomeId(this.currentId)
          this.elapsed = 0
          this.phase = 'hold'
          const next = biomeById(this.currentId)
          this.config = makeConfig(next, next, 0, false)
        }
      }
    }

    // Final snapshot if still in transition (remaining was consumed above)
    if (this.phase === 'transition') {
      const t = Math.min(this.elapsed / BIOME_FADE_DURATION, 1)
      const blend = smoothstep(t)
      const from = biomeById(this.currentId)
      const to   = biomeById(nextBiomeId(this.currentId))
      this.config = makeConfig(from, to, blend, true)
    } else if (this.phase === 'hold' && remaining === 0) {
      // Refresh hold config (covers the case where we just entered hold)
      const cur = biomeById(this.currentId)
      this.config = makeConfig(cur, cur, 0, false)
    }
  }

  // ── Accessors ────────────────────────────────────────────────────────────────

  getConfig(): EffectiveBiomeConfig {
    return this.config
  }

  getCurrentBiomeId(): BiomeId {
    return this.currentId
  }

  /** Seconds elapsed within the current hold phase (0 during transition). */
  getTimeInBiome(): number {
    return this.phase === 'hold' ? this.elapsed : 0
  }

  /** Seconds until the next transition begins (0 during transition). */
  getTimeUntilTransition(): number {
    return this.phase === 'hold' ? Math.max(0, HOLD_DURATION - this.elapsed) : 0
  }

  // ── Lifecycle ────────────────────────────────────────────────────────────────

  reset(): void {
    this.phase = 'hold'
    this.currentId = 'forest'
    this.elapsed = 0
    const from = biomeById('forest')
    this.config = makeConfig(from, from, 0, false)
  }
}
