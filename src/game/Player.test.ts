import { describe, it, expect, vi } from 'vitest'
import { Player } from './Player'
import { createMockContext2D } from './test-helpers/canvas'

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

describe('Player render', () => {
  it('render alive desenha navio', () => {
    const p = new Player(800, 600)
    const ctx = createMockContext2D()
    const fillSpy = vi.spyOn(ctx, 'fill')

    p.render(ctx)

    expect(fillSpy).toHaveBeenCalled()
  })

  it('render com invencibilidade aplica alpha alternado', () => {
    const p = new Player(800, 600)
    const ctx = createMockContext2D()
    p.invincibilityTimer = 0.5

    p.render(ctx)

    expect(ctx.globalAlpha).toBeLessThanOrEqual(1)
  })

  it('render com shield desenha escudo', () => {
    const p = new Player(800, 600)
    const ctx = createMockContext2D()
    p.shieldActive = true
    const strokeSpy = vi.spyOn(ctx, 'stroke')

    p.render(ctx)

    expect(strokeSpy).toHaveBeenCalled()
  })

  it('render exploding desenha explosao', () => {
    const p = new Player(800, 600)
    const ctx = createMockContext2D()
    p.explode()

    p.render(ctx)

    expect(ctx.globalAlpha).toBeLessThanOrEqual(1)
  })

  it('render desenha balas ativas', () => {
    const p = new Player(800, 600)
    const ctx = createMockContext2D()
    p.keys.add(' ')
    p.update(0.2, 0, 800)

    p.render(ctx)

    expect(ctx.fillRect).toHaveBeenCalled()
  })
})

describe('Player keyboard handlers', () => {
  it('onKeyDown adiciona tecla e previne default para espaco', () => {
    const p = new Player(800, 600)
    p.attachInput()

    window.dispatchEvent(new KeyboardEvent('keydown', { key: ' ' }))

    expect(p.keys.has(' ')).toBe(true)
    p.detachInput()
  })

  it('onKeyUp remove tecla', () => {
    const p = new Player(800, 600)
    p.attachInput()
    p.keys.add('ArrowLeft')

    window.dispatchEvent(new KeyboardEvent('keyup', { key: 'ArrowLeft' }))

    expect(p.keys.has('ArrowLeft')).toBe(false)
    p.detachInput()
  })

  it('onKeyDown previne default para ArrowLeft', () => {
    const p = new Player(800, 600)
    p.attachInput()

    const event = new KeyboardEvent('keydown', { key: 'ArrowLeft' })
    const preventSpy = vi.spyOn(event, 'preventDefault')
    window.dispatchEvent(event)

    expect(preventSpy).toHaveBeenCalled()
    p.detachInput()
  })
})

describe('Player touch', () => {
  it('move para touchTargetX', () => {
    const p = new Player(800, 600)
    p.setTouchTarget(200)
    const startX = p.x

    p.update(0.1, 0, 800)

    expect(p.x).not.toBe(startX)
  })

  it('touch atira automaticamente', () => {
    const p = new Player(800, 600)
    p.setTouchTarget(400)

    p.update(0.2, 0, 800)

    expect(p.bullets.length).toBeGreaterThan(0)
  })

  it('setTouchTarget null remove alvo', () => {
    const p = new Player(800, 600)
    p.setTouchTarget(200)
    p.setTouchTarget(null)

    expect((p as unknown as { touchTargetX: number | null }).touchTargetX).toBe(null)
  })
})

describe('Player resize e reset', () => {
  it('resize clampa posicao dentro limites', () => {
    const p = new Player(800, 600)
    p.x = 900

    p.resize(800, 600, 0, 400)

    expect(p.x).toBeLessThanOrEqual(400 - p.width / 2 - 2)
  })

  it('reset limpa keys e touchTargetX', () => {
    const p = new Player(800, 600)
    p.keys.add('ArrowLeft')
    p.setTouchTarget(200)
    p.doubleShotTimer = 5

    p.reset(800, 600)

    expect(p.keys.size).toBe(0)
    expect((p as unknown as { touchTargetX: number | null }).touchTargetX).toBe(null)
    expect(p.doubleShotTimer).toBe(0)
    expect(p.shieldActive).toBe(false)
    expect(p.invincibilityTimer).toBe(0)
  })
})

describe('Player edge cases', () => {
  it('update com state dead nao faz nada', () => {
    const p = new Player(800, 600)
    p.state = 'dead'
    const startY = p.y

    p.update(0.1, 0, 800)

    expect(p.y).toBe(startY)
  })

  it('bullet offscreen desativa e chama onMiss', () => {
    const p = new Player(800, 600)
    const missFn = vi.fn()
    p.keys.add(' ')
    p.update(0.2, 0, 800)

    p.update(5, 0, 800, missFn)

    expect(missFn).toHaveBeenCalled()
  })

  it('invincibilityTimer decrementa no update', () => {
    const p = new Player(800, 600)
    p.invincibilityTimer = 2

    p.update(0.5, 0, 800)

    expect(p.invincibilityTimer).toBeLessThan(2)
  })

  it('doubleShotTimer decrementa no update', () => {
    const p = new Player(800, 600)
    p.doubleShotTimer = 3

    p.update(0.5, 0, 800)

    expect(p.doubleShotTimer).toBeLessThan(3)
  })

  it('explode so funciona se alive', () => {
    const p = new Player(800, 600)
    p.state = 'dead'

    p.explode()

    expect(p.state).toBe('dead')
  })

  it('touch movement precisa se proximo do alvo', () => {
    const p = new Player(800, 600)
    const startX = p.x
    p.setTouchTarget(p.x + 1)

    p.update(0.1, 0, 800)

    expect(p.x).toBeGreaterThan(startX)
  })

  it('touchTargetX snaps quando distancia menor que maxMove', () => {
    const p = new Player(800, 600)
    const target = p.x + 0.5  // menor que maxMove em 1 frame
    p.setTouchTarget(target)

    p.update(1.0, 0, 800)  // dt grande: maxMove > distancia

    expect(p.x).toBe(target)
  })

  it('double-shot dispara dois projéteis ao mesmo tempo', () => {
    const p = new Player(800, 600)
    p.doubleShotTimer = 5
    p.keys.add(' ')

    p.update(0.1, 0, 800)

    // Double-shot deve ter criado 2 balas
    expect(p.bullets.length).toBe(2)
  })

  it('bullet offscreen sem onMiss nao lanca erro', () => {
    const p = new Player(800, 600)
    p.keys.add(' ')
    p.update(0.2, 0, 800)
    // update sem onMiss — branch `if (onMiss)` falsy nao deve lancar erro
    expect(() => p.update(5, 0, 800)).not.toThrow()
  })

  it('rapidFireTimer decrementa no update', () => {
    const p = new Player(800, 600)
    p.rapidFireTimer = 3
    p.update(1, 0, 800)
    expect(p.rapidFireTimer).toBeLessThan(3)
  })

  it('move para cima (frente) com ArrowUp/W', () => {
    const p = new Player(800, 600)
    const startY = p.y

    p.keys.add('ArrowUp')
    p.update(0.1, 0, 800)
    expect(p.y).toBeLessThan(startY)

    const afterUp = p.y
    p.keys.clear()
    p.keys.add('w')
    p.update(0.1, 0, 800)
    expect(p.y).toBeLessThan(afterUp)
  })

  it('move para baixo (ré) com ArrowDown/S', () => {
    const p = new Player(800, 600)
    // sobe primeiro para ter espaço de descida dentro dos limites
    p.keys.add('ArrowUp')
    p.update(0.5, 0, 800)
    const startY = p.y

    p.keys.clear()
    p.keys.add('ArrowDown')
    p.update(0.1, 0, 800)
    expect(p.y).toBeGreaterThan(startY)
  })

  it('clampeia o movimento vertical aos limites do canvas', () => {
    const p = new Player(800, 600)
    const topBound = 600 * 0.32
    const bottomBound = 600 - 40

    p.keys.add('ArrowUp')
    for (let i = 0; i < 60; i++) p.update(0.1, 0, 800)
    expect(p.y).toBeGreaterThanOrEqual(topBound - 0.001)

    p.keys.clear()
    p.keys.add('ArrowDown')
    for (let i = 0; i < 60; i++) p.update(0.1, 0, 800)
    expect(p.y).toBeLessThanOrEqual(bottomBound + 0.001)
  })

  it('segue o alvo de toque em 2D (x e y)', () => {
    const p = new Player(800, 600)
    p.setTouchTarget(200, 300)
    p.update(1.0, 0, 800) // dt grande para snap
    expect(p.x).toBe(200)
    expect(p.y).toBe(300)
  })
})
