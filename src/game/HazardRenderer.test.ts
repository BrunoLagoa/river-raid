import { describe, it, expect, beforeEach, vi } from 'vitest'
import { HazardRenderer } from './HazardRenderer'
import { HazardManager } from './HazardManager'

function createMockCtx(): CanvasRenderingContext2D {
  return {
    save: vi.fn(),
    restore: vi.fn(),
    translate: vi.fn(),
    beginPath: vi.fn(),
    moveTo: vi.fn(),
    lineTo: vi.fn(),
    stroke: vi.fn(),
    fill: vi.fn(),
    arc: vi.fn(),
    fillRect: vi.fn(),
    roundRect: vi.fn(),
    createRadialGradient: vi.fn(() => ({
      addColorStop: vi.fn(),
    })),
  } as unknown as CanvasRenderingContext2D
}

describe('HazardRenderer', () => {
  let renderer: HazardRenderer
  let hm: HazardManager

  beforeEach(() => {
    renderer = new HazardRenderer()
    hm = new HazardManager(480, 640, () => 0.5)
  })

  it('renderiza sem erros quando nao ha perigos ativos', () => {
    const ctx = createMockCtx()
    expect(() => renderer.render(ctx, hm)).not.toThrow()
  })

  it('renderiza minas ativas com LEDs e espinhos', () => {
    const ctx = createMockCtx()
    hm.mines[0].active = true
    hm.mines[0].x = 100
    hm.mines[0].y = 150
    hm.mines[0].chainExplodeTimer = 0.05

    renderer.render(ctx, hm)

    expect(ctx.save).toHaveBeenCalled()
    expect(ctx.translate).toHaveBeenCalledWith(100, 150)
    expect(ctx.fill).toHaveBeenCalled()
    expect(ctx.stroke).toHaveBeenCalled()
  })

  it('renderiza redemoinhos com gradiente e bracos espiralados', () => {
    const ctx = createMockCtx()
    hm.whirlpools[0].active = true
    hm.whirlpools[0].x = 240
    hm.whirlpools[0].y = 300

    renderer.render(ctx, hm, false)

    expect(ctx.createRadialGradient).toHaveBeenCalled()
    expect(ctx.stroke).toHaveBeenCalled()
  })

  it('renderiza bunkers com torre e canhao duplo', () => {
    const ctx = createMockCtx()
    hm.bunkers[0].active = true
    hm.bunkers[0].x = 80
    hm.bunkers[0].y = 200
    hm.bunkers[0].hp = 2
    hm.bunkers[0].maxHp = 3
    hm.bunkers[0].damageFlashTimer = 0.1

    renderer.render(ctx, hm)

    expect(ctx.roundRect).toHaveBeenCalled()
    expect(ctx.stroke).toHaveBeenCalled()
  })
})
