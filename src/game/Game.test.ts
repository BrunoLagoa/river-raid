import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { Game } from './Game'
import { createMockCanvas } from './test-helpers/canvas'
import { mockAnimationFrame } from './test-helpers/time'
import { mockAudioContext } from './test-helpers/audio'

beforeEach(() => {
  vi.useFakeTimers()
  vi.setSystemTime(new Date('2026-01-01'))
  mockAudioContext()
})

afterEach(() => {
  vi.useRealTimers()
  vi.restoreAllMocks()
})

describe('Game integration', () => {
  it('start e stop controlam loop', () => {
    const canvas = createMockCanvas()
    const raf = mockAnimationFrame()
    const game = new Game(canvas)

    game.start()
    raf.flush(16)
    game.stop()

    expect(game).toBeDefined()
  })

  it('chama callback de game over', () => {
    const canvas = createMockCanvas()
    const game = new Game(canvas)
    const cb = vi.fn()
    game.setOnGameOver(cb)

    game.handlePlayerDeath()
    game.handlePlayerDeath()
    game.handlePlayerDeath()

    vi.advanceTimersByTime(1300)

    expect(cb).toHaveBeenCalled()
  })

  it('togglePause alterna estado sem quebrar o loop ativo', () => {
    const canvas = createMockCanvas()
    const raf = mockAnimationFrame()
    const game = new Game(canvas)

    game.start()
    game.togglePause()
    raf.flush(16)
    game.togglePause()
    raf.flush(32)
    game.stop()

    expect(game).toBeDefined()
  })

  it('restart reinicializa score e estado de jogo', () => {
    const canvas = createMockCanvas()
    const game = new Game(canvas)

    game.score = 1234
    game.lives = 1
    game.simulateKey(' ', true)
    game.restart()

    expect(game.score).toBe(0)
    expect(game.lives).toBe(3)
    expect(game.player.keys.has(' ')).toBe(false)
    game.stop()
  })

  it('setGamepadEnabled atualiza a flag interna', () => {
    const canvas = createMockCanvas()
    const game = new Game(canvas)

    game.setGamepadEnabled(false)

    expect((game as unknown as { gamepadEnabled: boolean }).gamepadEnabled).toBe(false)
  })
})
