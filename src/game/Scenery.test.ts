import { describe, it, expect, vi, beforeEach } from 'vitest'
import { Scenery } from './Scenery'

describe('Scenery', () => {
  let scenery: Scenery
  const mockWorld = {
    getBoundsAtY: () => ({ left: 50, right: 750 }),
  }

  beforeEach(() => {
    scenery = new Scenery(800, 600)
  })

  describe('spawn', () => {
    it('inicia vazio', () => {
      expect(scenery.objects.length).toBe(0)
    })

    it('spawna objeto apos progresso suficiente', () => {
      vi.spyOn(Math, 'random').mockImplementation(() => 0.5)
      
      for (let i = 0; i < 10; i++) {
        scenery.update(0.1, 280, mockWorld, 800)
      }

      expect(scenery.objects.length).toBeGreaterThan(0)
    })
  })

describe('update', () => {
    it('move objetos para baixo baseado em scrollSpeed e dt', () => {
      vi.spyOn(Math, 'random').mockImplementation(() => 0.01)
      
      // SPAWN_INTERVAL = 280, scrollSpeed=100, dt=0.1 -> travel=10 per update
      // Need ~28 updates to trigger spawn
      for (let i = 0; i < 30; i++) {
        scenery.update(0.1, 100, mockWorld, 800)
      }

      expect(scenery.objects.length).toBeGreaterThan(0)
      const obj = scenery.objects[scenery.objects.length - 1]
      expect(obj.y).toBeGreaterThanOrEqual(-60)
    })

    it('remove objetos que saem da tela', () => {
      vi.spyOn(Math, 'random').mockImplementation(() => 0.01)
      
      for (let i = 0; i < 50; i++) {
        scenery.update(0.1, 100, mockWorld, 800)
      }

      const offScreen = scenery.objects.filter(o => o.y > 700)
      expect(offScreen.length).toBe(0)
    })

    it('reseta spawnProgress apos spawn', () => {
      vi.spyOn(Math, 'random').mockImplementation(() => 0.5)
      
      const initial = scenery['spawnProgress']
      for (let i = 0; i < 10; i++) {
        scenery.update(0.1, 280, mockWorld, 800)
      }

      expect(scenery['spawnProgress']).not.toBe(initial)
    })
  })

  describe('render', () => {
    it('renderiza objetos ativos', () => {
      const ctx = {
        save: vi.fn(),
        restore: vi.fn(),
        fillRect: vi.fn(),
        strokeRect: vi.fn(),
        fillText: vi.fn(),
        globalAlpha: 1,
      } as unknown as CanvasRenderingContext2D

      vi.spyOn(Math, 'random').mockImplementation(() => 0.01)
      for (let i = 0; i < 20; i++) {
        scenery.update(0.1, 280, mockWorld, 800)
      }

      scenery.render(ctx)

      expect(ctx.save).toHaveBeenCalled()
    })

    it('aplica brilho para cenario quando menor que 0.99', () => {
      const ctx = {
        save: vi.fn(),
        restore: vi.fn(),
        fillRect: vi.fn(),
        strokeRect: vi.fn(),
        fillText: vi.fn(),
        globalAlpha: 1,
      } as unknown as CanvasRenderingContext2D

      vi.spyOn(Math, 'random').mockImplementation(() => 0.01)
      for (let i = 0; i < 20; i++) {
        scenery.update(0.1, 280, mockWorld, 800)
      }

      scenery.render(ctx, 0.5)

      expect(ctx.save).toHaveBeenCalled()
      expect(ctx.restore).toHaveBeenCalled()
    })
  })

  describe('reset', () => {
    it('limpa objetos e reseta progresso', () => {
      vi.spyOn(Math, 'random').mockImplementation(() => 0.01)
      for (let i = 0; i < 10; i++) {
        scenery.update(0.1, 280, mockWorld, 800)
      }

      scenery.reset(800, 600)

      expect(scenery.objects.length).toBe(0)
      expect(scenery['spawnProgress']).toBe(0)
    })
  })

  describe('setCanvasHeight', () => {
    it('atualiza canvasHeight', () => {
      scenery.setCanvasHeight(800)
      
      const obj = scenery as unknown as { canvasHeight: number }
      expect(obj.canvasHeight).toBe(800)
    })
  })

  describe('objeto estrutura', () => {
    it('objeto tem propriedades necessarias', () => {
      vi.spyOn(Math, 'random').mockImplementation(() => 0.01)
      for (let i = 0; i < 20; i++) {
        scenery.update(0.1, 280, mockWorld, 800)
      }

      const obj = scenery.objects[scenery.objects.length - 1]
      expect(obj).toHaveProperty('type')
      expect(obj).toHaveProperty('x')
      expect(obj).toHaveProperty('y')
      expect(obj).toHaveProperty('width')
      expect(obj).toHaveProperty('height')
      expect(obj).toHaveProperty('active')
      expect(obj).toHaveProperty('side')
      expect(obj).toHaveProperty('variant')
    })
  })
})