import { readSecureJSON, writeSecureJSON } from './StorageService'

export interface GameSettings {
  masterVolume: number
  muted: boolean
  reducedMotion: boolean
  gamepadEnabled: boolean
}

const SETTINGS_KEY = 'river-raid-settings'

const DEFAULT_SETTINGS: GameSettings = {
  masterVolume: 0.3,
  muted: false,
  reducedMotion: false,
  gamepadEnabled: true,
}

export function getStoredSettings(): GameSettings {
  const raw = readSecureJSON<Partial<GameSettings>>(SETTINGS_KEY, DEFAULT_SETTINGS)
  return {
    masterVolume: typeof raw.masterVolume === 'number' ? Math.max(0, Math.min(1, raw.masterVolume)) : DEFAULT_SETTINGS.masterVolume,
    muted: typeof raw.muted === 'boolean' ? raw.muted : DEFAULT_SETTINGS.muted,
    reducedMotion: typeof raw.reducedMotion === 'boolean' ? raw.reducedMotion : DEFAULT_SETTINGS.reducedMotion,
    gamepadEnabled: typeof raw.gamepadEnabled === 'boolean' ? raw.gamepadEnabled : DEFAULT_SETTINGS.gamepadEnabled,
  }
}

export function saveStoredSettings(next: GameSettings): GameSettings {
  const normalized: GameSettings = {
    masterVolume: Math.max(0, Math.min(1, next.masterVolume)),
    muted: !!next.muted,
    reducedMotion: !!next.reducedMotion,
    gamepadEnabled: !!next.gamepadEnabled,
  }
  writeSecureJSON(SETTINGS_KEY, normalized)
  return normalized
}

export function getDefaultSettings(): GameSettings {
  return { ...DEFAULT_SETTINGS }
}
