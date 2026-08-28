import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { HangarScreen } from './HangarScreen'
import { getStrings } from '../i18n'

const t = getStrings('en')

describe('HangarScreen', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.restoreAllMocks()
  })

  it('renderiza o Hangar com o aviao classic equipado inicialmente', () => {
    const onBack = vi.fn()
    render(<HangarScreen onBack={onBack} locale={t} unlockedAchievements={[]} highScore={0} />)

    expect(screen.getByText(t.hangarTitle)).toBeDefined()
    expect(screen.getByText('Classic 2600')).toBeDefined()
    expect(screen.getByText(`★ ${t.hangarBtnEquipped}`)).toBeDefined()
  })

  it('navega entre skins usando os botoes prev e next', () => {
    const onBack = vi.fn()
    render(<HangarScreen onBack={onBack} locale={t} unlockedAchievements={[]} highScore={0} />)

    const nextBtn = screen.getByTestId('hangar-next-btn')
    fireEvent.click(nextBtn)

    expect(screen.getByText('Stealth Nighthawk')).toBeDefined()
    expect(screen.getByText(t.hangarBtnLocked)).toBeDefined()

    const prevBtn = screen.getByTestId('hangar-prev-btn')
    fireEvent.click(prevBtn)
    expect(screen.getByText('Classic 2600')).toBeDefined()
  })

  it('permite equipar skin desbloqueada e chama onSkinChanged', () => {
    const onBack = vi.fn()
    const onSkinChanged = vi.fn()
    render(
      <HangarScreen
        onBack={onBack}
        locale={t}
        unlockedAchievements={['sharpshooter']}
        highScore={0}
        onSkinChanged={onSkinChanged}
      />
    )

    const nextBtn = screen.getByTestId('hangar-next-btn')
    fireEvent.click(nextBtn) // Vai para Stealth

    const equipBtn = screen.getByTestId('hangar-equip-btn')
    expect(equipBtn.textContent).toBe(t.hangarBtnEquip)

    fireEvent.click(equipBtn)
    expect(onSkinChanged).toHaveBeenCalledWith('stealth')
    expect(equipBtn.textContent).toBe(`★ ${t.hangarBtnEquipped}`)
  })

  it('chama callback onBack ao clicar no botao de voltar', () => {
    const onBack = vi.fn()
    render(<HangarScreen onBack={onBack} locale={t} />)

    const backBtn = screen.getByTestId('hangar-back-btn')
    fireEvent.click(backBtn)
    expect(onBack).toHaveBeenCalled()
  })
})
