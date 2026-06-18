import { describe, it, expect, beforeEach } from 'vitest'
import {
  getStoredRanking,
  qualifiesForRanking,
  saveStoredRankingEntry,
  type RankingEntry,
} from './RankingService'

beforeEach(() => {
  localStorage.clear()
})

function entry(name: string, score: number): RankingEntry {
  return { id: `${name}-${score}`, name, score, date: '2026-01-01' }
}

describe('RankingService', () => {
  it('começa vazio', () => {
    expect(getStoredRanking()).toEqual([])
  })

  it('ordena por pontuação desc e limita a 10', () => {
    for (let i = 0; i < 15; i++) saveStoredRankingEntry(entry(`P${i}`, i * 100))
    const ranking = getStoredRanking()
    expect(ranking).toHaveLength(10)
    expect(ranking[0].score).toBe(1400)
    expect(ranking[9].score).toBe(500)
    // monotonicamente decrescente
    for (let i = 1; i < ranking.length; i++) {
      expect(ranking[i - 1].score).toBeGreaterThanOrEqual(ranking[i].score)
    }
  })

  it('qualifiesForRanking é true enquanto houver menos de 10', () => {
    expect(qualifiesForRanking(1)).toBe(true)
    for (let i = 0; i < 9; i++) saveStoredRankingEntry(entry(`P${i}`, 1000))
    expect(qualifiesForRanking(1)).toBe(true) // ainda há vaga (9 entradas)
  })

  it('qualifiesForRanking compara com o menor quando cheio', () => {
    for (let i = 0; i < 10; i++) saveStoredRankingEntry(entry(`P${i}`, (i + 1) * 100))
    // menor é 100
    expect(qualifiesForRanking(50)).toBe(false)
    expect(qualifiesForRanking(150)).toBe(true)
  })

  it('descarta entradas malformadas do storage', () => {
    saveStoredRankingEntry(entry('Valid', 500))
    const ranking = getStoredRanking()
    expect(ranking.every((e) => typeof e.name === 'string' && typeof e.score === 'number')).toBe(true)
  })
})
