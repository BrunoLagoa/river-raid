import { readSecureJSON, writeSecureJSON } from './StorageService'
import type { AchievementId } from './AchievementService'

export type SkinId = 'classic' | 'stealth' | 'biplane' | 'cyber_neon'

export interface SkinDef {
  id: SkinId
  nameKey: string
  descKey: string
  requirementDescKey: string
  unlockedByDefault: boolean
  requiredAchievement?: AchievementId
  requiredScore?: number
  smokeColorNormal: string
  smokeColorAccelerate: string
  smokeColorBrake: string
  primaryColor: string
  accentColor: string
}

export const EQUIPPED_SKIN_STORAGE_KEY = 'river_raid_equipped_skin'

export const SKIN_CATALOG: Record<SkinId, SkinDef> = {
  classic: {
    id: 'classic',
    nameKey: 'skinClassicName',
    descKey: 'skinClassicDesc',
    requirementDescKey: 'skinRequirementDefault',
    unlockedByDefault: true,
    smokeColorNormal: '#888888',
    smokeColorAccelerate: '#aa7744',
    smokeColorBrake: '#555555',
    primaryColor: '#e0c020',
    accentColor: '#cc2020',
  },
  stealth: {
    id: 'stealth',
    nameKey: 'skinStealthName',
    descKey: 'skinStealthDesc',
    requirementDescKey: 'skinRequirementSharpshooter',
    unlockedByDefault: false,
    requiredAchievement: 'sharpshooter',
    smokeColorNormal: '#a855f7',
    smokeColorAccelerate: '#c084fc',
    smokeColorBrake: '#3b0764',
    primaryColor: '#1e1b4b',
    accentColor: '#9333ea',
  },
  biplane: {
    id: 'biplane',
    nameKey: 'skinBiplaneName',
    descKey: 'skinBiplaneDesc',
    requirementDescKey: 'skinRequirementFirstBridge',
    unlockedByDefault: false,
    requiredAchievement: 'first_bridge',
    smokeColorNormal: '#e2e8f0',
    smokeColorAccelerate: '#94a3b8',
    smokeColorBrake: '#475569',
    primaryColor: '#4d5c38',
    accentColor: '#d97706',
  },
  cyber_neon: {
    id: 'cyber_neon',
    nameKey: 'skinCyberNeonName',
    descKey: 'skinCyberNeonDesc',
    requirementDescKey: 'skinRequirementScore25k',
    unlockedByDefault: false,
    requiredScore: 25000,
    smokeColorNormal: '#00f0ff',
    smokeColorAccelerate: '#ff007f',
    smokeColorBrake: '#0f172a',
    primaryColor: '#00e5ff',
    accentColor: '#ff0055',
  },
}

export class SkinService {
  private equippedSkinId: SkinId = 'classic'

  constructor() {
    this.equippedSkinId = this.loadEquippedSkin()
  }

  getAllSkins(): SkinDef[] {
    return Object.values(SKIN_CATALOG)
  }

  getSkinDef(id: SkinId): SkinDef {
    return SKIN_CATALOG[id] ?? SKIN_CATALOG.classic
  }

  isSkinUnlocked(
    id: SkinId,
    unlockedAchievementIds: string[] = [],
    highScore = 0
  ): boolean {
    const skin = this.getSkinDef(id)
    if (skin.unlockedByDefault) return true

    if (skin.requiredAchievement && unlockedAchievementIds.includes(skin.requiredAchievement)) {
      return true
    }

    if (skin.requiredScore != null && highScore >= skin.requiredScore) {
      return true
    }

    return false
  }

  getEquippedSkinId(): SkinId {
    return this.equippedSkinId
  }

  getEquippedSkinDef(): SkinDef {
    return this.getSkinDef(this.equippedSkinId)
  }

  setEquippedSkin(
    id: SkinId,
    unlockedAchievementIds: string[] = [],
    highScore = 0
  ): boolean {
    if (!this.isSkinUnlocked(id, unlockedAchievementIds, highScore)) {
      return false
    }

    this.equippedSkinId = id
    this.saveEquippedSkin(id)
    return true
  }

  private loadEquippedSkin(): SkinId {
    const saved = readSecureJSON<string>(EQUIPPED_SKIN_STORAGE_KEY, 'classic')
    if (saved && saved in SKIN_CATALOG) {
      return saved as SkinId
    }
    return 'classic'
  }

  private saveEquippedSkin(id: SkinId): void {
    writeSecureJSON(EQUIPPED_SKIN_STORAGE_KEY, id)
  }
}
