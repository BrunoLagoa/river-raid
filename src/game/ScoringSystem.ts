import {
  COMBO_LEVEL_2,
  COMBO_LEVEL_3,
  COMBO_LEVEL_4,
  COMBO_TIMER,
  COMBO_ANIM_UP,
  COMBO_ANIM_DOWN,
} from './constants'

export class ScoringSystem {
  score = 0
  comboMultiplier = 1
  consecutiveHits = 0
  comboAnimTimer = 0
  comboLevelTimer = 0

  reset(): void {
    this.score = 0
    this.comboMultiplier = 1
    this.consecutiveHits = 0
    this.comboAnimTimer = 0
    this.comboLevelTimer = 0
  }

  addScore(points: number): void {
    this.score += points
  }

  registerHit(): void {
    this.consecutiveHits++
    const oldMultiplier = this.comboMultiplier

    if (this.consecutiveHits >= COMBO_LEVEL_4) {
      this.comboMultiplier = 4
    } else if (this.consecutiveHits >= COMBO_LEVEL_3) {
      this.comboMultiplier = 3
    } else if (this.consecutiveHits >= COMBO_LEVEL_2) {
      this.comboMultiplier = 2
    }

    this.comboLevelTimer = COMBO_TIMER

    if (this.comboMultiplier > oldMultiplier) {
      this.comboAnimTimer = COMBO_ANIM_UP
    }
  }

  registerMiss(): void {
    this.comboMultiplier = 1
    this.comboAnimTimer = COMBO_ANIM_DOWN
    this.comboLevelTimer = 0
    this.consecutiveHits = 0
  }

  decayCombo(): void {
    if (this.comboMultiplier > 1) {
      this.comboMultiplier--
      this.comboAnimTimer = COMBO_ANIM_DOWN

      if (this.comboMultiplier === 3) this.consecutiveHits = COMBO_LEVEL_3
      else if (this.comboMultiplier === 2) this.consecutiveHits = COMBO_LEVEL_2
      else this.consecutiveHits = 0

      if (this.comboMultiplier > 1) {
        this.comboLevelTimer = COMBO_TIMER
      } else {
        this.comboLevelTimer = 0
      }
    }
  }

  update(dt: number): void {
    if (this.comboAnimTimer > 0) {
      this.comboAnimTimer -= dt
    }
    if (this.comboLevelTimer > 0) {
      this.comboLevelTimer -= dt
      if (this.comboLevelTimer <= 0) {
        this.decayCombo()
      }
    }
  }
}
