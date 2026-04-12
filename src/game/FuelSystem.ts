import { CollisionSystem } from './CollisionSystem'
import type { Rect } from './CollisionSystem'

export interface FuelTank {
  x: number
  y: number
  width: number
  height: number
  active: boolean
}

export class FuelSystem {
  tanks: FuelTank[] = []
  fuel = 100
  drainRate = 5
  private spawnTimer = 0
  private spawnInterval = 6.0
  private canvasHeight: number

  constructor(_canvasWidth: number, canvasHeight: number) {
    this.canvasHeight = canvasHeight
  }

  update(dt: number, world: { getBoundsAtY: (y: number) => { left: number; right: number } }, riverSegments: { centerX: number; width: number; y: number }[], scrollSpeed = 120): void {
    this.fuel = Math.max(0, this.fuel - this.drainRate * dt)

    this.spawnTimer -= dt
    if (this.spawnTimer <= 0) {
      this.spawn(riverSegments)
      this.spawnTimer = this.spawnInterval
    }

    for (const tank of this.tanks) {
      tank.y += scrollSpeed * dt
      if (tank.y > this.canvasHeight + 30) {
        tank.active = false
        continue
      }
      const bounds = world.getBoundsAtY(tank.y)
      const hw = tank.width / 2
      tank.x = Math.max(bounds.left + hw + 2, Math.min(bounds.right - hw - 2, tank.x))
    }

    this.tanks = this.tanks.filter((t) => t.active)
  }

  private spawn(riverSegments: { centerX: number; width: number; y: number }[]): void {
    if (riverSegments.length === 0) return

    const seg = riverSegments[riverSegments.length - 1]
    const leftBound = seg.centerX - seg.width / 2 + 20
    const rightBound = seg.centerX + seg.width / 2 - 20
    const x = leftBound + Math.random() * (rightBound - leftBound)

    this.tanks.push({
      x,
      y: -40,
      width: 24,
      height: 36,
      active: true,
    })
  }

  spawnAt(x: number, y: number): void {
    this.tanks.push({
      x,
      y,
      width: 24,
      height: 36,
      active: true,
    })
  }

  checkPickup(playerRect: Rect): boolean {
    let collected = false
    for (const tank of this.tanks) {
      if (!tank.active) continue
      const tankRect: Rect = { x: tank.x, y: tank.y, width: tank.width, height: tank.height }
      if (CollisionSystem.checkAABB(playerRect, tankRect)) {
        tank.active = false
        this.fuel = Math.min(100, this.fuel + 30)
        collected = true
      }
    }
    if (collected) this.tanks = this.tanks.filter((t) => t.active)
    return collected
  }

  render(ctx: CanvasRenderingContext2D): void {
    for (const tank of this.tanks) {
      const cx = tank.x
      const cy = tank.y
      const hw = tank.width / 2
      const hh = tank.height / 2

      ctx.save()

      ctx.fillStyle = '#dd2200'
      ctx.fillRect(cx - hw, cy - hh, tank.width, tank.height)

      ctx.fillStyle = '#ff4422'
      ctx.fillRect(cx - hw + 2, cy - hh + 2, tank.width - 4, tank.height - 4)

      ctx.fillStyle = '#ffffff'
      ctx.fillRect(cx - hw + 2, cy - 2, tank.width - 4, 4)

      ctx.fillStyle = '#ffee44'
      ctx.font = 'bold 14px monospace'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText('F', cx, cy - hh + 10)

      ctx.fillStyle = '#aa1100'
      ctx.fillRect(cx - hw + 2, cy + hh - 6, tank.width - 4, 4)

      ctx.strokeStyle = '#881100'
      ctx.lineWidth = 1
      ctx.strokeRect(cx - hw, cy - hh, tank.width, tank.height)

      ctx.restore()
    }
  }

  isOutOfFuel(): boolean {
    return this.fuel <= 0
  }

  reset(_canvasWidth: number, canvasHeight: number): void {
    this.canvasHeight = canvasHeight
    this.fuel = 100
    this.tanks = []
    this.spawnTimer = 0
  }
}
