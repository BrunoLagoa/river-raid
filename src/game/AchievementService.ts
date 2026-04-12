import { readSecureJSON, writeSecureJSON } from './StorageService'

export type AchievementId =
  | 'first_bridge'
  | 'combo_master'
  | 'fuel_saver'

export interface Achievement {
  id: AchievementId
  title: string
  unlocked: boolean
  unlockedAt?: string
}

const ACHIEVEMENTS_KEY = 'river-raid-achievements'

const CATALOG: Achievement[] = [
  { id: 'first_bridge', title: 'Bridge Breaker', unlocked: false },
  { id: 'combo_master', title: 'Combo Master x4', unlocked: false },
  { id: 'fuel_saver', title: 'Fuel Saver 70%+', unlocked: false },
]

export function getStoredAchievements(): Achievement[] {
  const stored = readSecureJSON<Achievement[]>(ACHIEVEMENTS_KEY, CATALOG)
  const byId = new Map(stored.map((a) => [a.id, a]))
  return CATALOG.map((base) => {
    const existing = byId.get(base.id)
    if (!existing) return { ...base }
    return {
      ...base,
      unlocked: !!existing.unlocked,
      unlockedAt: existing.unlockedAt,
    }
  })
}

export function unlockAchievement(id: AchievementId): Achievement[] {
  const all = getStoredAchievements().map((a) => {
    if (a.id !== id || a.unlocked) return a
    return { ...a, unlocked: true, unlockedAt: new Date().toISOString() }
  })
  writeSecureJSON(ACHIEVEMENTS_KEY, all)
  return all
}

export function resetAchievements(): Achievement[] {
  writeSecureJSON(ACHIEVEMENTS_KEY, CATALOG)
  return getStoredAchievements()
}
