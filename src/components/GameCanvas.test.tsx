import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react'
import GameCanvas from './GameCanvas'
import { getDefaultSettings } from '../game/SettingsService'

const mocks = vi.hoisted(() => ({
  instances: [] as Array<Record<string, unknown>>,
}))

vi.mock('@/game/Game', () => {
  class Game {
    sound = { isMuted: vi.fn(() => false), toggleMute: vi.fn() }
    start = vi.fn()
    destroy = vi.fn()
    resize = vi.fn()
    setGameMode = vi.fn()
    setGhostReplayEnabled = vi.fn()
    setOnGameOver = vi.fn()
    setOnAchievementUnlocked = vi.fn()
    playIntro = vi.fn()
    skipIntro = vi.fn()
    setReducedMotion = vi.fn()
    setWeatherEnabled = vi.fn()
    setLightingEnabled = vi.fn()
    setMasterVolume = vi.fn()
    setMusicVolume = vi.fn()
    setSfxVolume = vi.fn()
    setVoiceVolume = vi.fn()
    setVoiceEnabled = vi.fn()
    setGamepadEnabled = vi.fn()
    setHapticsEnabled = vi.fn()
    setKeybindings = vi.fn()
    setObjectiveBalanceProfile = vi.fn()
    setDifficulty = vi.fn()
    setColorblind = vi.fn()
    setLocale = vi.fn()
    setLanguage = vi.fn()
    setTouchMode = vi.fn()
    setTouchPosition = vi.fn()
    setAnalogVector = vi.fn()
    setTouchShoot = vi.fn()
    simulateKey = vi.fn()
    activateOverdrive = vi.fn()
    togglePause = vi.fn()
    onIntroStageChange: ((stage: string) => void) | null = null
    setOnIntroStageChange = vi.fn((cb: (stage: string) => void) => {
      this.onIntroStageChange = cb
    })

    constructor() {
      mocks.instances.push(this as unknown as Record<string, unknown>)
    }
  }

  return { Game }
})

beforeEach(() => {
  mocks.instances.length = 0
  window.matchMedia = vi.fn(() => ({
    matches: false,
    media: '',
    onchange: null,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    addListener: vi.fn(),
    removeListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })) as unknown as typeof window.matchMedia
})

async function renderGame(overrides: { intro?: boolean } = {}) {
  const onGameOver = vi.fn()
  const settings = { ...getDefaultSettings(), reducedMotion: true }
  const view = render(
    <GameCanvas onGameOver={onGameOver} settings={settings} intro={overrides.intro} />,
  )
  await waitFor(() => expect(mocks.instances).toHaveLength(1))
  return { ...view, game: mocks.instances[0], onGameOver }
}

describe('GameCanvas', () => {
  it('boots the engine with the persisted settings and starts the loop', async () => {
    const { game } = await renderGame()

    expect(game.start).toHaveBeenCalledTimes(1)
    expect(game.setGameMode).toHaveBeenCalledWith('classic')
    expect(game.setReducedMotion).toHaveBeenCalledWith(true)
    expect(game.setLocale).toHaveBeenCalled()
  })

  it('destroys the engine when the component unmounts', async () => {
    const { game, unmount } = await renderGame()

    unmount()

    expect(game.destroy).toHaveBeenCalledTimes(1)
  })

  it('only renders the skip control while the intro is on screen', async () => {
    const { game } = await renderGame({ intro: true })
    expect(screen.queryByRole('button', { name: /ENTER/ })).toBeNull()

    act(() => {
      ;(game.onIntroStageChange as (stage: string) => void)('cinematic')
    })
    const skip = screen.getByRole('button', { name: /ENTER/ })
    fireEvent.click(skip)
    expect(game.skipIntro).toHaveBeenCalledTimes(1)

    act(() => {
      ;(game.onIntroStageChange as (stage: string) => void)('done')
    })
    expect(screen.queryByRole('button', { name: /ENTER/ })).toBeNull()
  })

  it('cleans up safely when unmounted before the engine finishes loading', async () => {
    const { unmount } = render(
      <GameCanvas onGameOver={vi.fn()} settings={getDefaultSettings()} />,
    )
    unmount()

    // The dynamic import resolves after the unmount; the cancellation flag must
    // prevent a leaked engine instance.
    await Promise.resolve()
    await Promise.resolve()
    expect(mocks.instances).toHaveLength(0)
  })
})
