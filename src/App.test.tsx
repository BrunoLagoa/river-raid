import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import App from './App'
import { getStrings } from './i18n'

vi.mock('./components/GameCanvas', () => ({
  default: () => <div data-testid="game-canvas" />,
}))

vi.mock('./game/SoundManager', () => {
  class SoundManager {
    init = vi.fn()
    destroy = vi.fn()
    setVolume = vi.fn()
    isMuted = vi.fn(() => false)
    toggleMute = vi.fn()
    startMenuMusic = vi.fn()
    stopMusic = vi.fn()
  }
  return { SoundManager }
})

const t = getStrings('en')

beforeEach(() => {
  localStorage.clear()
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

describe('App navigation', () => {
  it('starts on the menu and enters the tutorial and settings screens', () => {
    render(<App />)

    expect(screen.getByText(t.menuBtnStart)).toBeTruthy()

    fireEvent.click(screen.getByRole('button', { name: t.menuBtnTutorial }))
    expect(screen.getByText(t.tutorialTitle)).toBeTruthy()

    fireEvent.click(screen.getByRole('button', { name: t.tutorialBtnBack }))
    expect(screen.getByText(t.menuBtnStart)).toBeTruthy()

    fireEvent.click(screen.getByRole('button', { name: t.menuBtnSettings }))
    expect(screen.getByText(t.settingsTitle)).toBeTruthy()

    fireEvent.click(screen.getByRole('button', { name: t.settingsBtnBack }))
    expect(screen.getByText(t.menuBtnStart)).toBeTruthy()
  })

  it('opens the mode selector from the menu', () => {
    render(<App />)

    fireEvent.click(screen.getByRole('button', { name: new RegExp(t.menuBtnModes) }))

    expect(screen.getByText(t.modeSelectTitle)).toBeTruthy()
  })

  it('mounts the game canvas when a run starts', () => {
    render(<App />)

    fireEvent.click(screen.getByRole('button', { name: new RegExp(t.menuBtnStart) }))

    expect(screen.getByTestId('game-canvas')).toBeTruthy()
  })

  it('keeps html lang in sync with the selected locale', () => {
    render(<App />)

    expect(document.documentElement.lang).toBe('en')
  })
})
