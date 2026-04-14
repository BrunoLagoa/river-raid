import { describe, it, expect, vi } from 'vitest'
import { Player } from './Player'

describe('Player', () => {
  it('move para esquerda e direita por teclado', () => {
    const p = new Player(800, 600)
    const start = p.x

    p.keys.add('ArrowLeft')
    p.update(0.1, 0, 800)
    expect(p.x).toBeLessThan(start)

    p.keys.clear()
    p.keys.add('ArrowRight')
    p.update(0.1, 0, 800)
    expect(p.x).toBeGreaterThan(start - 1)
  })

  it('atira quando espaco pressionado', () => {
    const p = new Player(800, 600)
    p.keys.add(' ')

    p.update(0.2, 0, 800)

    expect(p.bullets.length).toBeGreaterThan(0)
    expect(p.justShot).toBe(true)
  })

  it('transita de exploding para dead', () => {
    const p = new Player(800, 600)
    p.explode()
    p.update(2, 0, 800)
    expect(p.state).toBe('dead')
  })

  it('double shot aplica velocidade maior nos dois projeteis', () => {
    const p = new Player(800, 600)
    p.doubleShotTimer = 1
    p.keys.add(' ')

    p.update(0.2, 0, 800)

    expect(p.bullets.length).toBe(2)
    expect(p.bullets[0]?.speed).toBe(750)
    expect(p.bullets[1]?.speed).toBe(750)
  })

  it('tiro normal mantem velocidade base', () => {
    const p = new Player(800, 600)
    p.keys.add(' ')

    p.update(0.2, 0, 800)

    expect(p.bullets.length).toBe(1)
    expect(p.bullets[0]?.speed).toBe(500)
  })

  it('breakShield desativa escudo e aplica invencibilidade temporaria', () => {
    const p = new Player(800, 600)
    p.shieldActive = true

    p.breakShield()

    expect(p.shieldActive).toBe(false)
    expect(p.invincibilityTimer).toBeGreaterThan(0)
  })

  it('respawn recentra jogador e limpa estado de combate', () => {
    const p = new Player(800, 600)
    p.keys.add(' ')
    p.doubleShotTimer = 5
    p.shieldActive = true
    p.invincibilityTimer = 0
    p.update(0.2, 0, 800)

    p.respawn(1000, 700)

    expect(p.state).toBe('alive')
    expect(p.x).toBe(500)
    expect(p.y).toBe(620)
    expect(p.bullets.length).toBe(0)
    expect(p.shieldActive).toBe(false)
    expect(p.doubleShotTimer).toBe(0)
    expect(p.invincibilityTimer).toBeGreaterThan(0)
  })

  it('attachInput e detachInput registram e limpam eventos', () => {
    const addSpy = vi.spyOn(window, 'addEventListener')
    const removeSpy = vi.spyOn(window, 'removeEventListener')
    const p = new Player(800, 600)
    p.keys.add('ArrowLeft')

    p.attachInput()
    p.detachInput()

    expect(addSpy).toHaveBeenCalledWith('keydown', expect.any(Function))
    expect(addSpy).toHaveBeenCalledWith('keyup', expect.any(Function))
    expect(removeSpy).toHaveBeenCalledWith('keydown', expect.any(Function))
    expect(removeSpy).toHaveBeenCalledWith('keyup', expect.any(Function))
    expect(p.keys.size).toBe(0)
  })
})
