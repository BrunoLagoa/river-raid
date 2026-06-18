import { describe, it, expect, beforeEach } from 'vitest'
import {
  getDailyDateKey,
  getDailySeed,
  getDailyBest,
  saveDailyBest,
} from './DailyChallengeService'

beforeEach(() => {
  localStorage.clear()
})

describe('DailyChallengeService', () => {
  it('gera chave de data estável (YYYY-MM-DD)', () => {
    expect(getDailyDateKey(new Date(2026, 5, 17))).toBe('2026-06-17')
    expect(getDailyDateKey(new Date(2026, 0, 3))).toBe('2026-01-03')
  })

  it('seed é determinístico e único por dia', () => {
    const a = getDailySeed(new Date(2026, 5, 17))
    const b = getDailySeed(new Date(2026, 5, 17))
    const c = getDailySeed(new Date(2026, 5, 18))
    expect(a).toBe(20260617)
    expect(a).toBe(b)
    expect(a).not.toBe(c)
  })

  it('best começa em 0 e só sobe', () => {
    const key = '2026-06-17'
    expect(getDailyBest(key)).toBe(0)

    expect(saveDailyBest(500, key)).toBe(500)
    expect(getDailyBest(key)).toBe(500)

    // pontuação menor não substitui
    expect(saveDailyBest(300, key)).toBe(500)
    expect(getDailyBest(key)).toBe(500)

    // pontuação maior substitui
    expect(saveDailyBest(900, key)).toBe(900)
    expect(getDailyBest(key)).toBe(900)
  })

  it('mantém bests separados por data', () => {
    saveDailyBest(100, '2026-06-17')
    saveDailyBest(200, '2026-06-18')
    expect(getDailyBest('2026-06-17')).toBe(100)
    expect(getDailyBest('2026-06-18')).toBe(200)
  })
})
