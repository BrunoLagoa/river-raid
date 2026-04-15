import { describe, it, expect, vi, beforeEach } from 'vitest'
import { Fx } from './Fx'

describe('Fx', () => {
  let fx: Fx

  beforeEach(() => {
    fx = new Fx()
  })

  describe('initialization', () => {
    it('inicia com pools vazios', () => {
      expect(fx.getActiveParticleCount()).toBe(0)
    })

    it('inicia com shake em zero', () => {
      expect(fx.shakeX).toBe(0)
      expect(fx.shakeY).toBe(0)
    })
  })

  describe('explosion', () => {
    it('cria particulas', () => {
      fx.explosion(400, 300, '#ff0000')
      expect(fx.getActiveParticleCount()).toBeGreaterThan(0)
    })
  })

  describe('bigExplosion', () => {
    it('cria mais particulas que explosion', () => {
      fx.explosion(400, 300, '#ff0000')
      const count1 = fx.getActiveParticleCount()
      fx.bigExplosion(400, 300, '#ff0000')
      const count2 = fx.getActiveParticleCount()
      expect(count2).toBeGreaterThan(count1)
    })
  })

  describe('addShake', () => {
    it('adiciona shake se nao reduzido', () => {
      fx.addShake(5, 0.15)
      fx.update(0.01)
      expect(fx.shakeX).not.toBe(0)
    })

    it('nao adiciona shake se reduzido', () => {
      fx.setReducedMotion(true)
      fx.addShake(5, 0.15)
      expect(fx.shakeX).toBe(0)
    })
  })

  describe('smokeTrail', () => {
    it('cria particula de fumaça', () => {
      fx.smokeTrail(400, 300)
      expect(fx.getActiveParticleCount()).toBeGreaterThan(0)
    })
  })

  describe('deathSmoke', () => {
    it('cria multiplas particulas', () => {
      fx.deathSmoke(400, 300)
      expect(fx.getActiveParticleCount()).toBeGreaterThan(0)
    })
  })

  describe('scorePopup', () => {
    it('cria popup', () => {
      fx.scorePopup(400, 300, '+100')
      fx.update(0.01)
      // Popup rendered in render()
    })
  })

  describe('flash', () => {
    it('ativa flash', () => {
      fx.flash('#ffffff', 0.5)
      fx.update(0.01)
      expect(fx['flashAlpha']).toBeGreaterThan(0)
    })
  })

  describe('update', () => {
    it('decrementa vida das particulas', () => {
      fx.explosion(400, 300, '#ff0000')
      const before = fx.getActiveParticleCount()
      fx.update(1)
      const after = fx.getActiveParticleCount()
      expect(after).toBeLessThan(before)
    })

    it('atualiza shake', () => {
      fx.addShake(5, 0.1)
      fx.update(0.05)
      expect(fx['shakeTimer']).toBeLessThan(0.1)
    })
  })

  describe('render', () => {
    it('renderiza sem erro', () => {
      const ctx = {
        save: vi.fn(),
        restore: vi.fn(),
        fillRect: vi.fn(),
        fillText: vi.fn(),
        globalAlpha: 1,
        fillStyle: '',
        font: '',
        textAlign: 'center' as const,
        textBaseline: 'middle' as const,
        canvas: { width: 800, height: 600 },
      } as unknown as CanvasRenderingContext2D

      fx.explosion(400, 300, '#ff0000')
      expect(() => fx.render(ctx)).not.toThrow()
    })

    it('renderiza flash', () => {
      const ctx = {
        save: vi.fn(),
        restore: vi.fn(),
        fillRect: vi.fn(),
        globalAlpha: 1,
        fillStyle: '',
        canvas: { width: 800, height: 600 },
      } as unknown as CanvasRenderingContext2D

      fx.flash('#ffffff', 0.5)
      fx.update(0.01)
      expect(() => fx.render(ctx)).not.toThrow()
    })
  })

  describe('setReducedMotion', () => {
    it('alterna modo reduzido', () => {
      expect(fx['reducedMotion']).toBe(false)
      fx.setReducedMotion(true)
      expect(fx['reducedMotion']).toBe(true)
    })
  })

  describe('getActiveParticleCount', () => {
    it('retorna 0 para pool vazio', () => {
      expect(fx.getActiveParticleCount()).toBe(0)
    })

    it('conta particulas ativas', () => {
      fx.explosion(400, 300, '#ff0000')
      expect(fx.getActiveParticleCount()).toBeGreaterThan(0)
    })
  })

  describe('reset', () => {
    it('limpa particulas e flash', () => {
      fx.explosion(400, 300, '#ff0000')
      fx.flash('#ffffff', 0.5)
      fx.reset()
      expect(fx.getActiveParticleCount()).toBe(0)
      expect(fx['flashAlpha']).toBe(0)
    })
  })
})