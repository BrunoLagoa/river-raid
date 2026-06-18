import { readSecureNumber, writeSecureNumber } from './StorageService'

// A "daily challenge" run seeds every gameplay system (river layout, enemy /
// fuel / power-up placement) from the calendar date, so everyone playing on the
// same day gets the same map and competes on skill. The deterministic
// RandomSource is already threaded through the engine — we just pick the seed.

const DAILY_BEST_PREFIX = 'river-raid-daily-'

/** Stable 'YYYY-MM-DD' key for the given date (local time). */
export function getDailyDateKey(date: Date = new Date()): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

/** Deterministic integer seed derived from the date (e.g. 2026-06-17 → 20260617). */
export function getDailySeed(date: Date = new Date()): number {
  return ((date.getFullYear() * 10000) + ((date.getMonth() + 1) * 100) + date.getDate()) >>> 0
}

export function getDailyBest(dateKey: string = getDailyDateKey()): number {
  return readSecureNumber(DAILY_BEST_PREFIX + dateKey, 0)
}

/** Persists `score` as the day's best if it beats the stored value; returns the best. */
export function saveDailyBest(score: number, dateKey: string = getDailyDateKey()): number {
  const best = getDailyBest(dateKey)
  if (score > best) {
    writeSecureNumber(DAILY_BEST_PREFIX + dateKey, score)
    return score
  }
  return best
}
