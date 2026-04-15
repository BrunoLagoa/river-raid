import { describe, it, expect, vi, beforeEach } from 'vitest'
import { Atmosphere } from './Atmosphere'
import type { ColorPalette } from './Atmosphere'

describe('Atmosphere', () => {
  let atmosphere: Atmosphere

  beforeEach(() => {
    atmosphere = new Atmosphere(800, 600)
  })

  describe('initialization', () => {
    it('inicia com cycleTime 0', () => {
      expect(atmosphere['cycleTime']).toBe(0)
    })

    it('inicia com phaseIndex 0', () => {
      expect(atmosphere['phaseIndex']).toBe(0)
    })

    it('cria 5 clouds no init', () => {
      expect(atmosphere['clouds'].length).toBe(5)
    })
  })

  describe('update', () => {
    it('incrementa cycleTime', () => {
      atmosphere.update(10, 100)
      expect(atmosphere['cycleTime']).toBe(10)
    })

    it('reseta cycleTime quando passa de CYCLE_DURATION', () => {
      atmosphere['cycleTime'] = 479
      atmosphere.update(10, 100)
      expect(atmosphere['cycleTime']).toBeLessThan(10)
    })

    it('atualiza clouds com scrollSpeed', () => {
      atmosphere['clouds'][0].y = 100
      atmosphere.update(0.1, 100)
      expect(atmosphere['clouds'][0].y).toBeGreaterThan(100)
    })

    it('recycla clouds que saem da tela', () => {
      atmosphere['clouds'][0].y = 800
      atmosphere.update(0.1, 100)
      expect(atmosphere['clouds'][0].y).toBeLessThan(0)
    })

    it('nao falha com dt invalido', () => {
      expect(() => atmosphere.update(Infinity, 100)).not.toThrow()
      expect(() => atmosphere.update(NaN, 100)).not.toThrow()
    })
  })

  describe('getPalette', () => {
    it('retorna ColorPalette valida', () => {
      const palette = atmosphere.getPalette()
      expect(palette).toHaveProperty('landBase')
      expect(palette).toHaveProperty('landEdgeDark')
      expect(palette).toHaveProperty('landEdgeBright')
      expect(palette).toHaveProperty('waterBase')
      expect(palette).toHaveProperty('waterFlow')
      expect(palette).toHaveProperty('waterWave')
      expect(palette).toHaveProperty('waterDepth')
      expect(palette).toHaveProperty('shimmer')
      expect(palette).toHaveProperty('brightness')
    })

    it('retorna brightness no range valido', () => {
      const palette = atmosphere.getPalette()
      expect(palette.brightness).toBeGreaterThanOrEqual(0)
      expect(palette.brightness).toBeLessThanOrEqual(1)
    })
  })

  describe('renderClouds', () => {
    it('renderiza sem erro', () => {
      const ctx = {
        save: vi.fn(),
        restore: vi.fn(),
        fillRect: vi.fn(),
        fillStyle: '',
        globalAlpha: 1,
      } as unknown as CanvasRenderingContext2D

      expect(() => atmosphere.renderClouds(ctx)).not.toThrow()
    })

    it('chama save/restore para cada cloud', () => {
      const saveSpy = vi.fn()
      const restoreSpy = vi.fn()
      const ctx = {
        save: saveSpy,
        restore: restoreSpy,
        fillRect: vi.fn(),
        fillStyle: '',
        globalAlpha: 1,
      } as unknown as CanvasRenderingContext2D

      atmosphere.renderClouds(ctx)

      expect(saveSpy).toHaveBeenCalled()
      expect(restoreSpy).toHaveBeenCalled()
    })
  })

  describe('renderScanlines', () => {
    it('renderiza sem erro', () => {
      const ctx = {
        save: vi.fn(),
        restore: vi.fn(),
        fillRect: vi.fn(),
      } as unknown as CanvasRenderingContext2D

      expect(() => atmosphere.renderScanlines(ctx, 800, 600)).not.toThrow()
    })

    it('desenha linhas em toda altura', () => {
      const fillRectSpy = vi.fn()
      const ctx = {
        save: vi.fn(),
        restore: vi.fn(),
        fillRect: fillRectSpy,
      } as unknown as CanvasRenderingContext2D

      atmosphere.renderScanlines(ctx, 800, 600)

      expect(fillRectSpy).toHaveBeenCalled()
    })
  })

  describe('resize', () => {
    it('atualiza dimensoes', () => {
      atmosphere.resize(1024, 768)
      
      const instance = atmosphere as unknown as { canvasWidth: number; canvasHeight: number }
      expect(instance.canvasWidth).toBe(1024)
      expect(instance.canvasHeight).toBe(768)
    })
  })

  describe('reset', () => {
    it('reseta cycleTime e phaseIndex', () => {
      atmosphere['cycleTime'] = 100
      atmosphere['phaseIndex'] = 2

      atmosphere.reset(800, 600)

      expect(atmosphere['cycleTime']).toBe(0)
      expect(atmosphere['phaseIndex']).toBe(0)
    })

    it('reinicializa clouds', () => {
      atmosphere['clouds'] = []
      atmosphere.reset(800, 600)
      expect(atmosphere['clouds'].length).toBe(5)
    })

    it('atualiza dimensoes', () => {
      atmosphere.reset(1024, 768)
      
      const instance = atmosphere as unknown as { canvasWidth: number; canvasHeight: number }
      expect(instance.canvasWidth).toBe(1024)
      expect(instance.canvasHeight).toBe(768)
    })
  })
})

describe('ColorPalette interface', () => {
  it('tem todas as propriedades requeridas', () => {
    const palette: ColorPalette = {
      landBase: '#1a5c1a',
      landEdgeDark: '#0f4a0f',
      landEdgeBright: '#2a5aaa',
      waterBase: '#1a3a8a',
      waterFlow: '#2a55aa',
      waterWave: 'rgba(120, 180, 255, 0.08)',
      waterDepth: 'rgba(0, 10, 40, 0.15)',
      shimmer: 'rgba(100, 160, 255, 0.08)',
      brightness: 1.0,
    }

    expect(palette.landBase).toBe('#1a5c1a')
    expect(palette.brightness).toBe(1.0)
  })
})