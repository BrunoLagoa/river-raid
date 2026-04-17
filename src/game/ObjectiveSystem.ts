import type { EnemyType } from './EnemyManager'
import type { RandomSource } from './random'

export type ObjectiveType = 'enemy_kills' | 'fuel_pickups' | 'bridge_destroyed' | 'combo_hold'

interface ObjectiveDefinition {
  type: ObjectiveType
  title: string
  detail: string
  target: number
  rewardScore: number
  comboThreshold?: number
}

interface ObjectiveState extends ObjectiveDefinition {
  progress: number
  completed: boolean
  completionTimer: number
  rewardGranted: boolean
}

export interface ObjectiveHudData {
  title: string
  detail: string
  progressText: string
  progressRatio: number
  statusText: string
  rewardText: string
  completed: boolean
}

export class ObjectiveSystem {
  private current: ObjectiveState | null = null
  private previousType: ObjectiveType | null = null
  private random: RandomSource
  private awardScore: (points: number) => void

  constructor(random: RandomSource = Math.random, awardScore: (points: number) => void = () => {}) {
    this.random = random
    this.awardScore = awardScore
    this.reset()
  }

  reset(): void {
    this.previousType = null
    this.current = this.createObjective()
  }

  update(dt: number, comboMultiplier: number): void {
    if (!this.current) return

    if (this.current.completed) {
      this.current.completionTimer -= dt
      if (this.current.completionTimer <= 0) {
        this.current = this.createObjective()
      }
      return
    }

    if (this.current.type === 'combo_hold') {
      if (comboMultiplier >= (this.current.comboThreshold ?? 2)) {
        this.current.progress = Math.min(this.current.target, this.current.progress + dt)
        if (this.current.progress >= this.current.target) {
          this.completeCurrentObjective()
        }
      } else {
        this.current.progress = 0
      }
    }
  }

  onEnemyDestroyed(enemyType: EnemyType): void {
    if (!this.current || this.current.completed) return

    if (this.current.type === 'enemy_kills' && enemyType !== 'bridge') {
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
    if (!this.current || this.current.completed) return
    if (this.current.type !== 'fuel_pickups' || amount <= 0) return

    this.current.progress += amount
    if (this.current.progress >= this.current.target) {
      this.completeCurrentObjective()
    }
  }

  getHudData(): ObjectiveHudData | null {
    if (!this.current) return null

    const completed = this.current.completed
    const progress = Math.min(this.current.progress, this.current.target)
    const progressText = this.formatProgressText()
    const statusText = completed
      ? `COMPLETE +${this.current.rewardScore}`
      : `BONUS +${this.current.rewardScore}`

    return {
      title: this.current.title,
      detail: this.current.detail,
      progressText,
      progressRatio: this.current.target <= 0 ? 0 : progress / this.current.target,
      statusText,
      rewardText: `+${this.current.rewardScore}`,
      completed,
    }
  }

  private completeCurrentObjective(): void {
    if (!this.current || this.current.completed) return

    this.current.completed = true
    this.current.completionTimer = 1.1
    if (!this.current.rewardGranted) {
      this.current.rewardGranted = true
      this.awardScore(this.current.rewardScore)
    }
  }

  private createObjective(): ObjectiveState {
    const definitions: ObjectiveDefinition[] = [
      this.createEnemyKillObjective(),
      this.createFuelPickupObjective(),
      this.createBridgeObjective(),
      this.createComboObjective(),
    ]

    let candidate = definitions[Math.floor(this.random() * definitions.length)]
    for (let attempts = 0; attempts < 4 && candidate.type === this.previousType; attempts++) {
      candidate = definitions[Math.floor(this.random() * definitions.length)]
    }

    this.previousType = candidate.type
    return {
      ...candidate,
      progress: 0,
      completed: false,
      completionTimer: 0,
      rewardGranted: false,
    }
  }

  private createEnemyKillObjective(): ObjectiveDefinition {
    const target = 4 + Math.floor(this.random() * 3)
    return {
      type: 'enemy_kills',
      title: 'ENEMY RUN',
      detail: `Destroy ${target} enemies`,
      target,
      rewardScore: 150 + target * 25,
    }
  }

  private createFuelPickupObjective(): ObjectiveDefinition {
    const target = 2 + Math.floor(this.random() * 2)
    return {
      type: 'fuel_pickups',
      title: 'FUEL RUN',
      detail: `Collect ${target} fuel tanks`,
      target,
      rewardScore: 120 + target * 30,
    }
  }

  private createBridgeObjective(): ObjectiveDefinition {
    return {
      type: 'bridge_destroyed',
      title: 'BRIDGE RUN',
      detail: 'Destroy 1 bridge',
      target: 1,
      rewardScore: 300,
    }
  }

  private createComboObjective(): ObjectiveDefinition {
    const comboThreshold = this.random() < 0.5 ? 2 : 3
    const target = comboThreshold === 2
      ? 5.0 + this.random() * 1.5
      : 4.0 + this.random() * 1.2

    return {
      type: 'combo_hold',
      title: 'COMBO RUN',
      detail: `Hold ${comboThreshold}X combo for ${target.toFixed(1)}s`,
      target,
      rewardScore: comboThreshold === 2 ? 220 : 280,
      comboThreshold,
    }
  }

  private formatProgressText(): string {
    if (!this.current) return '0/0'

    if (this.current.type === 'combo_hold') {
      return `${Math.min(this.current.progress, this.current.target).toFixed(1)}s / ${this.current.target.toFixed(1)}s`
    }

    return `${Math.min(this.current.progress, this.current.target)}/${this.current.target}`
  }
}