import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, screen, fireEvent, cleanup } from '@testing-library/react'
import MenuScreen from './MenuScreen'
import { getStrings } from '../i18n'

const t = getStrings('en')

afterEach(cleanup)

function renderMenu(overrides: Partial<Parameters<typeof MenuScreen>[0]> = {}) {
  const props = {
    t,
    onStart: vi.fn(),
    onTutorial: vi.fn(),
    onSettings: vi.fn(),
    muted: false,
    onToggleMute: vi.fn(),
    ...overrides,
  }
  render(<MenuScreen {...props} />)
  return props
}

describe('MenuScreen', () => {
  it('renderiza o título e as ações', () => {
    renderMenu()
    expect(screen.getByText('RIVER RAID')).toBeTruthy()
    expect(screen.getByText(t.menuBtnStart)).toBeTruthy()
    expect(screen.getByText(t.menuBtnTutorial)).toBeTruthy()
    expect(screen.getByText(t.menuBtnSettings)).toBeTruthy()
  })

  it('dispara os callbacks dos botões', () => {
    const props = renderMenu()
    fireEvent.click(screen.getByText(t.menuBtnStart))
    fireEvent.click(screen.getByText(t.menuBtnTutorial))
    fireEvent.click(screen.getByText(t.menuBtnSettings))
    expect(props.onStart).toHaveBeenCalledTimes(1)
    expect(props.onTutorial).toHaveBeenCalledTimes(1)
    expect(props.onSettings).toHaveBeenCalledTimes(1)
  })

  it('o botão de mute reflete o estado e alterna', () => {
    const props = renderMenu({ muted: false })
    const muteBtn = screen.getByLabelText(t.menuMute)
    expect(muteBtn.getAttribute('aria-pressed')).toBe('false')
    fireEvent.click(muteBtn)
    expect(props.onToggleMute).toHaveBeenCalledTimes(1)
  })

  it('mostra rótulo de "ativar som" quando mudo', () => {
    renderMenu({ muted: true })
    const muteBtn = screen.getByLabelText(t.menuUnmute)
    expect(muteBtn.getAttribute('aria-pressed')).toBe('true')
  })
})
