import { describe, it, expect, vi, beforeEach } from 'vitest'
import { PowerUpSystem } from './PowerUpSystem'
import type { PowerUp, PowerUpType } from './PowerUpSystem'
import { createSeededRandom } from './random'

describe('PowerUpSystem', () => {
  let system: PowerUpSystem

  beforeEach(() => {
    system = new PowerUpSystem(800, 600)
  })

  describe('spawn', () => {
    it('nao spawna se chance aleatoria maior que chance configurada', () => {
      system = new PowerUpSystem(800, 600, () => 1)
      system.trySpawnAt(400, -50)
      expect(system.powerUps.length).toBe(0)
    })

    it('spawna powerup quando random menor que chance configurada', () => {
      system = new PowerUpSystem(800, 600, () => 0.01)
      system.trySpawnAt(400, -50)
      expect(system.powerUps.length).toBe(1)
    })

    it('spawna com posicao correta', () => {
      system = new PowerUpSystem(800, 600, () => 0.01)
      system.trySpawnAt(400, -50)
      const p = system.powerUps[0]
      expect(p.x).toBe(400)
      expect(p.y).toBe(-50)
    })

    it('seleciona tipo aleatorio entre os disponiveis', () => {
      const types: PowerUpType[] = ['double_shot', 'shield', 'slow_motion']

      const typeRandoms = [0, 0.4, 0.9]
      for (const r of typeRandoms) {
        let calls = 0
        const deterministic = new PowerUpSystem(800, 600, () => {
          calls += 1
          return calls === 1 ? 0 : r
        })
        deterministic.trySpawnAt(400, -50)
        expect(types).toContain(deterministic.powerUps[0]?.type)
      }
    })
  })

  describe('update', () => {
    it('move powerups para baixo baseado em scrollSpeed e dt', () => {
      system = new PowerUpSystem(800, 600, () => 0.01)
      system.trySpawnAt(400, 0)

      const world = { getBoundsAtY: () => ({ left: 100, right: 700 }) }
      system.update(0.1, 100, world)

      expect(system.powerUps[0].y).toBe(10)
    })

    it('desativa powerups que saem da tela', () => {
      system = new PowerUpSystem(800, 600, () => 0.01)
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
      system = new PowerUpSystem(800, 600, () => 0.01)
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

      system = new PowerUpSystem(800, 600, () => 0.01)
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
      system = new PowerUpSystem(800, 600, () => 0.01)
      system.trySpawnAt(400, 100)

      system.reset(800, 600)

      expect(system.powerUps.length).toBe(0)
    })
  })

  describe('setCanvasHeight', () => {
    it('atualiza canvasHeight', () => {
      system = new PowerUpSystem(800, 600, () => 0.01)
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

  it('trySpawnAt usa random injetado de forma deterministica', () => {
    const rngA = createSeededRandom(7)
    const rngB = createSeededRandom(7)
    const a = new PowerUpSystem(800, 600, rngA)
    const b = new PowerUpSystem(800, 600, rngB)

    for (let i = 0; i < 6; i++) {
      a.trySpawnAt(100 + i, 50)
      b.trySpawnAt(100 + i, 50)
    }

    expect(a.powerUps.length).toBe(b.powerUps.length)
    if (a.powerUps.length > 0 && b.powerUps.length > 0) {
      expect(a.powerUps[0].type).toBe(b.powerUps[0].type)
      expect(a.powerUps[0].x).toBe(b.powerUps[0].x)
      expect(a.powerUps[0].y).toBe(b.powerUps[0].y)
    }
  })
})
