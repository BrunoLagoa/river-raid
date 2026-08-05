import { describe, it, expect, vi } from 'vitest'
import { BulletRenderer } from './BulletRenderer'
import { BULLET_STYLES, BULLET_OUTLINE, BULLET_OUTLINE_STRONG, type BulletKind } from './BulletStyles'
import { createMockContext2D } from './test-helpers/canvas'
import type { Bullet } from './Player'

interface DrawCall { style: string; x: number; y: number; w: number; h: number }

/** Mock context that records the fillStyle active at each fillRect. */
function createRecordingContext(): { ctx: CanvasRenderingContext2D; calls: DrawCall[] } {
  const ctx = createMockContext2D()
  const calls: DrawCall[] = []
  ctx.fillRect = vi.fn((x: number, y: number, w: number, h: number) => {
    // The renderer only ever assigns string fills, so this is always a colour.
    calls.push({ style: ctx.fillStyle as string, x, y, w, h })
  })
  return { ctx, calls }
}

function makeBullet(kind: BulletKind, x = 100, y = 200): Bullet {
  return { x, y, speed: 500, width: 3, height: 12, active: true, kind }
}

const stylesUsed = (calls: DrawCall[]): Set<string> => new Set(calls.map((c) => c.style))

describe('BulletRenderer', () => {
  it('nao desenha nada sem balas', () => {
    const { ctx, calls } = createRecordingContext()
    new BulletRenderer().render(ctx, [], 0)
    expect(calls).toHaveLength(0)
  })

  it('ignora balas inativas', () => {
    const { ctx, calls } = createRecordingContext()
    const bullet = makeBullet('normal')
    bullet.active = false
    new BulletRenderer().render(ctx, [bullet], 0)
    expect(calls).toHaveLength(0)
  })

  it.each<BulletKind>(['normal', 'rapid', 'double', 'overcharge'])(
    'desenha contorno, corpo e nucleo na cor do estado %s',
    (kind) => {
      const { ctx, calls } = createRecordingContext()
      new BulletRenderer().render(ctx, [makeBullet(kind)], 0)

      const styles = stylesUsed(calls)
      expect(styles).toContain(BULLET_OUTLINE)
      expect(styles).toContain(BULLET_STYLES[kind].body)
      expect(styles).toContain(BULLET_STYLES[kind].core)
    },
  )

  it('usa as dimensoes do estilo, nao as da hitbox', () => {
    const { ctx, calls } = createRecordingContext()
    // Hitbox stays 3x12 for every kind; only the drawing changes.
    new BulletRenderer().render(ctx, [makeBullet('double')], 0)

    const body = calls.find((c) => c.style === BULLET_STYLES.double.body)
    expect(body).toBeDefined()
    expect(body!.w).toBe(BULLET_STYLES.double.width)
    expect(body!.h).toBe(BULLET_STYLES.double.height)
  })

  it('desenha o rastro por padrao e o suprime com reduced motion', () => {
    const { ctx: normalCtx, calls: withTrail } = createRecordingContext()
    new BulletRenderer().render(normalCtx, [makeBullet('normal')], 0)
    expect(stylesUsed(withTrail)).toContain(BULLET_STYLES.normal.trail)

    const { ctx: reducedCtx, calls: withoutTrail } = createRecordingContext()
    const renderer = new BulletRenderer()
    renderer.setReducedMotion(true)
    renderer.render(reducedCtx, [makeBullet('normal')], 0)
    expect(stylesUsed(withoutTrail)).not.toContain(BULLET_STYLES.normal.trail)
  })

  it('reduced motion mantem o pulso do overcharge em alpha cheio', () => {
    const { ctx, calls } = createRecordingContext()
    const renderer = new BulletRenderer()
    renderer.setReducedMotion(true)
    // A time where the pulse would otherwise be at its dimmest.
    renderer.render(ctx, [makeBullet('overcharge')], Math.PI / (2 * 14) * 3)
    expect(calls.some((c) => c.style === BULLET_STYLES.overcharge.body)).toBe(true)
    expect(ctx.globalAlpha).toBe(1)
  })

  it('modo daltonico reforca o contorno', () => {
    const { ctx, calls } = createRecordingContext()
    const renderer = new BulletRenderer()
    renderer.setColorblind(true)
    renderer.render(ctx, [makeBullet('normal')], 0)

    const styles = stylesUsed(calls)
    expect(styles).toContain(BULLET_OUTLINE_STRONG)
    expect(styles).not.toContain(BULLET_OUTLINE)
  })

  it('overcharge desenha o nucleo em dois segmentos', () => {
    const { ctx, calls } = createRecordingContext()
    new BulletRenderer().render(ctx, [makeBullet('overcharge')], 0)

    const coreSegments = calls.filter((c) => c.style === BULLET_STYLES.overcharge.core)
    expect(coreSegments).toHaveLength(2)
    // Two distinct bands, not one solid core.
    expect(coreSegments[0].y).toBeLessThan(coreSegments[1].y)
  })

  it('estados diferentes desenham cores diferentes na mesma cena', () => {
    const { ctx, calls } = createRecordingContext()
    new BulletRenderer().render(ctx, [makeBullet('normal', 50), makeBullet('rapid', 80)], 0)

    const styles = stylesUsed(calls)
    expect(styles).toContain(BULLET_STYLES.normal.body)
    expect(styles).toContain(BULLET_STYLES.rapid.body)
  })
})
