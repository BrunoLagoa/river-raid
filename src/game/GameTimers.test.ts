import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { GameTimers } from './GameTimers'

describe('GameTimers', () => {
  let timers: GameTimers

  beforeEach(() => {
    vi.useFakeTimers()
    timers = new GameTimers()
  })

  afterEach(() => {
    timers.clear()
    vi.useRealTimers()
  })

  it('fires a respawn after the requested delay', () => {
    const action = vi.fn()
    timers.scheduleRespawn(1300, action)

    vi.advanceTimersByTime(1299)
    expect(action).not.toHaveBeenCalled()

    vi.advanceTimersByTime(1)
    expect(action).toHaveBeenCalledTimes(1)
  })

  it('does not fire a respawn while the game is paused', () => {
    const action = vi.fn()
    timers.scheduleRespawn(1300, action)

    vi.advanceTimersByTime(400)
    timers.setPaused(true)
    vi.advanceTimersByTime(5000)
    expect(action).not.toHaveBeenCalled()

    timers.setPaused(false)
    vi.advanceTimersByTime(899)
    expect(action).not.toHaveBeenCalled()

    vi.advanceTimersByTime(1)
    expect(action).toHaveBeenCalledTimes(1)
  })

  it('preserves only the remaining time across multiple pauses', () => {
    const action = vi.fn()
    timers.scheduleRespawn(1000, action)

    vi.advanceTimersByTime(300)
    timers.setPaused(true)
    vi.advanceTimersByTime(2000)
    timers.setPaused(false)

    vi.advanceTimersByTime(300)
    timers.setPaused(true)
    vi.advanceTimersByTime(2000)
    timers.setPaused(false)

    vi.advanceTimersByTime(399)
    expect(action).not.toHaveBeenCalled()

    vi.advanceTimersByTime(1)
    expect(action).toHaveBeenCalledTimes(1)
  })

  it('does not fire a game-over callback while paused', () => {
    const action = vi.fn()
    timers.scheduleGameOver(1200, action)

    timers.setPaused(true)
    vi.advanceTimersByTime(5000)
    expect(action).not.toHaveBeenCalled()

    timers.setPaused(false)
    vi.advanceTimersByTime(1200)
    expect(action).toHaveBeenCalledTimes(1)
  })

  it('clear cancels pending callbacks and resets pause state', () => {
    const respawn = vi.fn()
    const gameOver = vi.fn()
    timers.scheduleRespawn(1000, respawn)
    timers.scheduleGameOver(1000, gameOver)
    timers.setPaused(true)

    timers.clear()
    expect(timers.isPaused()).toBe(false)
    expect(timers.hasPendingRespawn()).toBe(false)
    expect(timers.hasPendingGameOver()).toBe(false)

    vi.advanceTimersByTime(5000)
    expect(respawn).not.toHaveBeenCalled()
    expect(gameOver).not.toHaveBeenCalled()
  })
})
