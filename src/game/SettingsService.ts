import { readSecureJSON, writeSecureJSON } from './StorageService'
import { isObjectiveBalanceProfile, type ObjectiveBalanceProfile } from './ObjectiveSystem'

export type Language = 'en' | 'pt-BR'

export function isLanguage(v: unknown): v is Language {
  return v === 'en' || v === 'pt-BR'
}

export interface GameSettings {
  masterVolume: number
  muted: boolean
  reducedMotion: boolean
  gamepadEnabled: boolean
  objectiveBalanceProfile: ObjectiveBalanceProfile
  language: Language
}

const SETTINGS_KEY = 'river-raid-settings'

const DEFAULT_SETTINGS: GameSettings = {
  masterVolume: 0.3,
  muted: false,
  reducedMotion: false,
  gamepadEnabled: true,
  objectiveBalanceProfile: 'conservative',
  language: 'en',
}

export function getStoredSettings(): GameSettings {
  const raw = readSecureJSON<Partial<GameSettings>>(SETTINGS_KEY, DEFAULT_SETTINGS)
  return {
    masterVolume: typeof raw.masterVolume === 'number' ? Math.max(0, Math.min(1, raw.masterVolume)) : DEFAULT_SETTINGS.masterVolume,
    muted: typeof raw.muted === 'boolean' ? raw.muted : DEFAULT_SETTINGS.muted,
    reducedMotion: typeof raw.reducedMotion === 'boolean' ? raw.reducedMotion : DEFAULT_SETTINGS.reducedMotion,
    gamepadEnabled: typeof raw.gamepadEnabled === 'boolean' ? raw.gamepadEnabled : DEFAULT_SETTINGS.gamepadEnabled,
    objectiveBalanceProfile: isObjectiveBalanceProfile(raw.objectiveBalanceProfile)
      ? raw.objectiveBalanceProfile
      : DEFAULT_SETTINGS.objectiveBalanceProfile,
    language: isLanguage(raw.language) ? raw.language : DEFAULT_SETTINGS.language,
  }
}

export function saveStoredSettings(next: GameSettings): GameSettings {
  const normalized: GameSettings = {
    masterVolume: Math.max(0, Math.min(1, next.masterVolume)),
    muted: !!next.muted,
    reducedMotion: !!next.reducedMotion,
    gamepadEnabled: !!next.gamepadEnabled,
    objectiveBalanceProfile: isObjectiveBalanceProfile(next.objectiveBalanceProfile)
      ? next.objectiveBalanceProfile
      : DEFAULT_SETTINGS.objectiveBalanceProfile,
    language: isLanguage(next.language) ? next.language : DEFAULT_SETTINGS.language,
  }
  writeSecureJSON(SETTINGS_KEY, normalized)
  return normalized
}

export function getDefaultSettings(): GameSettings {
  return { ...DEFAULT_SETTINGS }
}
