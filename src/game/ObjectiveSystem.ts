import type { EnemyType } from './EnemyManager'
import type { RandomSource } from './random'

export type ObjectiveBalanceProfile = 'conservative' | 'aggressive'

export type ObjectiveType =
  | 'enemy_kills'
  | 'fuel_pickups'
  | 'bridge_destroyed'
  | 'combo_hold'
  | 'timed_enemy_kills'
  | 'score_target'
  | 'river_survival'

interface ObjectiveProfileConfig {
  enemyTargetRange: [number, number]
  fuelTargetRange: [number, number]
  bridgeTargetRange: [number, number]
  combo2Range: [number, number]
  combo3Range: [number, number]
  timedEnemyTargetRange: [number, number]
  timedEnemyWindowRange: [number, number]
  scoreTargetRange: [number, number]
  scoreWindowRange: [number, number]
  riverSurvivalRange: [number, number]
  weights: Record<ObjectiveType, number>
}

const PROFILE_CONFIGS: Record<ObjectiveBalanceProfile, ObjectiveProfileConfig> = {
  conservative: {
    enemyTargetRange: [4, 6],
    fuelTargetRange: [2, 3],
    bridgeTargetRange: [1, 1],
    combo2Range: [4.8, 6.2],
    combo3Range: [3.8, 5],
    timedEnemyTargetRange: [3, 4],
    timedEnemyWindowRange: [9, 12],
    scoreTargetRange: [280, 420],
    scoreWindowRange: [10, 13],
    riverSurvivalRange: [6, 9],
    weights: {
      enemy_kills: 1.0,
      fuel_pickups: 1.0,
      bridge_destroyed: 0.9,
      combo_hold: 0.95,
      timed_enemy_kills: 0.65,
      score_target: 0.6,
      river_survival: 0.7,
    },
  },
  aggressive: {
    enemyTargetRange: [6, 10],
    fuelTargetRange: [3, 5],
    bridgeTargetRange: [1, 2],
    combo2Range: [5.5, 7],
    combo3Range: [4.8, 6.5],
    timedEnemyTargetRange: [5, 7],
    timedEnemyWindowRange: [7, 10],
    scoreTargetRange: [450, 760],
    scoreWindowRange: [8, 11],
    riverSurvivalRange: [8, 12],
    weights: {
      enemy_kills: 0.95,
      fuel_pickups: 0.7,
      bridge_destroyed: 1.15,
      combo_hold: 1.2,
      timed_enemy_kills: 1.4,
      score_target: 1.3,
      river_survival: 1.1,
    },
  },
}

export function isObjectiveBalanceProfile(value: unknown): value is ObjectiveBalanceProfile {
  return value === 'conservative' || value === 'aggressive'
}

interface ObjectiveDefinition {
  type: ObjectiveType
  title: string
  detail: string
  target: number
  rewardScore: number
  comboThreshold?: number
  timeLimit?: number
}

interface ObjectiveState extends ObjectiveDefinition {
  progress: number
  completed: boolean
  failed: boolean
  completionTimer: number
  rewardGranted: boolean
  timeRemaining: number
}

export interface ObjectiveHudData {
  title: string
  detail: string
  progressText: string
  progressRatio: number
  statusText: string
  rewardText: string
  timeLeftText?: string
  completed: boolean
}

export class ObjectiveSystem {
  private current: ObjectiveState | null = null
  private previousType: ObjectiveType | null = null
  private profile: ObjectiveBalanceProfile
  private random: RandomSource
  private awardScore: (points: number) => void

  constructor(
    random: RandomSource = Math.random,
    awardScore: (points: number) => void = () => {},
    profile: ObjectiveBalanceProfile = 'conservative'
  ) {
    this.random = random
    this.awardScore = awardScore
    this.profile = profile
    this.reset()
  }

  setProfile(profile: ObjectiveBalanceProfile, applyImmediately = false): void {
    this.profile = profile
    if (applyImmediately) {
      this.current = this.createObjective()
    }
  }

  reset(): void {
    this.previousType = null
    this.current = this.createObjective()
  }

  update(dt: number, comboMultiplier: number): void {
    if (!this.current) return
    const current = this.current

    if (current.completed) {
      current.completionTimer -= dt
      if (current.completionTimer <= 0) {
        this.current = this.createObjective()
      }
      return
    }

    if (current.failed) {
      current.completionTimer -= dt
      if (current.completionTimer <= 0) {
        this.current = this.createObjective()
      }
      return
    }

    if ((current.timeLimit ?? 0) > 0) {
      current.timeRemaining = Math.max(0, current.timeRemaining - dt)
      if (current.timeRemaining <= 0) {
        if (current.progress >= current.target) {
          this.completeCurrentObjective()
        } else {
          this.failCurrentObjective()
        }
        return
      }
    }

    if (current.type === 'combo_hold') {
      if (comboMultiplier >= (current.comboThreshold ?? 2)) {
        current.progress = Math.min(current.target, current.progress + dt)
        if (current.progress >= current.target) {
          this.completeCurrentObjective()
        }
      } else {
        current.progress = 0
      }
    }
  }

  onEnemyDestroyed(enemyType: EnemyType): void {
    if (!this.current || this.current.completed || this.current.failed) return

    if ((this.current.type === 'enemy_kills' || this.current.type === 'timed_enemy_kills') && enemyType !== 'bridge') {
      this.current.progress++
    } else if (this.current.type === 'bridge_destroyed' && enemyType === 'bridge') {
      this.current.progress++
    } else {
      return
    }

    if (this.current.progress >= this.current.target) {
      this.completeCurrentObjective()
    }
  }

  onFuelCollected(amount: number): void {
    if (!this.current || this.current.completed || this.current.failed) return
    if (this.current.type !== 'fuel_pickups' || amount <= 0) return

    this.current.progress += amount
    if (this.current.progress >= this.current.target) {
      this.completeCurrentObjective()
    }
  }

  onScoreGained(points: number): void {
    if (!this.current || this.current.completed || this.current.failed) return
    if (this.current.type !== 'score_target' || points <= 0) return

    this.current.progress += points
    if (this.current.progress >= this.current.target) {
      this.completeCurrentObjective()
    }
  }

  onRiverFrame(dt: number, isInsideBounds: boolean): void {
    if (!this.current || this.current.completed || this.current.failed) return
    if (this.current.type !== 'river_survival') return

    if (!isInsideBounds) {
      this.failCurrentObjective()
      return
    }

    this.current.progress = Math.min(this.current.target, this.current.progress + dt)
    if (this.current.progress >= this.current.target) {
      this.completeCurrentObjective()
    }
  }

  getHudData(): ObjectiveHudData | null {
    if (!this.current) return null
    const current = this.current

    const completed = current.completed
    const failed = current.failed
    const progress = Math.min(current.progress, current.target)
    const progressText = this.formatProgressText()
    const statusText = completed
      ? `COMPLETE +${current.rewardScore}`
      : failed
        ? 'FAILED'
        : `BONUS +${current.rewardScore}`
    const timeLeftText = (current.timeLimit ?? 0) > 0
      ? `TIME ${Math.max(0, current.timeRemaining).toFixed(1)}s`
      : undefined

    return {
      title: current.title,
      detail: current.detail,
      progressText,
      progressRatio: current.target <= 0 ? 0 : progress / current.target,
      statusText,
      rewardText: failed ? '--' : `+${current.rewardScore}`,
      timeLeftText,
      completed,
    }
  }

  private completeCurrentObjective(): void {
    if (!this.current || this.current.completed) return

    this.current.completed = true
    this.current.failed = false
    this.current.completionTimer = 1.1
    if (!this.current.rewardGranted) {
      this.current.rewardGranted = true
      this.awardScore(this.current.rewardScore)
    }
  }

  private failCurrentObjective(): void {
    if (!this.current || this.current.completed || this.current.failed) return
    this.current.failed = true
    this.current.completionTimer = 0.9
  }

  private createObjective(): ObjectiveState {
    const profile = PROFILE_CONFIGS[this.profile]
    const definitions: ObjectiveDefinition[] = [
      this.createEnemyKillObjective(profile),
      this.createFuelPickupObjective(profile),
      this.createBridgeObjective(profile),
      this.createComboObjective(profile),
      this.createTimedEnemyObjective(profile),
      this.createScoreTargetObjective(profile),
      this.createRiverSurvivalObjective(profile),
    ]

    let candidate = this.pickWeightedObjective(definitions, profile)
    for (let attempts = 0; attempts < 6 && candidate.type === this.previousType; attempts++) {
      candidate = this.pickWeightedObjective(definitions, profile)
    }

    this.previousType = candidate.type
    return {
      ...candidate,
      progress: 0,
      completed: false,
      failed: false,
      completionTimer: 0,
      rewardGranted: false,
      timeRemaining: candidate.timeLimit ?? 0,
    }
  }

  private pickWeightedObjective(definitions: ObjectiveDefinition[], profile: ObjectiveProfileConfig): ObjectiveDefinition {
    const weighted = definitions
      .map((d) => ({ definition: d, weight: Math.max(0, profile.weights[d.type] ?? 0) }))
      .filter((item) => item.weight > 0)

    if (weighted.length === 0) return definitions[0]

    let cursor = this.random() * weighted.reduce((sum, item) => sum + item.weight, 0)
    for (const item of weighted) {
      cursor -= item.weight
      if (cursor <= 0) return item.definition
    }
    return weighted[weighted.length - 1].definition
  }

  private createEnemyKillObjective(profile: ObjectiveProfileConfig): ObjectiveDefinition {
    const target = this.randomInt(profile.enemyTargetRange[0], profile.enemyTargetRange[1])
    return {
      type: 'enemy_kills',
      title: 'ENEMY RUN',
      detail: `Destroy ${target} enemies`,
      target,
      rewardScore: 145 + target * 28,
    }
  }

  private createFuelPickupObjective(profile: ObjectiveProfileConfig): ObjectiveDefinition {
    const target = this.randomInt(profile.fuelTargetRange[0], profile.fuelTargetRange[1])
    return {
      type: 'fuel_pickups',
      title: 'FUEL RUN',
      detail: `Collect ${target} fuel tanks`,
      target,
      rewardScore: 120 + target * 34,
    }
  }

  private createBridgeObjective(profile: ObjectiveProfileConfig): ObjectiveDefinition {
    const target = this.randomInt(profile.bridgeTargetRange[0], profile.bridgeTargetRange[1])
    return {
      type: 'bridge_destroyed',
      title: 'BRIDGE RUN',
      detail: `Destroy ${target} bridge${target > 1 ? 's' : ''}`,
      target,
      rewardScore: 260 + target * 110,
    }
  }

  private createComboObjective(profile: ObjectiveProfileConfig): ObjectiveDefinition {
    const comboThreshold = this.random() < 0.5 ? 2 : 3
    const target = comboThreshold === 2
      ? this.randomRange(profile.combo2Range[0], profile.combo2Range[1])
      : this.randomRange(profile.combo3Range[0], profile.combo3Range[1])

    return {
      type: 'combo_hold',
      title: 'COMBO RUN',
      detail: `Hold ${comboThreshold}X combo for ${target.toFixed(1)}s`,
      target,
      rewardScore: comboThreshold === 2 ? 230 : 300,
      comboThreshold,
    }
  }

  private createTimedEnemyObjective(profile: ObjectiveProfileConfig): ObjectiveDefinition {
    const target = this.randomInt(profile.timedEnemyTargetRange[0], profile.timedEnemyTargetRange[1])
    const timeLimit = this.randomRange(profile.timedEnemyWindowRange[0], profile.timedEnemyWindowRange[1])
    return {
      type: 'timed_enemy_kills',
      title: 'STRIKE WINDOW',
      detail: `Destroy ${target} enemies in ${timeLimit.toFixed(1)}s`,
      target,
      rewardScore: 210 + target * 46,
      timeLimit,
    }
  }

  private createScoreTargetObjective(profile: ObjectiveProfileConfig): ObjectiveDefinition {
    const target = this.randomInt(profile.scoreTargetRange[0], profile.scoreTargetRange[1])
    const timeLimit = this.randomRange(profile.scoreWindowRange[0], profile.scoreWindowRange[1])
    return {
      type: 'score_target',
      title: 'POINT BURST',
      detail: `Gain ${target} score in ${timeLimit.toFixed(1)}s`,
      target,
      rewardScore: 180 + Math.floor(target * 0.45),
      timeLimit,
    }
  }

  private createRiverSurvivalObjective(profile: ObjectiveProfileConfig): ObjectiveDefinition {
    const target = this.randomRange(profile.riverSurvivalRange[0], profile.riverSurvivalRange[1])
    return {
      type: 'river_survival',
      title: 'RIVER LINE',
      detail: `Stay in river for ${target.toFixed(1)}s`,
      target,
      rewardScore: 240 + Math.floor(target * 22),
    }
  }

  private randomInt(min: number, max: number): number {
    return min + Math.floor(this.random() * (max - min + 1))
  }

  private randomRange(min: number, max: number): number {
    return min + this.random() * (max - min)
  }

  private formatProgressText(): string {
    if (!this.current) return '0/0'

    if (this.current.type === 'combo_hold' || this.current.type === 'river_survival') {
      return `${Math.min(this.current.progress, this.current.target).toFixed(1)}s / ${this.current.target.toFixed(1)}s`
    }

    if (this.current.type === 'score_target') {
      return `${Math.floor(Math.min(this.current.progress, this.current.target))}/${Math.floor(this.current.target)}`
    }

    return `${Math.min(this.current.progress, this.current.target)}/${this.current.target}`
  }
}