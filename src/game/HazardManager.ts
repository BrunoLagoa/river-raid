import {
  MINE_SIZE,
  MINE_POINTS,
  MINE_CHAIN_RADIUS,
  MINE_PULSE_SPEED,
  MINE_CHAIN_DELAY,
  WHIRLPOOL_RADIUS,
  WHIRLPOOL_PULL_FORCE,
  WHIRLPOOL_SPIN_SPEED,
  BUNKER_WIDTH,
  BUNKER_HEIGHT,
  BUNKER_HP,
  BUNKER_POINTS,
  BUNKER_SHOOT_INTERVAL,
  BUNKER_BULLET_SPEED,
  BUNKER_RANGE,
  BUNKER_MIN_DOWN_RATIO,
  MINE_CLUSTER_PAIR_CHANCE,
  HAZARD_SPAWN_INTERVAL_MIN,
  HAZARD_SPAWN_INTERVAL_MAX,
  HAZARD_MAX_MINES,
  HAZARD_MAX_WHIRLPOOLS,
  HAZARD_MAX_BUNKERS,
} from './constants'
import type { World } from './World'
import type { RandomSource } from './random'

export interface SeaMine {
  x: number
  y: number
  width: number
  height: number
  active: boolean
  pulseTimer: number
  chainExplodeTimer: number
  points: number
}

export interface Whirlpool {
  x: number
  y: number
  radius: number
  angle: number
  active: boolean
  pullForce: number
}

export interface ShoreBunker {
  x: number
  y: number
  width: number
  height: number
  side: 'left' | 'right'
  hp: number
  maxHp: number
  shootCooldown: number
  angle: number
  active: boolean
  points: number
  damageFlashTimer: number
}

export interface BunkerBulletSpawn {
  x: number
  y: number
  vx: number
  speed: number
  fromPlane?: boolean
}

export class HazardManager {
  mines: SeaMine[] = []
  whirlpools: Whirlpool[] = []
  bunkers: ShoreBunker[] = []

  private canvasHeight: number
  private random: RandomSource
  private spawnTimer = 0
  /** Reused force vector — `applyWhirlpoolForces` runs every frame (no allocation). */
  private readonly whirlpoolForce = { fx: 0, fy: 0 }

  constructor(
    _canvasWidth: number,
    canvasHeight: number,
    random: RandomSource = Math.random,
  ) {
    this.canvasHeight = canvasHeight
    this.random = random
    this.spawnTimer = this.getRandomSpawnInterval()
    this.initPools()
  }

  private getRandomSpawnInterval(): number {
    return HAZARD_SPAWN_INTERVAL_MIN + this.random() * (HAZARD_SPAWN_INTERVAL_MAX - HAZARD_SPAWN_INTERVAL_MIN)
  }

  private initPools(): void {
    this.mines = []
    for (let i = 0; i < HAZARD_MAX_MINES; i++) {
      this.mines.push({
        x: 0,
        y: 0,
        width: MINE_SIZE,
        height: MINE_SIZE,
        active: false,
        pulseTimer: 0,
        chainExplodeTimer: 0,
        points: MINE_POINTS,
      })
    }

    this.whirlpools = []
    for (let i = 0; i < HAZARD_MAX_WHIRLPOOLS; i++) {
      this.whirlpools.push({
        x: 0,
        y: 0,
        radius: WHIRLPOOL_RADIUS,
        angle: 0,
        active: false,
        pullForce: WHIRLPOOL_PULL_FORCE,
      })
    }

    this.bunkers = []
    for (let i = 0; i < HAZARD_MAX_BUNKERS; i++) {
      this.bunkers.push({
        x: 0,
        y: 0,
        width: BUNKER_WIDTH,
        height: BUNKER_HEIGHT,
        side: 'left',
        hp: BUNKER_HP,
        maxHp: BUNKER_HP,
        shootCooldown: BUNKER_SHOOT_INTERVAL * this.random(),
        angle: 0,
        active: false,
        points: BUNKER_POINTS,
        damageFlashTimer: 0,
      })
    }
  }

  reset(_canvasWidth: number, canvasHeight: number): void {
    this.canvasHeight = canvasHeight
    this.spawnTimer = this.getRandomSpawnInterval()
    for (const m of this.mines) m.active = false
    for (const w of this.whirlpools) w.active = false
    for (const b of this.bunkers) b.active = false
  }

  update(
    dt: number,
    scrollSpeed: number,
    world: World,
    playerX: number,
    playerY: number,
    onSpawnBullet?: (bullet: BunkerBulletSpawn) => void,
    onMineDetonated?: (mine: SeaMine) => void,
  ): void {
    // 1. Spawning cycle
    this.spawnTimer -= dt
    if (this.spawnTimer <= 0) {
      this.spawnTimer = this.getRandomSpawnInterval()
      this.trySpawnRandomHazard(world)
    }

    // 2. Update sea mines
    for (let i = 0; i < this.mines.length; i++) {
      const mine = this.mines[i]
      if (!mine.active) continue

      mine.y += scrollSpeed * dt
      mine.pulseTimer += dt * MINE_PULSE_SPEED

      // The river meanders under the hazard as it scrolls; re-clamp so mines
      // never end up beached on the bank (same pattern as PowerUpSystem/FuelSystem).
      const mineBounds = world.getBoundsAtY(mine.y)
      const mineHalf = Math.min(MINE_SIZE / 2 + 4, (mineBounds.right - mineBounds.left) / 2)
      mine.x = Math.max(mineBounds.left + mineHalf, Math.min(mineBounds.right - mineHalf, mine.x))

      // Chain explosion countdown
      if (mine.chainExplodeTimer > 0) {
        mine.chainExplodeTimer -= dt
        if (mine.chainExplodeTimer <= 0) {
          mine.active = false
          // Único ponto de pagamento da cascata: detonar notifica, agendar não.
          onMineDetonated?.(mine)
          this.triggerMineChain(i)
        }
      }

      if (mine.y > this.canvasHeight + MINE_SIZE) {
        mine.active = false
      }
    }

    // 3. Update whirlpools
    for (const wp of this.whirlpools) {
      if (!wp.active) continue
      wp.y += scrollSpeed * dt
      wp.angle += WHIRLPOOL_SPIN_SPEED * dt

      const wpBounds = world.getBoundsAtY(wp.y)
      const wpHalf = Math.min(wp.radius, (wpBounds.right - wpBounds.left) / 2)
      wp.x = Math.max(wpBounds.left + wpHalf, Math.min(wpBounds.right - wpHalf, wp.x))
      if (wp.y > this.canvasHeight + wp.radius * 2) {
        wp.active = false
      }
    }

    // 4. Update shore bunkers
    for (const bunker of this.bunkers) {
      if (!bunker.active) continue

      bunker.y += scrollSpeed * dt

      // Shore emplacements track their own bank as the river meanders, otherwise
      // they drift into the channel (and out of the bank they are drawn on).
      const bunkerBounds = world.getBoundsAtY(bunker.y)
      bunker.x = bunker.side === 'left'
        ? bunkerBounds.left - BUNKER_WIDTH / 2 + 4
        : bunkerBounds.right + BUNKER_WIDTH / 2 - 4

      if (bunker.damageFlashTimer > 0) {
        bunker.damageFlashTimer = Math.max(0, bunker.damageFlashTimer - dt)
      }

      // Aim at player
      const dx = playerX - bunker.x
      const dy = playerY - bunker.y
      const dist = Math.sqrt(dx * dx + dy * dy)
      bunker.angle = Math.atan2(dy, dx)

      // Shoot cadence if player within range and ahead
      bunker.shootCooldown -= dt
      if (bunker.shootCooldown <= 0 && dist < BUNKER_RANGE && bunker.y < playerY) {
        bunker.shootCooldown = BUNKER_SHOOT_INTERVAL + (this.random() * 0.6 - 0.3)
        if (onSpawnBullet) {
          const nx = dist > 0 ? dx / dist : 0
          const ny = dist > 0 ? dy / dist : 1
          // Pooled enemy bullets only recycle once they fall past the bottom edge,
          // so the aim direction is floored downward instead of clamping `speed`
          // (which would keep the horizontal component and break the aim vector).
          const aimY = Math.max(BUNKER_MIN_DOWN_RATIO, ny)
          const norm = Math.sqrt(nx * nx + aimY * aimY) || 1
          const dirX = nx / norm
          const dirY = aimY / norm
          onSpawnBullet({
            x: bunker.x + dirX * (BUNKER_WIDTH / 2),
            y: bunker.y + dirY * (BUNKER_HEIGHT / 2),
            vx: dirX * BUNKER_BULLET_SPEED,
            speed: dirY * BUNKER_BULLET_SPEED,
            fromPlane: false,
          })
        }
      }

      if (bunker.y > this.canvasHeight + BUNKER_HEIGHT) {
        bunker.active = false
      }
    }
  }

  /**
   * Applies centripetal drag force if player is over a whirlpool.
   */
  applyWhirlpoolForces(playerX: number, playerY: number): { fx: number; fy: number } {
    let totalFx = 0
    let totalFy = 0

    for (const wp of this.whirlpools) {
      if (!wp.active) continue
      const dx = wp.x - playerX
      const dy = wp.y - playerY
      const dist = Math.sqrt(dx * dx + dy * dy)

      if (dist < wp.radius * 1.5 && dist > 1) {
        const falloff = 1 - dist / (wp.radius * 1.5)
        const pull = wp.pullForce * falloff
        totalFx += (dx / dist) * pull
        totalFy += (dy / dist) * pull
      }
    }

    this.whirlpoolForce.fx = totalFx
    this.whirlpoolForce.fy = totalFy
    return this.whirlpoolForce
  }

  /**
   * Schedules chain detonations for mines near `mineIndex`. Scheduling only arms
   * the fuse — the detonation callback fires when that fuse expires in `update`,
   * so each mine in a cascade pays out exactly once no matter how deep it is.
   */
  triggerMineChain(mineIndex: number): void {
    const origin = this.mines[mineIndex]
    if (!origin) return

    for (let i = 0; i < this.mines.length; i++) {
      if (i === mineIndex) continue
      const target = this.mines[i]
      if (!target.active || target.chainExplodeTimer > 0) continue

      const dx = target.x - origin.x
      const dy = target.y - origin.y
      const dist = Math.sqrt(dx * dx + dy * dy)

      if (dist <= MINE_CHAIN_RADIUS) {
        target.chainExplodeTimer = MINE_CHAIN_DELAY + this.random() * 0.05
      }
    }
  }

  private trySpawnRandomHazard(world: World): void {
    const spawnY = -40
    const bounds = world.getBoundsAtY(spawnY)
    const riverWidth = bounds.right - bounds.left

    if (riverWidth < 80) return // Too narrow for hazards

    const roll = this.random()

    if (roll < 0.45) {
      // Spawn Sea Mine cluster (1 to 2 mines spaced with navigable lane)
      const count = this.random() < MINE_CLUSTER_PAIR_CHANCE ? 2 : 1
      for (let i = 0; i < count; i++) {
        const mine = this.mines.find((m) => !m.active)
        if (!mine) break

        const margin = 24
        const availableWidth = riverWidth - margin * 2
        const spawnX = bounds.left + margin + (i === 0 ? this.random() * (availableWidth * 0.45) : availableWidth * 0.55 + this.random() * (availableWidth * 0.45))

        mine.x = Math.max(bounds.left + margin, Math.min(bounds.right - margin, spawnX))
        mine.y = spawnY - i * 35
        mine.active = true
        mine.pulseTimer = this.random() * Math.PI
        mine.chainExplodeTimer = 0
      }
    } else if (roll < 0.75) {
      // Spawn Whirlpool
      const wp = this.whirlpools.find((w) => !w.active)
      if (!wp) return

      const margin = wp.radius + 15
      if (riverWidth < margin * 2) return

      const spawnX = bounds.left + margin + this.random() * (riverWidth - margin * 2)
      wp.x = spawnX
      wp.y = spawnY
      wp.active = true
      wp.angle = this.random() * Math.PI * 2
    } else {
      // Spawn Shore Bunker on either bank
      const bunker = this.bunkers.find((b) => !b.active)
      if (!bunker) return

      const isLeft = this.random() < 0.5
      bunker.side = isLeft ? 'left' : 'right'
      bunker.x = isLeft ? bounds.left - BUNKER_WIDTH / 2 + 4 : bounds.right + BUNKER_WIDTH / 2 - 4
      bunker.y = spawnY
      bunker.hp = BUNKER_HP
      bunker.maxHp = BUNKER_HP
      bunker.shootCooldown = 1.0 + this.random() * 1.5
      bunker.active = true
      bunker.damageFlashTimer = 0
    }
  }
}
