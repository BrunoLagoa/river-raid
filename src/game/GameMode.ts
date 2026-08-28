export type GameModeId = 'classic' | 'daily' | 'boss_rush' | 'hardcore' | 'zen'

export interface GameModeConfig {
  id: GameModeId
  nameKey: string
  descKey: string
  badgeIcon: string
  initialLives: number
  fuelDrainMultiplier: number
  bossSpawnInterval: number
  firstBossSpawnTime: number
  minimapEnabled: boolean
  infiniteLives: boolean
  infiniteFuel: boolean
  recordGhost: boolean
  trackAchievements: boolean
  trackLeaderboard: boolean
}

export const GAME_MODES: Record<GameModeId, GameModeConfig> = {
  classic: {
    id: 'classic',
    nameKey: 'modeClassicName',
    descKey: 'modeClassicDesc',
    badgeIcon: '🛩️',
    initialLives: 3,
    fuelDrainMultiplier: 1.0,
    bossSpawnInterval: 60,
    firstBossSpawnTime: 60,
    minimapEnabled: true,
    infiniteLives: false,
    infiniteFuel: false,
    recordGhost: true,
    trackAchievements: true,
    trackLeaderboard: true,
  },
  daily: {
    id: 'daily',
    nameKey: 'modeDailyName',
    descKey: 'modeDailyDesc',
    badgeIcon: '☀',
    initialLives: 3,
    fuelDrainMultiplier: 1.0,
    bossSpawnInterval: 60,
    firstBossSpawnTime: 60,
    minimapEnabled: true,
    infiniteLives: false,
    infiniteFuel: false,
    recordGhost: false,
    trackAchievements: true,
    trackLeaderboard: false,
  },
  boss_rush: {
    id: 'boss_rush',
    nameKey: 'modeBossRushName',
    descKey: 'modeBossRushDesc',
    badgeIcon: '⚡',
    initialLives: 3,
    fuelDrainMultiplier: 0.8,
    bossSpawnInterval: 35,
    firstBossSpawnTime: 12,
    minimapEnabled: true,
    infiniteLives: false,
    infiniteFuel: false,
    recordGhost: true,
    trackAchievements: true,
    trackLeaderboard: true,
  },
  hardcore: {
    id: 'hardcore',
    nameKey: 'modeHardcoreName',
    descKey: 'modeHardcoreDesc',
    badgeIcon: '💀',
    initialLives: 1,
    fuelDrainMultiplier: 1.35,
    bossSpawnInterval: 50,
    firstBossSpawnTime: 45,
    minimapEnabled: false,
    infiniteLives: false,
    infiniteFuel: false,
    recordGhost: true,
    trackAchievements: true,
    trackLeaderboard: true,
  },
  zen: {
    id: 'zen',
    nameKey: 'modeZenName',
    descKey: 'modeZenDesc',
    badgeIcon: '☯',
    initialLives: 99,
    fuelDrainMultiplier: 0.0,
    bossSpawnInterval: 90,
    firstBossSpawnTime: 90,
    minimapEnabled: true,
    infiniteLives: true,
    infiniteFuel: true,
    recordGhost: false,
    trackAchievements: false,
    trackLeaderboard: false,
  },
}

export function getGameModeConfig(modeId: GameModeId = 'classic'): GameModeConfig {
  return GAME_MODES[modeId] ?? GAME_MODES.classic
}

export function getAllGameModes(): GameModeConfig[] {
  return Object.values(GAME_MODES)
}
