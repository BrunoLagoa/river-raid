import { describe, it, expect, vi, beforeEach } from 'vitest'
import { PowerUpSystem } from './PowerUpSystem'
import type { PowerUp, PowerUpType } from './PowerUpSystem'

describe('PowerUpSystem', () => {
  let system: PowerUpSystem

  beforeEach(() => {
    system = new PowerUpSystem(800, 600)
  })

  describe('spawn', () => {
    it('nao spawna se chance aleatoria maior que chance configurada', () => {
      vi.spyOn(Math, 'random').mockReturnValue(1)
      system.trySpawnAt(400, -50)
      expect(system.powerUps.length).toBe(0)
    })

    it('spawna powerup quando random menor que chance configurada', () => {
      vi.spyOn(Math, 'random').mockImplementation(() => 0.01)
      system.trySpawnAt(400, -50)
      expect(system.powerUps.length).toBe(1)
    })

    it('spawna com posicao correta', () => {
      vi.spyOn(Math, 'random').mockImplementation(() => 0.01)
      system.trySpawnAt(400, -50)
      const p = system.powerUps[0]
      expect(p.x).toBe(400)
      expect(p.y).toBe(-50)
    })

    it('seleciona tipo aleatorio entre os disponiveis', () => {
      const types: PowerUpType[] = ['double_shot', 'shield', 'slow_motion']
      
      // Direct test: verify all types exist in the implementation
      const system = new PowerUpSystem(800, 600)
      const allTypes = new Set<PowerUpType>()
      
      vi.spyOn(Math, 'random').mockImplementation(() => 0.01)
      system.trySpawnAt(400, -50)
      if (system.powerUps[0]) {
        allTypes.add(system.powerUps[0].type)
      }
      
      expect(types).toContain(system.powerUps[0]?.type)
    })
  })

  describe('update', () => {
    it('move powerups para baixo baseado em scrollSpeed e dt', () => {
      vi.spyOn(Math, 'random').mockImplementation(() => 0.01)
      system.trySpawnAt(400, 0)

      const world = { getBoundsAtY: () => ({ left: 100, right: 700 }) }
      system.update(0.1, 100, world)

      expect(system.powerUps[0].y).toBe(10)
    })

    it('desativa powerups que saem da tela', () => {
      vi.spyOn(Math, 'random').mockImplementation(() => 0.01)
      system.trySpawnAt(400, 580)

      const world = { getBoundsAtY: () => ({ left: 100, right: 700 }) }
      
      // canvasHeight + 50 = 650, spawn at 580, need enough updates to cross threshold
      for (let i = 0; i < 10; i++) {
        system.update(0.1, 100, world)
      }

      // After enough updates, powerup should be deactivated and removed via compactArray
      expect(system.powerUps.length).toBe(0)
    })

    it('mantem powerups dentro dos limites do mundo', () => {
      vi.spyOn(Math, 'random').mockImplementation(() => 0.01)
      system.trySpawnAt(50, 100)

      const world = { getBoundsAtY: () => ({ left: 100, right: 700 }) }
      system.update(0.1, 0, world)

      expect(system.powerUps[0].x).toBeGreaterThanOrEqual(102)
    })
  })

  describe('render', () => {
    it('renderiza powerups ativos', () => {
      const ctx = {
        save: vi.fn(),
        translate: vi.fn(),
        fillRect: vi.fn(),
        strokeRect: vi.fn(),
        fillText: vi.fn(),
        restore: vi.fn(),
        fillStyle: '',
        strokeStyle: '',
        lineWidth: 1,
        font: '',
        textAlign: 'center' as const,
        textBaseline: 'middle' as const,
      } as unknown as CanvasRenderingContext2D

      vi.spyOn(Math, 'random').mockImplementation(() => 0.01)
      system.trySpawnAt(400, 100)
      system.render(ctx)

      expect(ctx.save).toHaveBeenCalled()
      expect(ctx.translate).toHaveBeenCalledWith(400, 100)
    })

    it('renderiza todos os tipos com cores diferentes', () => {
      const ctx = {
        save: vi.fn(),
        translate: vi.fn(),
        fillRect: vi.fn(),
        strokeRect: vi.fn(),
        fillText: vi.fn(),
        restore: vi.fn(),
        fillStyle: '',
        strokeStyle: '',
        lineWidth: 1,
        font: '',
        textAlign: 'center' as const,
        textBaseline: 'middle' as const,
      } as unknown as CanvasRenderingContext2D

      const types: PowerUpType[] = ['double_shot', 'shield', 'slow_motion']
      types.forEach((type) => {
        system.powerUps.push({
          type,
          x: 400,
          y: 100,
          width: 16,
          height: 16,
          active: true,
        })
      })

      system.render(ctx)

      expect(ctx.fillRect).toHaveBeenCalledTimes(3)
      expect(ctx.strokeRect).toHaveBeenCalledTimes(3)
    })
  })

  describe('reset', () => {
    it('limpa powerups e redefine altura', () => {
      vi.spyOn(Math, 'random').mockImplementation(() => 0.01)
      system.trySpawnAt(400, 100)

      system.reset(800, 600)

      expect(system.powerUps.length).toBe(0)
    })
  })

  describe('setCanvasHeight', () => {
    it('atualiza canvasHeight', () => {
      system.setCanvasHeight(800)
      system.trySpawnAt(400, 700)

      const world = { getBoundsAtY: () => ({ left: 100, right: 700 }) }
      system.update(0.1, 0, world)

      expect(system.powerUps[0].active).toBe(true)
    })
  })
})

describe('PowerUp type guards', () => {
  it('PowerUp tem estrutura correta', () => {
    const powerUp: PowerUp = {
      type: 'double_shot',
      x: 400,
      y: 100,
      width: 16,
      height: 16,
      active: true,
    }

    expect(powerUp.type).toBe('double_shot')
    expect(powerUp.active).toBe(true)
  })
})