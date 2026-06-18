import type { AchievementId } from './AchievementService'
import type { EnemyType } from './EnemyManager'
import {
  ACHIEVEMENT_SHARPSHOOTER_KILLS,
  ACHIEVEMENT_POWER_COLLECTOR_COUNT,
  ACHIEVEMENT_FUEL_SAVER_SECONDS,
  ACHIEVEMENT_FUEL_SAVER_FUEL_PCT,
  ACHIEVEMENT_SURVIVOR_SCORE,
  ACHIEVEMENT_HIGH_FLYER_SCORE,
  ACHIEVEMENT_COMBO_MASTER_MULT,
} from './constants'

/**
 * Tracks per-run progress and fires achievement unlocks via the injected
 * callback. Extracted from Game so the orchestrator stays free of ad-hoc
 * counters; the callback (Game.tryUnlockAchievement) already dedupes unlocks.
 */
export class AchievementTracker {
  private enemiesKilled = 0
  private powerUpsCollected = 0
  private fuelHighTimer = 0
  private bridgeDestroyed = false
  private lostLife = false
  private readonly unlock: (id: AchievementId) => void

  constructor(unlock: (id: AchievementId) => void) {
    this.unlock = unlock
  }

  reset(): void {
    this.enemiesKilled = 0
    this.powerUpsCollected = 0
    this.fuelHighTimer = 0
    this.bridgeDestroyed = false
    this.lostLife = false
  }

  onEnemyDestroyed(type: EnemyType): void {
    this.enemiesKilled++
    if (this.enemiesKilled >= ACHIEVEMENT_SHARPSHOOTER_KILLS) this.unlock('sharpshooter')
    if (type === 'bridge' && !this.bridgeDestroyed) {
      this.bridgeDestroyed = true
      this.unlock('first_bridge')
    }
  }

  onPowerUpCollected(): void {
    this.powerUpsCollected++
    if (this.powerUpsCollected >= ACHIEVEMENT_POWER_COLLECTOR_COUNT) this.unlock('power_collector')
  }

  /** Call each alive frame to track sustained high-fuel time. */
  updateFuel(dt: number, fuel: number): void {
    if (fuel >= ACHIEVEMENT_FUEL_SAVER_FUEL_PCT) {
      this.fuelHighTimer += dt
      if (this.fuelHighTimer >= ACHIEVEMENT_FUEL_SAVER_SECONDS) this.unlock('fuel_saver')
    } else {
      this.fuelHighTimer = 0
    }
  }

  onPlayerDeath(): void {
    this.lostLife = true
  }

  onGameOver(score: number, comboMultiplier: number): void {
    if (!this.lostLife) this.unlock('untouchable')
    if (score >= ACHIEVEMENT_SURVIVOR_SCORE) this.unlock('survivor')
    if (score >= ACHIEVEMENT_HIGH_FLYER_SCORE) this.unlock('high_flyer')
    if (comboMultiplier >= ACHIEVEMENT_COMBO_MASTER_MULT) this.unlock('combo_master')
  }
}
