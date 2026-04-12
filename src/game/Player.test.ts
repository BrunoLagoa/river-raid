import { describe, it, expect } from 'vitest'
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
})
