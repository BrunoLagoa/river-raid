import { readSecureJSON, writeSecureJSON } from './StorageService'

export interface EnemyKillCounts {
  helicopter: number
  plane: number
  boat: number
  gunboat: number
  tank: number
  bridge: number
  boss: number
}

export interface CareerStats {
  totalFlightTimeSeconds: number
  totalScoreAccumulated: number
  totalRuns: number
  totalFuelPickedUp: number
  enemiesKilled: EnemyKillCounts
  totalShotsFired: number
  totalShotsHit: number
  highestComboEver: number
}

export interface RunSessionData {
  flightTimeSeconds: number
  score: number
  fuelPickedUp: number
  enemiesKilled: Partial<EnemyKillCounts>
  shotsFired: number
  shotsHit: number
  highestCombo: number
}

export const CAREER_STATS_STORAGE_KEY = 'river_raid_career_stats'

export function getDefaultCareerStats(): CareerStats {
  return {
    totalFlightTimeSeconds: 0,
    totalScoreAccumulated: 0,
    totalRuns: 0,
    totalFuelPickedUp: 0,
    enemiesKilled: {
      helicopter: 0,
      plane: 0,
      boat: 0,
      gunboat: 0,
      tank: 0,
      bridge: 0,
      boss: 0,
    },
    totalShotsFired: 0,
    totalShotsHit: 0,
    highestComboEver: 1,
  }
}

export class CareerStatsService {
  private stats: CareerStats

  constructor() {
    this.stats = this.loadStats()
  }

  getStats(): CareerStats {
    return JSON.parse(JSON.stringify(this.stats)) as CareerStats
  }

  recordRun(run: RunSessionData): CareerStats {
    this.stats.totalRuns += 1
    this.stats.totalFlightTimeSeconds += Math.max(0, run.flightTimeSeconds)
    this.stats.totalScoreAccumulated += Math.max(0, run.score)
    this.stats.totalFuelPickedUp += Math.max(0, run.fuelPickedUp)
    this.stats.totalShotsFired += Math.max(0, run.shotsFired)
    this.stats.totalShotsHit += Math.max(0, run.shotsHit)

    if (run.highestCombo > this.stats.highestComboEver) {
      this.stats.highestComboEver = run.highestCombo
    }

    const enemyTypes: Array<keyof EnemyKillCounts> = [
      'helicopter',
      'plane',
      'boat',
      'gunboat',
      'tank',
      'bridge',
      'boss',
    ]

    for (let i = 0; i < enemyTypes.length; i++) {
      const type = enemyTypes[i]
      const count = run.enemiesKilled[type] ?? 0
      this.stats.enemiesKilled[type] = (this.stats.enemiesKilled[type] ?? 0) + Math.max(0, count)
    }

    this.saveStats()
    return this.getStats()
  }

  getTotalEnemiesDestroyed(): number {
    const k = this.stats.enemiesKilled
    return k.helicopter + k.plane + k.boat + k.gunboat + k.tank + k.bridge + k.boss
  }

  getAccuracyPercentage(): number {
    if (this.stats.totalShotsFired <= 0) return 0
    return Math.min(100, Math.round((this.stats.totalShotsHit / this.stats.totalShotsFired) * 1000) / 10)
  }

  getFormattedFlightTime(): string {
    const totalSec = Math.floor(this.stats.totalFlightTimeSeconds)
    const hours = Math.floor(totalSec / 3600)
    const minutes = Math.floor((totalSec % 3600) / 60)
    const seconds = totalSec % 60

    if (hours > 0) {
      return `${hours}h ${minutes}m ${seconds}s`
    }
    if (minutes > 0) {
      return `${minutes}m ${seconds}s`
    }
    return `${seconds}s`
  }

  resetStats(): void {
    this.stats = getDefaultCareerStats()
    this.saveStats()
  }

  private loadStats(): CareerStats {
    const saved = readSecureJSON<CareerStats | null>(CAREER_STATS_STORAGE_KEY, null)
    if (!saved || typeof saved !== 'object') {
      return getDefaultCareerStats()
    }

    // Merge with defaults in case new fields are added in future updates
    const defaults = getDefaultCareerStats()
    return {
      totalFlightTimeSeconds: typeof saved.totalFlightTimeSeconds === 'number' ? saved.totalFlightTimeSeconds : defaults.totalFlightTimeSeconds,
      totalScoreAccumulated: typeof saved.totalScoreAccumulated === 'number' ? saved.totalScoreAccumulated : defaults.totalScoreAccumulated,
      totalRuns: typeof saved.totalRuns === 'number' ? saved.totalRuns : defaults.totalRuns,
      totalFuelPickedUp: typeof saved.totalFuelPickedUp === 'number' ? saved.totalFuelPickedUp : defaults.totalFuelPickedUp,
      enemiesKilled: {
        helicopter: saved.enemiesKilled?.helicopter ?? 0,
        plane: saved.enemiesKilled?.plane ?? 0,
        boat: saved.enemiesKilled?.boat ?? 0,
        gunboat: saved.enemiesKilled?.gunboat ?? 0,
        tank: saved.enemiesKilled?.tank ?? 0,
        bridge: saved.enemiesKilled?.bridge ?? 0,
        boss: saved.enemiesKilled?.boss ?? 0,
      },
      totalShotsFired: typeof saved.totalShotsFired === 'number' ? saved.totalShotsFired : defaults.totalShotsFired,
      totalShotsHit: typeof saved.totalShotsHit === 'number' ? saved.totalShotsHit : defaults.totalShotsHit,
      highestComboEver: typeof saved.highestComboEver === 'number' ? saved.highestComboEver : defaults.highestComboEver,
    }
  }

  private saveStats(): void {
    writeSecureJSON(CAREER_STATS_STORAGE_KEY, this.stats)
  }
}
