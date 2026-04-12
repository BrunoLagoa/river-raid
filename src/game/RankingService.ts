export interface RankingEntry {
  id?: string
  name: string
  score: number
  date: string
}

const RANKING_KEY = 'river-raid-ranking'

export function getStoredRanking(): RankingEntry[] {
  try {
    const parsed = JSON.parse(localStorage.getItem(RANKING_KEY) || '[]') as RankingEntry[]
    return parsed
      .filter((entry) => entry && typeof entry.name === 'string' && typeof entry.score === 'number')
      .sort((a, b) => b.score - a.score)
      .slice(0, 10)
  } catch {
    return []
  }
}

export function qualifiesForRanking(score: number): boolean {
  const ranking = getStoredRanking()
  return ranking.length < 10 || score > ranking[ranking.length - 1].score
}

export function saveStoredRankingEntry(entry: RankingEntry): RankingEntry[] {
  const ranking = [...getStoredRanking(), entry]
    .sort((a, b) => b.score - a.score)
    .slice(0, 10)
  localStorage.setItem(RANKING_KEY, JSON.stringify(ranking))
  return ranking
}
