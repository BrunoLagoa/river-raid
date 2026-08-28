// ─── BossDreadnought.ts ───────────────────────────────────────────────────────
// Multi-phase Naval Dreadnought boss encounter:
//   • Phase 1: Heavy armored hull with 4 rotating defense turrets firing spread salvos.
//   • Phase 2: All turrets down → Central reactor core opens, firing heavy plasma barrages.
//   • Phase 3: Hull integrity < 25% → Overheated thrusters, aggressive strafing & rapid fire.

import {
  BOSS_DREADNOUGHT_HP,
  BOSS_TURRET_HP,
  BOSS_TURRET_SHOOT_INTERVAL,
  BOSS_CORE_SHOOT_INTERVAL,
  BOSS_POINTS,
  BOSS_WIDTH,
  BOSS_HEIGHT,
  BOSS_TURRET_HULL_DAMAGE_RATIO,
  BOSS_PHASE3_HEALTH_RATIO,
  BOSS_ENTRY_SPEED,
  BOSS_ENTRY_TARGET_Y,
  BOSS_STRAFE_SPEED,
  BOSS_STRAFE_SPEED_BERSERK,
  BOSS_STRAFE_RATE,
  BOSS_STRAFE_RATE_BERSERK,
  BOSS_STRAFE_MARGIN,
  BOSS_TURRET_BULLET_SPEED,
  BOSS_TURRET_AIM_FACTOR,
  BOSS_CORE_BULLET_SPEED,
  BOSS_CORE_BURST_VX,
  BOSS_CORE_BERSERK_INTERVAL_MULT,
  BOSS_DEATH_EXPLOSION_TIME,
  BOSS_DAMAGE_FLASH_TIME,
} from './constants'
import type { RandomSource } from './random'

export interface BossTurret {
  id: string
  xOffset: number
  yOffset: number
  width: number
  height: number
  hp: number
  maxHp: number
  shootCooldown: number
  shootInterval: number
  angle: number
  active: boolean
  damageFlashTimer: number
}

export type BossState = 'entering' | 'fighting' | 'exploding' | 'defeated'

export class BossDreadnought {
  x: number
  y: number
  width = BOSS_WIDTH
  height = BOSS_HEIGHT
  hp = BOSS_DREADNOUGHT_HP
  maxHp = BOSS_DREADNOUGHT_HP
  phase = 1
  state: BossState = 'entering'
  active = true
  points = BOSS_POINTS
  damageFlashTimer = 0
  entryTargetY = BOSS_ENTRY_TARGET_Y
  strafePhase = 0
  turrets: BossTurret[] = []
  coreShootCooldown = BOSS_CORE_SHOOT_INTERVAL
  deathExplosionTimer = 0
  private random: RandomSource

  constructor(canvasWidth: number, startY = -BOSS_HEIGHT, random: RandomSource = Math.random) {
    this.random = random
    this.x = canvasWidth / 2
    this.y = startY
    this.initTurrets()
  }

  private initTurrets(): void {
    const offsets = [
      { id: 'fl', x: -32, y: -40 },
      { id: 'fr', x: 32, y: -40 },
      { id: 'rl', x: -34, y: 30 },
      { id: 'rr', x: 34, y: 30 },
    ]

    this.turrets = offsets.map((o) => ({
      id: o.id,
      xOffset: o.x,
      yOffset: o.y,
      width: 18,
      height: 18,
      hp: BOSS_TURRET_HP,
      maxHp: BOSS_TURRET_HP,
      shootCooldown: this.random() * 1.0,
      shootInterval: BOSS_TURRET_SHOOT_INTERVAL,
      angle: Math.PI / 2,
      active: true,
      damageFlashTimer: 0,
    }))
  }

  get isFighting(): boolean {
    return this.state === 'fighting'
  }

  get isAlive(): boolean {
    return this.active && (this.state === 'entering' || this.state === 'fighting')
  }

  get activeTurretsCount(): number {
    return this.turrets.filter((t) => t.active).length
  }

  get healthRatio(): number {
    return Math.max(0, this.hp / this.maxHp)
  }

  takeDamage(
    amount: number,
    turretId?: string
  ): { defeated: boolean; turretDestroyed?: string } {
    if (!this.isAlive) return { defeated: false }

    let turretDestroyed: string | undefined

    if (turretId) {
      const turret = this.turrets.find((t) => t.id === turretId && t.active)
      if (turret) {
        turret.hp -= amount
        turret.damageFlashTimer = BOSS_DAMAGE_FLASH_TIME
        if (turret.hp <= 0) {
          turret.hp = 0
          turret.active = false
          turretDestroyed = turret.id
          // Also damage total boss HP pool
          this.hp = Math.max(1, this.hp - BOSS_TURRET_HP * BOSS_TURRET_HULL_DAMAGE_RATIO)
          if (this.activeTurretsCount === 0 && this.phase === 1) {
            this.phase = 2
          }
          // Turret collapse can drag the hull under the berserk threshold too.
          this.updatePhaseFromHealth()
        }
        return { defeated: false, turretDestroyed }
      }
    }

    // Direct Hull/Core damage
    this.hp -= amount
    this.damageFlashTimer = BOSS_DAMAGE_FLASH_TIME

    this.updatePhaseFromHealth()

    if (this.hp <= 0) {
      this.hp = 0
      this.state = 'exploding'
      this.deathExplosionTimer = BOSS_DEATH_EXPLOSION_TIME
      return { defeated: true }
    }

    return { defeated: false }
  }

  /** Berserk phase is driven purely by hull integrity, whatever caused the loss. */
  private updatePhaseFromHealth(): void {
    if (this.hp <= this.maxHp * BOSS_PHASE3_HEALTH_RATIO && this.phase < 3) {
      this.phase = 3
    }
  }

  update(
    dt: number,
    playerX: number,
    playerY: number,
    riverBounds: { left: number; right: number },
    onShoot: (bullet: { x: number; y: number; vx: number; speed: number; fromPlane: boolean }) => void
  ): void {
    if (!this.active) return

    // 1. Entry state
    if (this.state === 'entering') {
      this.y += BOSS_ENTRY_SPEED * dt
      if (this.y >= this.entryTargetY) {
        this.y = this.entryTargetY
        this.state = 'fighting'
      }
      return
    }

    // 2. Exploding state
    if (this.state === 'exploding') {
      this.deathExplosionTimer -= dt
      if (this.deathExplosionTimer <= 0) {
        this.state = 'defeated'
        this.active = false
      }
      return
    }

    // 3. Fighting state
    if (this.state !== 'fighting') return

    // Decay damage flash timers
    if (this.damageFlashTimer > 0) this.damageFlashTimer -= dt
    for (const t of this.turrets) {
      if (t.damageFlashTimer > 0) t.damageFlashTimer -= dt
    }

    // Lateral strafe movement
    this.strafePhase += dt * (this.phase === 3 ? BOSS_STRAFE_RATE_BERSERK : BOSS_STRAFE_RATE)
    const margin = this.width / 2 + BOSS_STRAFE_MARGIN
    const minX = riverBounds.left + margin
    const maxX = riverBounds.right - margin

    if (maxX > minX) {
      const targetSpeed = this.phase === 3 ? BOSS_STRAFE_SPEED_BERSERK : BOSS_STRAFE_SPEED
      this.x += Math.sin(this.strafePhase) * targetSpeed * dt
      this.x = Math.max(minX, Math.min(maxX, this.x))
    }

    // Turret firing (Phase 1 & 2)
    for (const turret of this.turrets) {
      if (!turret.active) continue

      const tx = this.x + turret.xOffset
      const ty = this.y + turret.yOffset

      // Aim at player
      const dx = playerX - tx
      const dy = playerY - ty
      turret.angle = Math.atan2(dy, dx)

      turret.shootCooldown -= dt
      if (turret.shootCooldown <= 0) {
        turret.shootCooldown = turret.shootInterval * (0.85 + this.random() * 0.3)
        // Shells only travel downward, so the aim angle contributes lead, not pitch.
        const vx = Math.cos(turret.angle) * BOSS_TURRET_BULLET_SPEED * BOSS_TURRET_AIM_FACTOR
        onShoot({
          x: tx,
          y: ty,
          vx,
          speed: BOSS_TURRET_BULLET_SPEED,
          fromPlane: false,
        })
      }
    }

    // Central Core firing (Phase 2 & 3)
    if (this.phase >= 2) {
      this.coreShootCooldown -= dt
      const interval = this.phase === 3
        ? BOSS_CORE_SHOOT_INTERVAL * BOSS_CORE_BERSERK_INTERVAL_MULT
        : BOSS_CORE_SHOOT_INTERVAL

      if (this.coreShootCooldown <= 0) {
        this.coreShootCooldown = interval

        // Triple plasma burst
        for (const vx of BOSS_CORE_BURST_VX) {
          onShoot({
            x: this.x,
            y: this.y + 10,
            vx,
            speed: BOSS_CORE_BULLET_SPEED,
            fromPlane: false,
          })
        }
      }
    }
  }
}
