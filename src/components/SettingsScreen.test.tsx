import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, screen, fireEvent, cleanup } from '@testing-library/react'
import SettingsScreen from './SettingsScreen'
import { getDefaultSettings, type GameSettings } from '../game/SettingsService'
import { getStrings } from '../i18n'

const t = getStrings('en')

afterEach(cleanup)

function renderSettings(overrides: Partial<GameSettings> = {}) {
  const onUpdate = vi.fn()
  const onBack = vi.fn()
  const onPlay = vi.fn()
  const settings: GameSettings = { ...getDefaultSettings(), ...overrides }

  render(
    <SettingsScreen
      settings={settings}
      achievements={[]}
      t={t}
      onUpdate={onUpdate}
      onBack={onBack}
      onPlay={onPlay}
    />
  )

  return { onUpdate, onBack, onPlay, settings }
}

describe('SettingsScreen', () => {
  it('renderiza os sliders de audio e dispara updates', () => {
    const { onUpdate } = renderSettings({ masterVolume: 0.8 })
    expect(screen.getByText(t.settingsLabelVolume)).toBeTruthy()

    const sliders = screen.getAllByRole('slider')
    fireEvent.change(sliders[0], { target: { value: '50' } })
    expect(onUpdate).toHaveBeenCalledWith({ masterVolume: 0.5 })
  })

  it('alterna o checkbox de feedback tatil / haptics', () => {
    const { onUpdate } = renderSettings({ hapticsEnabled: true })
    const hapticsLabel = screen.getByText(t.settingsLabelHaptics)
    const checkbox = hapticsLabel.closest('label')?.querySelector('input[type="checkbox"]')
    expect(checkbox).toBeTruthy()
    expect((checkbox as HTMLInputElement).checked).toBe(true)

    fireEvent.click(checkbox!)
    expect(onUpdate).toHaveBeenCalledWith({ hapticsEnabled: false })
  })

  it('abre a modal de remapeamento de teclado', () => {
    renderSettings()
    const configBtn = screen.getByText(`⌨ ${t.settingsBtnConfigureKeys}`)
    fireEvent.click(configBtn)

    expect(screen.getByTestId('keybinding-modal-backdrop')).toBeTruthy()
    expect(screen.getByText(t.keybindModalTitle)).toBeTruthy()
  })

  it('permite selecionar o modo de controle mobile', () => {
    const { onUpdate } = renderSettings({ mobileControlMode: 'joystick' })
    const selects = screen.getAllByRole('combobox')
    const mobileSelect = selects[0]

    fireEvent.change(mobileSelect, { target: { value: 'dpad' } })
    expect(onUpdate).toHaveBeenCalledWith({ mobileControlMode: 'dpad' })
  })

  it('dispara onBack e onPlay', () => {
    const { onBack, onPlay } = renderSettings()
    fireEvent.click(screen.getByText(t.settingsBtnBack))
    fireEvent.click(screen.getByText(t.settingsBtnPlay))

    expect(onBack).toHaveBeenCalledTimes(1)
    expect(onPlay).toHaveBeenCalledTimes(1)
  })
})
