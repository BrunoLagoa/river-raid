import { describe, it, expect } from 'vitest'
import { PlayerSkinRenderer } from './PlayerSkinRenderer'
import { createMockContext2D } from './test-helpers/canvas'
import type { SkinId } from './SkinService'

describe('PlayerSkinRenderer', () => {
  const skins: SkinId[] = ['classic', 'stealth', 'biplane', 'cyber_neon']

  it.each(skins)('renderiza a skin %s sem erros de canvas', (skinId) => {
    const renderer = new PlayerSkinRenderer()
    const ctx = createMockContext2D()

    expect(() => renderer.render(ctx, 400, 300, skinId, 0, 0)).not.toThrow()
    expect(ctx.save).toHaveBeenCalled()
    expect(ctx.restore).toHaveBeenCalled()
  })

  it('aplica rotacao ao inclinar lateralmente (banking)', () => {
    const renderer = new PlayerSkinRenderer()
    const ctx = createMockContext2D()

    renderer.render(ctx, 400, 300, 'classic', 0, 1) // bank right
    expect(ctx.rotate).toHaveBeenCalledWith((6 * Math.PI) / 180)

    renderer.render(ctx, 400, 300, 'classic', 0, -1) // bank left
    expect(ctx.rotate).toHaveBeenCalledWith((-6 * Math.PI) / 180)
  })
})
