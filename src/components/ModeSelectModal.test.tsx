import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { ModeSelectModal } from './ModeSelectModal'
import { getStrings } from '../i18n'

const t = getStrings('en')

describe('ModeSelectModal', () => {
  it('nao renderiza nada quando isOpen = false', () => {
    const onClose = vi.fn()
    const onSelectMode = vi.fn()
    render(<ModeSelectModal isOpen={false} onClose={onClose} onSelectMode={onSelectMode} locale={t} />)
    expect(screen.queryByTestId('mode-select-backdrop')).toBeNull()
  })

  it('renderiza os 5 modos de jogo quando isOpen = true', () => {
    const onClose = vi.fn()
    const onSelectMode = vi.fn()
    render(<ModeSelectModal isOpen={true} onClose={onClose} onSelectMode={onSelectMode} locale={t} />)

    expect(screen.getByText(t.modeSelectTitle)).toBeDefined()
    expect(screen.getByText(t.modeClassicName)).toBeDefined()
    expect(screen.getByText(t.modeHardcoreName)).toBeDefined()
    expect(screen.getByText(t.modeBossRushName)).toBeDefined()
    expect(screen.getByText(t.modeZenName)).toBeDefined()
    expect(screen.getByText(t.modeDailyName)).toBeDefined()
  })

  it('permite selecionar um modo e iniciar a missao', () => {
    const onClose = vi.fn()
    const onSelectMode = vi.fn()
    render(<ModeSelectModal isOpen={true} onClose={onClose} onSelectMode={onSelectMode} locale={t} />)

    const hardcoreCard = screen.getByTestId('mode-card-hardcore')
    fireEvent.click(hardcoreCard)

    const launchBtn = screen.getByTestId('mode-modal-launch-btn')
    fireEvent.click(launchBtn)

    expect(onSelectMode).toHaveBeenCalledWith('hardcore')
    expect(onClose).toHaveBeenCalled()
  })

  it('fecha o modal ao clicar em voltar', () => {
    const onClose = vi.fn()
    const onSelectMode = vi.fn()
    render(<ModeSelectModal isOpen={true} onClose={onClose} onSelectMode={onSelectMode} locale={t} />)

    const closeBtn = screen.getByTestId('mode-modal-close-btn')
    fireEvent.click(closeBtn)
    expect(onClose).toHaveBeenCalled()
  })
})
