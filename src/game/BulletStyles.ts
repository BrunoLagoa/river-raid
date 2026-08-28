import { PLAYER_BULLET_W, PLAYER_BULLET_H } from './constants'

/**
 * Visual state of a player bullet, derived from which fire power-ups were
 * active at the moment it left the ship. The kind is frozen on spawn so a
 * bullet keeps its identity even if the power-up expires mid-flight.
 */
export type BulletKind = 'normal' | 'rapid' | 'double' | 'overcharge'

/**
 * Projétil do jogador. Fica aqui, e não no Player, para que o BulletRenderer
 * possa tipá-lo sem importar o Player de volta (o ciclo que isso fechava fazia
 * o checker resolver o módulo como tipo-erro).
 */
export interface Bullet {
  x: number
  y: number
  speed: number
  width: number
  height: number
  active: boolean
  /** Visual state, frozen at spawn from the fire power-ups then active. */
  kind: BulletKind
}

export interface BulletStyle {
  /** Dominant hue — what the player reads at a glance. */
  body: string
  /** Bright inner core drawn over the body. */
  core: string
  /** Fading tail behind the bullet (rgba so it composites over any biome). */
  trail: string
  width: number
  height: number
  /**
   * Splits the core into two segments with a gap. A silhouette cue that
   * survives greyscale, so the strongest shot stays distinguishable without
   * relying on hue alone.
   */
  notched: boolean
  /** Overcharge-only brightness pulse; suppressed under reduced motion. */
  pulses: boolean
}

/**
 * Palette chosen to avoid the enemy bullet hues (#ff4444 ground, #cc44ff
 * plane) and the fuel green, so incoming and outgoing fire never read alike.
 * Sizes double as a colourblind cue: short/dense for rapid, thin/long for
 * double, wide/notched for overcharge.
 */
export const BULLET_STYLES: Record<BulletKind, BulletStyle> = {
  normal: {
    body: '#ffd23f',
    core: '#fff6c9',
    trail: 'rgba(255, 210, 63, 0.30)',
    width: PLAYER_BULLET_W,
    height: PLAYER_BULLET_H,
    notched: false,
    pulses: false,
  },
  rapid: {
    body: '#ff7a1a',
    core: '#ffd7a0',
    trail: 'rgba(255, 122, 26, 0.32)',
    width: 3,
    height: 8,
    notched: false,
    pulses: false,
  },
  double: {
    body: '#35e0ff',
    core: '#eaffff',
    trail: 'rgba(53, 224, 255, 0.30)',
    width: 2,
    height: 14,
    notched: false,
    pulses: false,
  },
  overcharge: {
    body: '#b6ff3d',
    core: '#f2ffd0',
    trail: 'rgba(182, 255, 61, 0.34)',
    width: 4,
    height: 14,
    notched: true,
    pulses: true,
  },
}

/**
 * Dark halo drawn under every bullet. Without it the bright cores wash out
 * over the snow biome, whose water and terrain are both near-white.
 */
export const BULLET_OUTLINE = 'rgba(6, 10, 18, 0.55)'
/** Stronger halo used in colourblind mode, where contrast carries more load. */
export const BULLET_OUTLINE_STRONG = 'rgba(4, 7, 13, 0.85)'

/** Map the active fire power-up timers to the bullet's visual state. */
export function resolveBulletKind(doubleShotTimer: number, rapidFireTimer: number): BulletKind {
  const double = doubleShotTimer > 0
  const rapid = rapidFireTimer > 0
  if (double && rapid) return 'overcharge'
  if (double) return 'double'
  if (rapid) return 'rapid'
  return 'normal'
}
