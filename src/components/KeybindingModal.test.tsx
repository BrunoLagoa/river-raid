import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { KeybindingModal } from './KeybindingModal'
import { DEFAULT_KEYBINDINGS, formatKeyDisplay } from '../game/KeybindingService'
import { getStrings } from '../i18n'

describe('KeybindingModal', () => {
  const locale = getStrings('en')

  it('formatKeyDisplay formata codigos de teclas corretamente', () => {
    expect(formatKeyDisplay('ArrowLeft')).toBe('← LEFT')
    expect(formatKeyDisplay('Space')).toBe('SPACE')
    expect(formatKeyDisplay('KeyZ')).toBe('Z')
    expect(formatKeyDisplay('Digit1')).toBe('1')
    expect(formatKeyDisplay('Numpad5')).toBe('NUM 5')
    expect(formatKeyDisplay('')).toBe('—')
  })

  it('nao renderiza quando isOpen e false', () => {
    render(
      <KeybindingModal
        isOpen={false}
        onClose={vi.fn()}
        currentBindings={DEFAULT_KEYBINDINGS}
        onSave={vi.fn()}
        locale={locale}
      />
    )
    expect(screen.queryByTestId('keybinding-modal-backdrop')).toBeNull()
  })

  it('renderiza e permite reatribuir tecla por evento keydown', () => {
    const handleSave = vi.fn()
    const handleClose = vi.fn()

    render(
      <KeybindingModal
        isOpen={true}
        onClose={handleClose}
        currentBindings={DEFAULT_KEYBINDINGS}
        onSave={handleSave}
        locale={locale}
      />
    )

    expect(screen.getByText(locale.keybindModalTitle)).toBeDefined()

    // Clica no slot primário da tecla de tiro (SPACE)
    const shootButtons = screen.getAllByRole('button', { name: 'SPACE' })
    fireEvent.click(shootButtons[0])

    // Mensagem de escuta ativa
    expect(screen.getByText(locale.keybindListeningPrompt)).toBeDefined()

    // Pressiona tecla 'KeyZ'
    fireEvent.keyDown(window, { code: 'KeyZ' })

    // O botão agora deve exibir 'Z'
    expect(screen.getByRole('button', { name: 'Z' })).toBeDefined()

    // Clica em Concluir
    fireEvent.click(screen.getByText(locale.keybindBtnDone))
    expect(handleSave).toHaveBeenCalledWith(expect.objectContaining({
      shoot: expect.arrayContaining(['KeyZ']),
    }))
    expect(handleClose).toHaveBeenCalled()
  })

  it('permite restaurar atalhos padrao', () => {
    const handleSave = vi.fn()
    const custom = { ...DEFAULT_KEYBINDINGS, shoot: ['KeyK'] }

    render(
      <KeybindingModal
        isOpen={true}
        onClose={vi.fn()}
        currentBindings={custom}
        onSave={handleSave}
        locale={locale}
      />
    )

    expect(screen.getByRole('button', { name: 'K' })).toBeDefined()

    // Clica em restaurar padrões
    fireEvent.click(screen.getByText(locale.keybindBtnReset))

    // Deve voltar para SPACE
    expect(screen.getByRole('button', { name: 'SPACE' })).toBeDefined()
  })
})
