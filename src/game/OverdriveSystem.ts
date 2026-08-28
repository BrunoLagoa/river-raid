// ─── OverdriveSystem.ts ──────────────────────────────────────────────────────
// Manages the Overdrive Super Weapon meter and state:
//   • Energy is charged by destroying enemies (+4%) and performing near-misses (+12%).
//   • When at 100%, player can activate Overdrive to trigger an EMP screen-clear pulse
//     and unleash a devastating continuous plasma laser beam for 6 seconds.

import {
  OVERDRIVE_MAX,
  OVERDRIVE_KILL_GAIN,
  OVERDRIVE_NEAR_MISS_GAIN,
  OVERDRIVE_DURATION,
} from './constants'

export class OverdriveSystem {
  private energy = 0
  private active = false
  private timer = 0

  get currentEnergy(): number {
    return this.energy
  }

  get isActive(): boolean {
    return this.active
  }

  get remainingTimer(): number {
    return this.timer
  }

  get isReady(): boolean {
    return !this.active && this.energy >= OVERDRIVE_MAX
  }

  get energyRatio(): number {
    return Math.min(1, Math.max(0, this.energy / OVERDRIVE_MAX))
  }

  get activeRatio(): number {
    return this.active ? Math.max(0, this.timer / OVERDRIVE_DURATION) : 0
  }

  /**
   * Adds energy to the Overdrive meter.
   * Returns true if this addition caused the meter to become 100% full.
   */
  addEnergy(amount: number): boolean {
    if (this.active) return false
    const prev = this.energy
    this.energy = Math.min(OVERDRIVE_MAX, this.energy + amount)
    return prev < OVERDRIVE_MAX && this.energy >= OVERDRIVE_MAX
  }

  onEnemyKilled(): boolean {
    return this.addEnergy(OVERDRIVE_KILL_GAIN)
  }

  onNearMiss(): boolean {
    return this.addEnergy(OVERDRIVE_NEAR_MISS_GAIN)
  }

  /**
   * Attempts to activate Overdrive.
   * Returns true if successfully activated.
   */
  activate(): boolean {
    if (!this.isReady) return false
    this.active = true
    this.timer = OVERDRIVE_DURATION
    this.energy = 0
    return true
  }

  update(dt: number): { expired: boolean } {
    if (!this.active) return { expired: false }

    this.timer -= dt
    if (this.timer <= 0) {
      this.active = false
      this.timer = 0
      return { expired: true }
    }
    return { expired: false }
  }

  reset(): void {
    this.energy = 0
    this.active = false
    this.timer = 0
  }
}
