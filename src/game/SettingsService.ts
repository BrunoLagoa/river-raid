import { readSecureJSON, writeSecureJSON } from './StorageService'
import { isObjectiveBalanceProfile, type ObjectiveBalanceProfile } from './ObjectiveSystem'
import { isDifficulty, type Difficulty } from './constants'

export type Language = 'en' | 'pt-BR'

export function isLanguage(v: unknown): v is Language {
  return v === 'en' || v === 'pt-BR'
}

export interface GameSettings {
  masterVolume: number
  /**
   * Estado de sessão, não preferência: o jogo sempre abre com som e o jogador
   * silencia na hora (tecla `M`, botão do menu ou dos controles touch). Por
   * isso `muted` nunca é lido nem gravado no storage — um mute acidental não
   * deixa todas as partidas seguintes mudas. Volume fino fica em `masterVolume`,
   * que continua persistido.
   */
  muted: boolean
  reducedMotion: boolean
  weatherEffects: boolean
  dynamicLighting: boolean
  colorblindMode: boolean
  gamepadEnabled: boolean
  objectiveBalanceProfile: ObjectiveBalanceProfile
  difficulty: Difficulty
  language: Language
}

const SETTINGS_KEY = 'river-raid-settings'

const DEFAULT_SETTINGS: GameSettings = {
  masterVolume: 0.3,
  muted: false,
  reducedMotion: false,
  weatherEffects: true,
  dynamicLighting: true,
  colorblindMode: false,
  gamepadEnabled: true,
  objectiveBalanceProfile: 'conservative',
  difficulty: 'normal',
  language: 'en',
}

export function getStoredSettings(): GameSettings {
  const raw = readSecureJSON<Partial<GameSettings>>(SETTINGS_KEY, DEFAULT_SETTINGS)
  return {
    masterVolume: typeof raw.masterVolume === 'number' ? Math.max(0, Math.min(1, raw.masterVolume)) : DEFAULT_SETTINGS.masterVolume,
    // Sempre começa com som: ignora qualquer mute salvo por versões anteriores.
    muted: DEFAULT_SETTINGS.muted,
    reducedMotion: typeof raw.reducedMotion === 'boolean' ? raw.reducedMotion : DEFAULT_SETTINGS.reducedMotion,
    weatherEffects: typeof raw.weatherEffects === 'boolean' ? raw.weatherEffects : DEFAULT_SETTINGS.weatherEffects,
    dynamicLighting: typeof raw.dynamicLighting === 'boolean' ? raw.dynamicLighting : DEFAULT_SETTINGS.dynamicLighting,
    colorblindMode: typeof raw.colorblindMode === 'boolean' ? raw.colorblindMode : DEFAULT_SETTINGS.colorblindMode,
    gamepadEnabled: typeof raw.gamepadEnabled === 'boolean' ? raw.gamepadEnabled : DEFAULT_SETTINGS.gamepadEnabled,
    objectiveBalanceProfile: isObjectiveBalanceProfile(raw.objectiveBalanceProfile)
      ? raw.objectiveBalanceProfile
      : DEFAULT_SETTINGS.objectiveBalanceProfile,
    difficulty: isDifficulty(raw.difficulty) ? raw.difficulty : DEFAULT_SETTINGS.difficulty,
    language: isLanguage(raw.language) ? raw.language : DEFAULT_SETTINGS.language,
  }
}

export function saveStoredSettings(next: GameSettings): GameSettings {
  const normalized: GameSettings = {
    masterVolume: Math.max(0, Math.min(1, next.masterVolume)),
    muted: !!next.muted,
    reducedMotion: !!next.reducedMotion,
    weatherEffects: typeof next.weatherEffects === 'boolean' ? next.weatherEffects : DEFAULT_SETTINGS.weatherEffects,
    dynamicLighting: typeof next.dynamicLighting === 'boolean' ? next.dynamicLighting : DEFAULT_SETTINGS.dynamicLighting,
    colorblindMode: !!next.colorblindMode,
    gamepadEnabled: !!next.gamepadEnabled,
    objectiveBalanceProfile: isObjectiveBalanceProfile(next.objectiveBalanceProfile)
      ? next.objectiveBalanceProfile
      : DEFAULT_SETTINGS.objectiveBalanceProfile,
    difficulty: isDifficulty(next.difficulty) ? next.difficulty : DEFAULT_SETTINGS.difficulty,
    language: isLanguage(next.language) ? next.language : DEFAULT_SETTINGS.language,
  }
  // `muted` fica de fora do que é gravado — vale só para a sessão atual.
  writeSecureJSON(SETTINGS_KEY, { ...normalized, muted: DEFAULT_SETTINGS.muted })
  return normalized
}

export function getDefaultSettings(): GameSettings {
  return { ...DEFAULT_SETTINGS }
}
