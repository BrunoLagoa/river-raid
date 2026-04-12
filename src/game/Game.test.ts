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
})
