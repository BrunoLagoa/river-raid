import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { CareerStatsModal } from './CareerStatsModal'
import { CareerStatsService } from '../game/CareerStatsService'
import { getStrings } from '../i18n'

const t = getStrings('en')

describe('CareerStatsModal', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.restoreAllMocks()
  })

  it('nao renderiza nada quando isOpen = false', () => {
    const onClose = vi.fn()
    render(<CareerStatsModal isOpen={false} onClose={onClose} locale={t} />)
    expect(screen.queryByTestId('career-stats-backdrop')).toBeNull()
  })

  it('renderiza estatisticas de carreira corretamente quando isOpen = true', () => {
    const statsService = new CareerStatsService()
    statsService.recordRun({
      flightTimeSeconds: 150,
      score: 5000,
      fuelPickedUp: 8,
      enemiesKilled: { helicopter: 12, bridge: 2 },
      shotsFired: 100,
      shotsHit: 85,
      highestCombo: 4,
    })

    const onClose = vi.fn()
    render(<CareerStatsModal isOpen={true} onClose={onClose} locale={t} />)

    expect(screen.getByText(t.statsTitle)).toBeDefined()
    expect(screen.getByText('85%')).toBeDefined()
    expect(screen.getByText('4x')).toBeDefined()
    expect(screen.getByText('2m 30s')).toBeDefined()
    expect(screen.getByText('5,000')).toBeDefined()
  })

  it('permite resetar estatisticas com confirmacao', () => {
    const statsService = new CareerStatsService()
    statsService.recordRun({
      flightTimeSeconds: 100,
      score: 5000,
      fuelPickedUp: 1,
      enemiesKilled: {},
      shotsFired: 10,
      shotsHit: 5,
      highestCombo: 1,
    })

    const onClose = vi.fn()
    render(<CareerStatsModal isOpen={true} onClose={onClose} locale={t} />)

    const resetBtn = screen.getByTestId('stats-reset-btn')
    fireEvent.click(resetBtn) // 1st click: pede confirmacao

    expect(screen.getByText(t.statsResetConfirm)).toBeDefined()

    fireEvent.click(resetBtn) // 2nd click: confirma reset
    expect(screen.getByText('0s')).toBeDefined()
  })

  it('chama onClose ao clicar no botao fechar', () => {
    const onClose = vi.fn()
    render(<CareerStatsModal isOpen={true} onClose={onClose} locale={t} />)

    const closeBtn = screen.getByTestId('stats-close-btn')
    fireEvent.click(closeBtn)
    expect(onClose).toHaveBeenCalled()
  })
})
