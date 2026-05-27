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
  { id: 'first_bridge',    title: 'Bridge Breaker',   description: 'Destrua uma ponte',                          unlocked: false },
  { id: 'combo_master',    title: 'Combo Master',      description: 'Termine uma run com combo x4 ativo',         unlocked: false },
  { id: 'fuel_saver',      title: 'Fuel Saver',        description: 'Mantenha combustível acima de 75% por 60s',  unlocked: false },
  { id: 'sharpshooter',    title: 'Sharpshooter',      description: 'Destrua 50 inimigos em uma run',             unlocked: false },
  { id: 'survivor',        title: 'Survivor',          description: 'Alcance 10.000 pontos em uma run',           unlocked: false },
  { id: 'power_collector', title: 'Power Collector',   description: 'Colete 10 power-ups em uma run',             unlocked: false },
  { id: 'high_flyer',      title: 'High Flyer',        description: 'Alcance 50.000 pontos em uma run',           unlocked: false },
  { id: 'untouchable',     title: 'Untouchable',       description: 'Complete uma run sem perder nenhuma vida',   unlocked: false },
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
