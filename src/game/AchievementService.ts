import { readSecureJSON, writeSecureJSON } from './StorageService'

export type AchievementId =
  | 'first_bridge'
  | 'combo_master'
  | 'fuel_saver'
  | 'sharpshooter'
  | 'survivor'
  | 'power_collector'
  | 'high_flyer'
  | 'untouchable'

export interface Achievement {
  id: AchievementId
  title: string
  description: string
  unlocked: boolean
  unlockedAt?: string
}

const ACHIEVEMENTS_KEY = 'river-raid-achievements'

const CATALOG: Achievement[] = [
  { id: 'first_bridge',    title: 'Bridge Breaker',   description: 'Destrua uma ponte',                     unlocked: false },
  { id: 'combo_master',    title: 'Combo Master',      description: 'Atinja combo x4',                       unlocked: false },
  { id: 'fuel_saver',      title: 'Fuel Saver',        description: 'Sobreviva 30s com combustível acima de 70%', unlocked: false },
  { id: 'sharpshooter',    title: 'Sharpshooter',      description: 'Destrua 10 inimigos em uma run',        unlocked: false },
  { id: 'survivor',        title: 'Survivor',          description: 'Sobreviva por 3 minutos',               unlocked: false },
  { id: 'power_collector', title: 'Power Collector',   description: 'Colete 3 power-ups em uma run',         unlocked: false },
  { id: 'high_flyer',      title: 'High Flyer',        description: 'Atinja 5.000 pontos',                   unlocked: false },
  { id: 'untouchable',     title: 'Untouchable',       description: 'Complete uma run sem perder vida',      unlocked: false },
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

export function isAchievementUnlocked(id: AchievementId): boolean {
  return getStoredAchievements().find((a) => a.id === id)?.unlocked ?? false
}

export function resetAchievements(): Achievement[] {
  writeSecureJSON(ACHIEVEMENTS_KEY, CATALOG)
  return getStoredAchievements()
}
