import {
  BULLET_STYLES, BULLET_OUTLINE, BULLET_OUTLINE_STRONG,
  type BulletKind,
} from './BulletStyles'
import type { Bullet } from './Player'

const KIND_ORDER: BulletKind[] = ['normal', 'rapid', 'double', 'overcharge']

/** Trail segments drawn behind each bullet, as (offset, height, alpha) steps. */
const TRAIL_STEPS = [
  { offset: 0, heightRatio: 0.9, alpha: 1.0 },
  { offset: 0.9, heightRatio: 0.6, alpha: 0.55 },
  { offset: 1.5, heightRatio: 0.35, alpha: 0.25 },
]

/**
 * Draws player bullets grouped by kind so `fillStyle` changes stay bounded
 * (4 kinds instead of one switch per bullet), mirroring how EnemyRenderer
 * batches its own passes.
 */
export class BulletRenderer {
  private reducedMotion = false
  private colorblind = false

  setReducedMotion(enabled: boolean): void {
    this.reducedMotion = enabled
  }

  setColorblind(enabled: boolean): void {
    this.colorblind = enabled
  }

  render(ctx: CanvasRenderingContext2D, bullets: Bullet[], time = performance.now() / 1000): void {
    if (bullets.length === 0) return

    ctx.save()

    // Pass 1 — dark halo under every bullet, one fillStyle for the whole set.
    ctx.fillStyle = this.colorblind ? BULLET_OUTLINE_STRONG : BULLET_OUTLINE
    for (const b of bullets) {
      if (!b.active) continue
      const s = BULLET_STYLES[b.kind]
      ctx.fillRect(b.x - s.width / 2 - 1, b.y - 1, s.width + 2, s.height + 2)
    }

    // Pass 2 — body, core and trail, batched per kind.
    for (const kind of KIND_ORDER) {
      const style = BULLET_STYLES[kind]

      if (!this.reducedMotion) {
        ctx.fillStyle = style.trail
        for (const b of bullets) {
          if (!b.active || b.kind !== kind) continue
          for (const step of TRAIL_STEPS) {
            ctx.globalAlpha = step.alpha
            ctx.fillRect(
              b.x - style.width / 2,
              b.y + style.height + step.offset * style.height,
              style.width,
              style.height * step.heightRatio,
            )
          }
        }
        ctx.globalAlpha = 1
      }

      // Overcharge breathes so the strongest state stands out even in a
      // crowded frame; held steady when reduced motion is on.
      const pulse = style.pulses && !this.reducedMotion
        ? 0.82 + 0.18 * Math.sin(time * 14)
        : 1

      ctx.globalAlpha = pulse
      ctx.fillStyle = style.body
      for (const b of bullets) {
        if (!b.active || b.kind !== kind) continue
        ctx.fillRect(b.x - style.width / 2, b.y, style.width, style.height)
      }

      ctx.globalAlpha = 1
      ctx.fillStyle = style.core
      const coreW = Math.max(1, style.width - 2)
      for (const b of bullets) {
        if (!b.active || b.kind !== kind) continue
        if (style.notched) {
          // Two core segments with a gap — a greyscale-readable silhouette.
          ctx.fillRect(b.x - coreW / 2, b.y + 1, coreW, style.height * 0.32)
          ctx.fillRect(b.x - coreW / 2, b.y + style.height * 0.55, coreW, style.height * 0.3)
        } else {
          ctx.fillRect(b.x - coreW / 2, b.y, coreW, style.height * 0.6)
        }
      }
    }

    ctx.restore()
  }
}
