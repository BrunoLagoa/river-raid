import { CollisionSystem } from './CollisionSystem'
import type { Rect } from './CollisionSystem'
import { compactArray } from './utils'

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

  setCanvasHeight(h: number): void {
    this.canvasHeight = h
  }

  update(dt: number, world: { getBoundsAtY: (y: number) => { left: number; right: number } }, riverSegments: { centerX: number; width: number; y: number }[], scrollSpeed = 120): void {
    // Dynamic fuel drain: faster speed = more consumption
    const dynamicDrain = this.drainRate + scrollSpeed * 0.012
    this.fuel = Math.max(0, this.fuel - dynamicDrain * dt)

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

    compactArray(this.tanks, (t) => t.active)
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
      width: 28,
      height: 52,
      active: true,
    })
  }

  spawnAt(x: number, y: number): void {
    this.tanks.push({
      x,
      y,
      width: 28,
      height: 52,
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
    if (collected) compactArray(this.tanks, (t) => t.active)
    return collected
  }

  render(ctx: CanvasRenderingContext2D): void {
    for (const tank of this.tanks) {
      this.drawFuelTank(ctx, tank.x, tank.y, tank.width, tank.height)
    }
  }

  private drawFuelTank(ctx: CanvasRenderingContext2D, cx: number, cy: number, w: number, h: number): void {
    ctx.save()

    const left = cx - w / 2
    const top = cy - h / 2

    // === Green accent bar on the left (matches original River Raid sprite) ===
    const accentW = Math.max(3, Math.round(w * 0.14))
    ctx.fillStyle = '#cc3322'
    ctx.fillRect(left, top, accentW, h)

    // === Letter cells — each letter gets its own vivid red/coral block ===
    const letters = ['F', 'U', 'E', 'L']
    const bodyLeft = left + accentW
    const bodyW = w - accentW
    const cellH = h / letters.length

    // Alternating red shades to give depth, distinct from river blue
    const cellColors = ['#cc3322', '#0f7f0b', '#cc3322', '#0f7f0b']

    for (let i = 0; i < letters.length; i++) {
      const cellTop = top + i * cellH

      // Red/coral cell background
      ctx.fillStyle = cellColors[i]
      ctx.fillRect(bodyLeft, cellTop, bodyW, cellH)

      // Thin dark separator between cells
      if (i > 0) {
        ctx.fillStyle = '#550000'
        ctx.fillRect(bodyLeft, cellTop, bodyW, 1)
      }
    }

    // White outer border around body
    ctx.strokeStyle = '#ffffff'
    ctx.lineWidth = 1
    ctx.strokeRect(bodyLeft + 0.5, top + 0.5, bodyW - 1, h - 1)

    // === White letters centered in each cell ===
    for (let i = 0; i < letters.length; i++) {
      const cellMidY = top + i * cellH + cellH / 2
      ctx.fillStyle = '#ffffff'
      ctx.font = `bold ${Math.round(cellH * 0.65)}px "Courier New", monospace`
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText(letters[i], bodyLeft + bodyW / 2, cellMidY + 0.5)
    }

    ctx.restore()
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
