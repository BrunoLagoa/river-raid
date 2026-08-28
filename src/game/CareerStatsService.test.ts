import { describe, it, expect, beforeEach, vi } from 'vitest'
import { CareerStatsService, getDefaultCareerStats, CAREER_STATS_STORAGE_KEY } from './CareerStatsService'

describe('CareerStatsService', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.restoreAllMocks()
  })

  it('inicia com estatisticas zeradas padrao', () => {
    const service = new CareerStatsService()
    const stats = service.getStats()
    expect(stats.totalRuns).toBe(0)
    expect(stats.totalFlightTimeSeconds).toBe(0)
    expect(stats.totalScoreAccumulated).toBe(0)
    expect(service.getTotalEnemiesDestroyed()).toBe(0)
    expect(service.getAccuracyPercentage()).toBe(0)
    expect(service.getFormattedFlightTime()).toBe('0s')
  })

  it('registra e acumula partidas sucessivas', () => {
    const service = new CareerStatsService()

    service.recordRun({
      flightTimeSeconds: 125,
      score: 3500,
      fuelPickedUp: 6,
      enemiesKilled: {
        helicopter: 5,
        plane: 3,
        boat: 2,
        bridge: 1,
      },
      shotsFired: 50,
      shotsHit: 35,
      highestCombo: 3,
    })

    expect(service.getStats().totalRuns).toBe(1)
    expect(service.getStats().totalFlightTimeSeconds).toBe(125)
    expect(service.getStats().totalScoreAccumulated).toBe(3500)
    expect(service.getStats().totalFuelPickedUp).toBe(6)
    expect(service.getStats().enemiesKilled.helicopter).toBe(5)
    expect(service.getStats().enemiesKilled.bridge).toBe(1)
    expect(service.getStats().highestComboEver).toBe(3)
    expect(service.getAccuracyPercentage()).toBe(70) // 35 / 50 = 70%
    expect(service.getFormattedFlightTime()).toBe('2m 5s')

    // Segunda partida
    service.recordRun({
      flightTimeSeconds: 3700,
      score: 10000,
      fuelPickedUp: 10,
      enemiesKilled: {
        helicopter: 2,
        boss: 1,
      },
      shotsFired: 50,
      shotsHit: 45,
      highestCombo: 4,
    })

    expect(service.getStats().totalRuns).toBe(2)
    expect(service.getStats().totalFlightTimeSeconds).toBe(3825)
    expect(service.getStats().enemiesKilled.helicopter).toBe(7)
    expect(service.getStats().enemiesKilled.boss).toBe(1)
    expect(service.getStats().highestComboEver).toBe(4)
    expect(service.getFormattedFlightTime()).toBe('1h 3m 45s')

    // Persistência em nova instância
    const service2 = new CareerStatsService()
    expect(service2.getStats().totalRuns).toBe(2)
    expect(service2.getStats().totalScoreAccumulated).toBe(13500)
  })

  it('permite resetar as estatisticas de carreira', () => {
    const service = new CareerStatsService()
    service.recordRun({
      flightTimeSeconds: 100,
      score: 5000,
      fuelPickedUp: 2,
      enemiesKilled: { tank: 4 },
      shotsFired: 20,
      shotsHit: 10,
      highestCombo: 2,
    })

    expect(service.getStats().totalRuns).toBe(1)
    service.resetStats()

    expect(service.getStats().totalRuns).toBe(0)
    expect(service.getStats().totalScoreAccumulated).toBe(0)
  })

  it('trata valores corrompidos no localStorage com fallback gracioso', () => {
    localStorage.setItem(CAREER_STATS_STORAGE_KEY, 'corrupted-data')
    const service = new CareerStatsService()
    expect(service.getStats()).toEqual(getDefaultCareerStats())
  })
})
