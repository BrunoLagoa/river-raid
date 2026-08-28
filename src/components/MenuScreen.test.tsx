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
    onDaily: vi.fn(),
    onModes: vi.fn(),
    onTutorial: vi.fn(),
    onSettings: vi.fn(),
    onHangar: vi.fn(),
    onStats: vi.fn(),
    muted: false,
    onToggleMute: vi.fn(),
    dailyBest: 0,
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
    expect(screen.getByText(`🎮 ${t.menuBtnModes}`)).toBeTruthy()
    expect(screen.getByText(`🛩️ ${t.menuBtnHangar}`)).toBeTruthy()
    expect(screen.getByText(`📊 ${t.menuBtnStats}`)).toBeTruthy()
    expect(screen.getByText(t.menuBtnTutorial)).toBeTruthy()
    expect(screen.getByText(t.menuBtnSettings)).toBeTruthy()
  })

  it('dispara os callbacks dos botões', () => {
    const props = renderMenu()
    fireEvent.click(screen.getByText(t.menuBtnStart))
    fireEvent.click(screen.getByText(`🎮 ${t.menuBtnModes}`))
    fireEvent.click(screen.getByText(`🛩️ ${t.menuBtnHangar}`))
    fireEvent.click(screen.getByText(`📊 ${t.menuBtnStats}`))
    fireEvent.click(screen.getByText(t.menuBtnTutorial))
    fireEvent.click(screen.getByText(t.menuBtnSettings))
    expect(props.onStart).toHaveBeenCalledTimes(1)
    expect(props.onModes).toHaveBeenCalledTimes(1)
    expect(props.onHangar).toHaveBeenCalledTimes(1)
    expect(props.onStats).toHaveBeenCalledTimes(1)
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

  it('dispara o desafio diário', () => {
    const props = renderMenu()
    fireEvent.click(screen.getByText(new RegExp(t.menuBtnDaily)))
    expect(props.onDaily).toHaveBeenCalledTimes(1)
  })

  it('mostra o melhor do dia apenas quando > 0', () => {
    const { unmount } = render(
      <MenuScreen
        t={t}
        onStart={vi.fn()}
        onDaily={vi.fn()}
        onTutorial={vi.fn()}
        onSettings={vi.fn()}
        muted={false}
        onToggleMute={vi.fn()}
        dailyBest={0}
      />,
    )
    expect(screen.queryByText(new RegExp(t.menuDailyBest))).toBeNull()
    unmount()

    renderMenu({ dailyBest: 4200 })
    expect(screen.getByText(new RegExp(t.menuDailyBest))).toBeTruthy()
    expect(screen.getByText(/004200/)).toBeTruthy()
  })
})
