import { readSecureJSON, writeSecureJSON } from './StorageService'

export interface RankingEntry {
  id?: string
  name: string
  score: number
  date: string
}

const RANKING_KEY = 'river-raid-ranking'

export function getStoredRanking(): RankingEntry[] {
  const parsed = readSecureJSON<RankingEntry[]>(RANKING_KEY, [])
  return parsed
    .filter((entry) => entry && typeof entry.name === 'string' && typeof entry.score === 'number')
    .sort((a, b) => b.score - a.score)
    .slice(0, 10)
}

export function qualifiesForRanking(score: number): boolean {
  const ranking = getStoredRanking()
  return ranking.length < 10 || score > ranking[ranking.length - 1].score
}

export function saveStoredRankingEntry(entry: RankingEntry): RankingEntry[] {
  const ranking = [...getStoredRanking(), entry]
    .sort((a, b) => b.score - a.score)
    .slice(0, 10)
  writeSecureJSON(RANKING_KEY, ranking)
  return ranking
}
