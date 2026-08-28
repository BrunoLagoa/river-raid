import { describe, it, expect, vi } from 'vitest'
import { GhostRenderer } from './GhostRenderer'
import type { GhostPlaybackState } from './GhostReplaySystem'

describe('GhostRenderer', () => {
  it('renderiza aviao fantasma no canvas sem lancar excecoes', () => {
    const renderer = new GhostRenderer()
    const ctx = {
      save: vi.fn(),
      restore: vi.fn(),
      translate: vi.fn(),
      rotate: vi.fn(),
      beginPath: vi.fn(),
      moveTo: vi.fn(),
      lineTo: vi.fn(),
      closePath: vi.fn(),
      fill: vi.fn(),
      stroke: vi.fn(),
      fillRect: vi.fn(),
      fillText: vi.fn(),
    } as unknown as CanvasRenderingContext2D

    const ghost: GhostPlaybackState = {
      x: 300,
      y: 400,
      bank: 1,
      shooting: true,
    }

    renderer.render(ctx, ghost, 2)

    expect(ctx.save).toHaveBeenCalled()
    expect(ctx.restore).toHaveBeenCalled()
    expect(ctx.rotate).toHaveBeenCalled()
    expect(ctx.fillText).toHaveBeenCalledWith('RECORD', 300, 400 - 22)
  })
})
