import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import TutorialScreen from './TutorialScreen'
import { getStrings } from '../i18n'

const t = getStrings('en')

describe('TutorialScreen', () => {
  it('renders the objective, control cards and every power-up', () => {
    render(<TutorialScreen t={t} onStartGame={vi.fn()} onBack={vi.fn()} />)

    expect(screen.getByText(t.tutorialTitle)).toBeTruthy()
    expect(screen.getByText(t.tutorialObjective)).toBeTruthy()
    expect(screen.getByText(t.tutorialCardNavigate)).toBeTruthy()
    expect(screen.getByText(t.tutorialCardCombat)).toBeTruthy()
    expect(screen.getByText(t.tutorialCardSurvive)).toBeTruthy()

    for (const name of Object.values(t.powerupNames)) {
      expect(screen.getByText(name)).toBeTruthy()
    }
  })

  it('starts the game and goes back through the action buttons', () => {
    const onStartGame = vi.fn()
    const onBack = vi.fn()
    render(<TutorialScreen t={t} onStartGame={onStartGame} onBack={onBack} />)

    fireEvent.click(screen.getByRole('button', { name: new RegExp(t.tutorialBtnStart) }))
    expect(onStartGame).toHaveBeenCalledTimes(1)

    fireEvent.click(screen.getByRole('button', { name: t.tutorialBtnBack }))
    expect(onBack).toHaveBeenCalledTimes(1)
  })
})
