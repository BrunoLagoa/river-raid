import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { SpriteCache } from './SpriteCache'
import { createMockContext2D } from './test-helpers/canvas'

describe('SpriteCache', () => {
  let cache: SpriteCache
  let getContextSpy: ReturnType<typeof vi.spyOn>

  beforeEach(() => {
    getContextSpy = vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockImplementation(function (this: HTMLCanvasElement, type: string) {
      if (type === '2d') return createMockContext2D(this)
      return null
    })

    cache = SpriteCache.getInstance()
    cache.clear()
  })

  afterEach(() => {
    getContextSpy.mockRestore()
  })

  it('cria instancia singleton corretamente', () => {
    const inst1 = SpriteCache.getInstance()
    const inst2 = SpriteCache.getInstance()
    expect(inst1).toBe(inst2)
  })

  it('cria e retorna sprite de inimigos em cache', () => {
    const plane = cache.getEnemySprite('plane')
    expect(plane).not.toBeNull()

    const planeCached = cache.getEnemySprite('plane')
    expect(planeCached).toBe(plane)
  })

  it('suporta múltiplos frames de animação do helicóptero', () => {
    const h0 = cache.getEnemySprite('helicopter', 0)
    const h1 = cache.getEnemySprite('helicopter', 1)
    expect(h0).not.toBeNull()
    expect(h1).not.toBeNull()
    expect(h0).not.toBe(h1)
  })

  it('gera sprite de depósito de combustível', () => {
    const fuel = cache.getFuelSprite()
    expect(fuel).not.toBeNull()
    expect(cache.getFuelSprite()).toBe(fuel)
  })

  it('gera sprites para todos os tipos de inimigos (tank, gunboat, bridge, boat)', () => {
    expect(cache.getEnemySprite('tank')).not.toBeNull()
    expect(cache.getEnemySprite('gunboat')).not.toBeNull()
    expect(cache.getEnemySprite('bridge')).not.toBeNull()
    expect(cache.getEnemySprite('boat')).not.toBeNull()
  })

  it('limpa cache corretamente', () => {
    const b1 = cache.getEnemySprite('boat')
    cache.clear()
    const b2 = cache.getEnemySprite('boat')
    expect(b1).not.toBe(b2)
  })
})
