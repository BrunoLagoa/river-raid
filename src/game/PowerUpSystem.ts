import { compactArray } from './utils'

export type PowerUpType = 'double_shot' | 'shield' | 'slow_motion'

export interface PowerUp {
  type: PowerUpType
  x: number
  y: number
  width: number
  height: number
  active: boolean
}

export class PowerUpSystem {
  powerUps: PowerUp[] = []
  private canvasHeight: number

  constructor(_canvasWidth: number, canvasHeight: number) {
    this.canvasHeight = canvasHeight
  }

  setCanvasHeight(h: number): void {
    this.canvasHeight = h
  }

  trySpawnAt(x: number, y: number): void {
    // 8% drop chance
    if (Math.random() > 0.08) return

    const types: PowerUpType[] = ['double_shot', 'shield', 'slow_motion']
    const type = types[Math.floor(Math.random() * types.length)]

    this.powerUps.push({
      type,
      x,
      y,
      width: 16,
      height: 16,
      active: true,
    })
  }

  update(dt: number, scrollSpeed: number, world: { getBoundsAtY: (y: number) => { left: number; right: number } }): void {
    for (const p of this.powerUps) {
      if (!p.active) continue

      p.y += scrollSpeed * dt

      const bounds = world.getBoundsAtY(p.y)
      const hw = p.width / 2
      p.x = Math.max(bounds.left + hw + 2, Math.min(bounds.right - hw - 2, p.x))

      if (p.y > this.canvasHeight + 50) {
        p.active = false
      }
    }
    compactArray(this.powerUps, (p) => p.active)
  }

  render(ctx: CanvasRenderingContext2D): void {
    for (const p of this.powerUps) {
      ctx.save()
      ctx.translate(p.x, p.y)

      if (p.type === 'double_shot') {
        ctx.fillStyle = '#ff4444'
        ctx.strokeStyle = '#ffeecc'
      } else if (p.type === 'shield') {
        ctx.fillStyle = '#4488ff'
        ctx.strokeStyle = '#ccffff'
      } else if (p.type === 'slow_motion') {
        ctx.fillStyle = '#eebb00'
        ctx.strokeStyle = '#ffffff'
      }

      ctx.lineWidth = 1.5
      ctx.fillRect(-p.width / 2, -p.height / 2, p.width, p.height)
      ctx.strokeRect(-p.width / 2, -p.height / 2, p.width, p.height)

      ctx.fillStyle = '#ffffff'
      ctx.font = 'bold 12px "Courier New", monospace'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'

      let letter = ''
      if (p.type === 'double_shot') letter = 'D'
      if (p.type === 'shield') letter = 'S'
      if (p.type === 'slow_motion') letter = 'T'

      ctx.fillText(letter, 0, 1)
      ctx.restore()
    }
  }

  reset(_canvasWidth: number, canvasHeight: number): void {
    this.canvasHeight = canvasHeight
    this.powerUps = []
  }
}
