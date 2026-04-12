import type { RankingEntry } from './RankingService'

interface OnlineRankingResponse {
  entries: RankingEntry[]
}


export async function fetchOnlineRanking(): Promise<RankingEntry[] | null> {
  const apiUrl = (import.meta.env.VITE_RIVER_RAID_RANKING_API as string | undefined)?.trim()
  if (!apiUrl) return null

  try {
    const controller = new AbortController()
    const timeout = window.setTimeout(() => controller.abort(), 2500)
    const res = await fetch(apiUrl, { method: 'GET', signal: controller.signal })
    window.clearTimeout(timeout)
    if (!res.ok) return null
    const data = (await res.json()) as OnlineRankingResponse
    if (!data || !Array.isArray(data.entries)) return null
    return data.entries
      .filter((entry) => entry && typeof entry.name === 'string' && typeof entry.score === 'number')
      .sort((a, b) => b.score - a.score)
      .slice(0, 10)
  } catch {
    return null
  }
}

export async function submitOnlineScore(entry: RankingEntry): Promise<boolean> {
  const apiUrl = (import.meta.env.VITE_RIVER_RAID_RANKING_API as string | undefined)?.trim()
  if (!apiUrl) return false

  try {
    const controller = new AbortController()
    const timeout = window.setTimeout(() => controller.abort(), 2500)
    const res = await fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      signal: controller.signal,
      body: JSON.stringify(entry),
    })
    window.clearTimeout(timeout)
    return res.ok
  } catch {
    return false
  }
}
