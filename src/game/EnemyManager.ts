import type { Rect } from './CollisionSystem'

export type EnemyType = 'helicopter' | 'plane' | 'boat' | 'bridge'

export interface EnemyBullet {
  x: number
  y: number
  speed: number
  width: number
  height: number
  active: boolean
  fromPlane: boolean
}

export interface Enemy {
  type: EnemyType
  x: number
  y: number
  width: number
  height: number
  speed: number
  active: boolean
  points: number
  canShoot: boolean
  shootCooldown: number
  shootInterval: number
  phase?: number
  phaseSpeed?: number
  amplitude?: number
  originX?: number
}

const ENEMY_CONFIGS: Record<EnemyType, { width: number; height: number; points: number }> = {
  helicopter: { width: 28, height: 20, points: 60 },
  plane: { width: 32, height: 28, points: 100 },
  boat: { width: 24, height: 16, points: 30 },
  bridge: { width: 200, height: 16, points: 500 },
}

export class EnemyManager {
  enemies: Enemy[] = []
  bullets: EnemyBullet[] = []
  private spawnTimer = 0
  private spawnInterval = 1.5
  private gameTime = 0
  private canvasHeight: number

  constructor(_canvasWidth: number, canvasHeight: number) {
    this.canvasHeight = canvasHeight
  }

  setCanvasHeight(h: number): void {
    this.canvasHeight = h
  }

  update(dt: number, world: { getBoundsAtY: (y: number) => { left: number; right: number } }, riverSegments: { centerX: number; width: number; y: number }[], scrollSpeed = 120): void {
    this.gameTime += dt

    this.spawnInterval = Math.max(0.25, 1.2 - this.gameTime * 0.008)

    this.spawnTimer -= dt
    if (this.spawnTimer <= 0) {
      this.spawn(riverSegments, 0)
      if (this.gameTime > 10 && Math.random() < 0.5) {
        this.spawn(riverSegments, -60)
      }
      if (this.gameTime > 30 && Math.random() < 0.4) {
        this.spawn(riverSegments, -120)
      }
      if (this.gameTime > 60 && Math.random() < 0.3) {
        this.spawn(riverSegments, -180)
      }
      this.spawnTimer = this.spawnInterval
    }

    for (const enemy of this.enemies) {
      enemy.y += scrollSpeed * dt * (enemy.type === 'bridge' ? 1 : 0.3)

      if (enemy.type === 'helicopter' && enemy.originX !== undefined && enemy.phase !== undefined && enemy.phaseSpeed !== undefined && enemy.amplitude !== undefined) {
        enemy.phase += enemy.phaseSpeed * dt
        enemy.x = enemy.originX + Math.sin(enemy.phase) * enemy.amplitude
      }

      if (enemy.type === 'boat' && enemy.originX !== undefined && enemy.phase !== undefined && enemy.phaseSpeed !== undefined && enemy.amplitude !== undefined) {
        enemy.phase += enemy.phaseSpeed * dt
        enemy.x = enemy.originX + Math.sin(enemy.phase) * enemy.amplitude
      }

      if (enemy.type !== 'bridge') {
        const bounds = world.getBoundsAtY(enemy.y)
        const hw = enemy.width / 2
        enemy.x = Math.max(bounds.left + hw + 2, Math.min(bounds.right - hw - 2, enemy.x))
      }

      if (enemy.canShoot && enemy.y > 0) {
        enemy.shootCooldown -= dt
        if (enemy.shootCooldown <= 0) {
          const bulletSpeed = enemy.type === 'plane' ? 350 + this.gameTime * 0.8 : 220 + this.gameTime * 0.4
          this.bullets.push({
            x: enemy.x,
            y: enemy.y + enemy.height / 2,
            speed: bulletSpeed,
            width: enemy.type === 'plane' ? 5 : 4,
            height: enemy.type === 'plane' ? 10 : 8,
            active: true,
            fromPlane: enemy.type === 'plane',
          })
          enemy.shootCooldown = enemy.shootInterval + Math.random() * 0.3
        }
      }

      if (enemy.y > this.canvasHeight + 50) {
        enemy.active = false
      }
    }

    for (const bullet of this.bullets) {
      bullet.y += bullet.speed * dt
      if (bullet.y > this.canvasHeight + 20) {
        bullet.active = false
      }
    }

    this.enemies = this.enemies.filter((e) => e.active)
    this.bullets = this.bullets.filter((b) => b.active)
  }

  private spawn(riverSegments: { centerX: number; width: number; y: number }[], yOffset = 0): void {
    if (riverSegments.length === 0) return

    const topSegment = riverSegments[riverSegments.length - 1]

    const weights: [EnemyType, number][] = [
      ['helicopter', 40],
      ['plane', 30],
      ['boat', 20],
      ['bridge', 10],
    ]
    const roll = Math.random() * 100
    let cumulative = 0
    let type: EnemyType = 'helicopter'
    for (const [t, w] of weights) {
      cumulative += w
      if (roll < cumulative) {
        type = t
        break
      }
    }

    const config = ENEMY_CONFIGS[type]

    let x: number
    let width = config.width

    if (type === 'bridge') {
      x = topSegment.centerX
      // Bridge spans the full river width minus a small gap for pillars
      width = Math.max(60, topSegment.width - 4)
    } else {
      const leftBound = topSegment.centerX - topSegment.width / 2 + config.width
      const rightBound = topSegment.centerX + topSegment.width / 2 - config.width
      x = leftBound + Math.random() * (rightBound - leftBound)
    }

    let canShoot = false
    let shootInterval = 3.0
    if (type === 'helicopter') {
      canShoot = Math.random() < 0.5
      shootInterval = 2.0 + Math.random()
    } else if (type === 'plane') {
      canShoot = Math.random() < 0.6
      shootInterval = 0.6 + Math.random() * 0.4
    }

    const enemy: Enemy = {
      type,
      x,
      y: -20 + yOffset,
      width,
      height: config.height,
      speed: type === 'plane' ? 200 : type === 'helicopter' ? 80 : type === 'boat' ? 40 : 0,
      active: true,
      points: config.points,
      canShoot,
      shootCooldown: 1.0 + Math.random() * 2.0,
      shootInterval,
    }

    if (type === 'helicopter') {
      enemy.originX = x
      enemy.phase = Math.random() * Math.PI * 2
      enemy.phaseSpeed = 2 + Math.random()
      enemy.amplitude = 30 + Math.random() * 40
    }

    if (type === 'boat') {
      enemy.originX = x
      enemy.phase = Math.random() * Math.PI * 2
      enemy.phaseSpeed = 0.8 + Math.random() * 0.5
      enemy.amplitude = 20 + Math.random() * 20
    }

    this.enemies.push(enemy)
  }

  render(ctx: CanvasRenderingContext2D): void {
    for (const enemy of this.enemies) {
      ctx.save()
      switch (enemy.type) {
        case 'helicopter':
          this.renderHelicopter(ctx, enemy)
          break
        case 'plane':
          this.renderPlane(ctx, enemy)
          break
        case 'boat':
          this.renderBoat(ctx, enemy)
          break
        case 'bridge':
          this.renderBridge(ctx, enemy)
          break
      }
      ctx.restore()
    }

    for (const bullet of this.bullets) {
      ctx.save()
      if (bullet.fromPlane) {
        ctx.fillStyle = '#cc44ff'
        ctx.fillRect(bullet.x - bullet.width / 2, bullet.y, bullet.width, bullet.height)
        ctx.fillStyle = '#ee88ff'
        ctx.fillRect(bullet.x - 1, bullet.y, 2, bullet.height * 0.5)
      } else {
        ctx.fillStyle = '#ff4444'
        ctx.fillRect(bullet.x - bullet.width / 2, bullet.y, bullet.width, bullet.height)
        ctx.fillStyle = '#ff8888'
        ctx.fillRect(bullet.x - 1, bullet.y, 2, bullet.height * 0.5)
      }
      ctx.restore()
    }
  }

  private renderHelicopter(ctx: CanvasRenderingContext2D, e: Enemy): void {
    const cx = e.x
    const cy = e.y
    ctx.fillStyle = '#cc2222'
    ctx.fillRect(cx - 10, cy - 4, 20, 8)
    ctx.fillStyle = '#aa1111'
    ctx.fillRect(cx - 4, cy - 8, 8, 4)
    ctx.fillStyle = '#ff4444'
    ctx.fillRect(cx + 8, cy - 2, 6, 4)
    ctx.fillStyle = '#dd3333'
    ctx.fillRect(cx - 14, cy - 1, 4, 2)
    ctx.strokeStyle = '#ff6666'
    ctx.lineWidth = 1
    ctx.beginPath()
    ctx.moveTo(cx - 16, cy - 4)
    ctx.lineTo(cx + 16, cy - 4)
    ctx.stroke()
    if (e.canShoot) {
      ctx.fillStyle = '#ffaa00'
      ctx.fillRect(cx - 2, cy + 4, 4, 4)
    }
  }

  private renderPlane(ctx: CanvasRenderingContext2D, e: Enemy): void {
    const cx = e.x
    const cy = e.y
    ctx.fillStyle = '#8855bb'
    ctx.beginPath()
    ctx.moveTo(cx, cy + e.height / 2)
    ctx.lineTo(cx - e.width / 2, cy - e.height / 2)
    ctx.lineTo(cx - 4, cy - e.height / 2 + 6)
    ctx.lineTo(cx, cy - e.height / 2 + 4)
    ctx.lineTo(cx + 4, cy - e.height / 2 + 6)
    ctx.lineTo(cx + e.width / 2, cy - e.height / 2)
    ctx.closePath()
    ctx.fill()
    ctx.fillStyle = '#6633aa'
    ctx.fillRect(cx - 12, cy + 2, 24, 4)
    ctx.fillStyle = '#aa77ee'
    ctx.fillRect(cx - 2, cy + 4, 4, 6)
    if (e.canShoot) {
      ctx.fillStyle = '#ffaa00'
      ctx.fillRect(cx - 2, cy + e.height / 2, 4, 4)
    }
  }

  private renderBoat(ctx: CanvasRenderingContext2D, e: Enemy): void {
    const cx = e.x
    const cy = e.y
    ctx.fillStyle = '#5588bb'
    ctx.beginPath()
    ctx.moveTo(cx - e.width / 2, cy - 2)
    ctx.lineTo(cx - e.width / 2 + 4, cy + e.height / 2)
    ctx.lineTo(cx + e.width / 2 - 4, cy + e.height / 2)
    ctx.lineTo(cx + e.width / 2, cy - 2)
    ctx.closePath()
    ctx.fill()
    ctx.fillStyle = '#3366aa'
    ctx.fillRect(cx - 2, cy - e.height / 2, 4, e.height * 0.6)
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(cx - 1, cy - e.height / 2 + 2, 2, 4)
  }

  private renderBridge(ctx: CanvasRenderingContext2D, e: Enemy): void {
    const left = e.x - e.width / 2
    const top = e.y - e.height / 2
    ctx.fillStyle = '#7a5a3a'
    ctx.fillRect(left, top, e.width, e.height)
    ctx.fillStyle = '#5a3a1a'
    const pillarSpacing = 10
    for (let px = left; px < left + e.width; px += pillarSpacing) {
      ctx.fillRect(px, top, 3, e.height)
    }
    ctx.fillStyle = '#9a7a5a'
    ctx.fillRect(left, top, e.width, 3)
    ctx.fillRect(left, top + e.height - 3, e.width, 3)
  }

  getEnemyRects(): Rect[] {
    return this.enemies
      .filter((e) => e.active)
      .map((e) => ({
        x: e.x,
        y: e.y,
        width: e.width,
        height: e.height,
      }))
  }

  getBulletRects(): Rect[] {
    return this.bullets
      .filter((b) => b.active)
      .map((b) => ({
        x: b.x,
        y: b.y,
        width: b.width,
        height: b.height,
      }))
  }

  reset(_canvasWidth: number, canvasHeight: number): void {
    this.canvasHeight = canvasHeight
    this.enemies = []
    this.bullets = []
    this.spawnTimer = 0
    this.spawnInterval = 1.5
    this.gameTime = 0
  }
}
