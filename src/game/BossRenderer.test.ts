import { describe, it, expect, beforeEach, vi } from 'vitest'
import { BossRenderer } from './BossRenderer'
import { BossDreadnought } from './BossDreadnought'

describe('BossRenderer', () => {
  let renderer: BossRenderer
  let boss: BossDreadnought
  let ctx: CanvasRenderingContext2D

  beforeEach(() => {
    renderer = new BossRenderer()
    boss = new BossDreadnought(480)
    ctx = {
      save: vi.fn(),
      restore: vi.fn(),
      translate: vi.fn(),
      rotate: vi.fn(),
      beginPath: vi.fn(),
      closePath: vi.fn(),
      moveTo: vi.fn(),
      lineTo: vi.fn(),
      arc: vi.fn(),
      fill: vi.fn(),
      stroke: vi.fn(),
      fillRect: vi.fn(),
      strokeRect: vi.fn(),
      fillStyle: '',
      strokeStyle: '',
      lineWidth: 1,
    } as unknown as CanvasRenderingContext2D
  })

  it('renders boss in entering/fighting state', () => {
    renderer.render(ctx, boss)
    expect(ctx.save).toHaveBeenCalled()
    expect(ctx.restore).toHaveBeenCalled()
    expect(ctx.translate).toHaveBeenCalledWith(boss.x, boss.y)
  })

  it('renders core when in phase 2', () => {
    boss.phase = 2
    renderer.render(ctx, boss)
    expect(ctx.arc).toHaveBeenCalled()
  })

  it('skips rendering when boss is inactive', () => {
    boss.active = false
    renderer.render(ctx, boss)
    expect(ctx.save).not.toHaveBeenCalled()
  })
})
