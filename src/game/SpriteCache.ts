import type { EnemyType } from './EnemyTypes'
import { ENEMY_CONFIGS } from './EnemyTypes'

export type CanvasLike = OffscreenCanvas | HTMLCanvasElement

export class SpriteCache {
  private static instance: SpriteCache | null = null
  private enemySprites: Map<string, CanvasLike> = new Map()
  private fuelSprite: CanvasLike | null = null

  public static getInstance(): SpriteCache {
    if (!SpriteCache.instance) {
      SpriteCache.instance = new SpriteCache()
    }
    return SpriteCache.instance
  }

  public createCanvas(width: number, height: number): { canvas: CanvasLike; ctx: CanvasRenderingContext2D | null } {
    let canvas: CanvasLike
    if (typeof OffscreenCanvas !== 'undefined') {
      canvas = new OffscreenCanvas(Math.ceil(width), Math.ceil(height))
    } else if (typeof document !== 'undefined') {
      canvas = document.createElement('canvas')
      canvas.width = Math.ceil(width)
      canvas.height = Math.ceil(height)
    } else {
      // Fallback stub for headless non-DOM test environments
      canvas = { width: Math.ceil(width), height: Math.ceil(height) } as unknown as CanvasLike
      return { canvas, ctx: null }
    }
    const ctx = canvas.getContext('2d') as CanvasRenderingContext2D | null
    return { canvas, ctx }
  }

  public getEnemySprite(type: EnemyType, rotorFrame = 0): CanvasLike | null {
    const key = `${type}_${rotorFrame}`
    if (this.enemySprites.has(key)) {
      return this.enemySprites.get(key)!
    }

    const cfg = ENEMY_CONFIGS[type]
    if (!cfg) return null

    const w = cfg.width + 4
    const h = cfg.height + 4
    const { canvas, ctx } = this.createCanvas(w, h)
    if (!ctx) return null

    ctx.save()
    ctx.translate(w / 2, h / 2)
    this.drawEnemyGeometry(ctx, type, cfg.width, cfg.height, rotorFrame)
    ctx.restore()

    this.enemySprites.set(key, canvas)
    return canvas
  }

  public getFuelSprite(): CanvasLike | null {
    if (this.fuelSprite) return this.fuelSprite

    const w = 24
    const h = 40
    const { canvas, ctx } = this.createCanvas(w, h)
    if (!ctx) return null

    ctx.save()
    ctx.translate(w / 2, h / 2)
    // Red & white gas tank
    ctx.fillStyle = '#e53935'
    ctx.fillRect(-8, -16, 16, 32)
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(-8, -8, 16, 16)
    ctx.fillStyle = '#b71c1c'
    ctx.fillRect(-6, -18, 12, 4)
    ctx.restore()

    this.fuelSprite = canvas
    return canvas
  }

  public clear(): void {
    this.enemySprites.clear()
    this.fuelSprite = null
  }

  private drawEnemyGeometry(
    ctx: CanvasRenderingContext2D,
    type: EnemyType,
    width: number,
    height: number,
    rotorFrame: number
  ): void {
    const cx = 0
    const cy = 0
    const hw = width / 2
    const hh = height / 2

    if (type === 'helicopter') {
      // Skids
      ctx.fillStyle = '#444444'
      ctx.fillRect(cx - 8, cy - 2, 1, 11)
      ctx.fillRect(cx + 7, cy - 2, 1, 11)
      // Tail boom
      ctx.fillStyle = '#7a1414'
      ctx.fillRect(cx - 2, cy - 13, 4, 9)
      // Tail fin
      ctx.fillStyle = '#cc2222'
      ctx.fillRect(cx - 5, cy - 14, 10, 3)
      ctx.fillStyle = '#e8e8e8'
      ctx.fillRect(cx + 4, cy - 14, 2, 5)
      // Main fuselage
      ctx.fillStyle = '#cc2222'
      ctx.fillRect(cx - 6, cy - 6, 12, 13)
      // Cockpit windshield
      ctx.fillStyle = '#88ddff'
      ctx.fillRect(cx - 4, cy + 1, 8, 4)
      ctx.fillStyle = '#ffffff'
      ctx.fillRect(cx - 3, cy + 2, 2, 2)
      // Rotor blade rotation frame
      ctx.fillStyle = '#f0f0f0'
      const bladeAngle = (rotorFrame % 4) * (Math.PI / 4)
      ctx.save()
      ctx.rotate(bladeAngle)
      ctx.fillRect(-12, -1.5, 24, 3)
      ctx.restore()
    } else if (type === 'plane') {
      // Fuselage
      ctx.fillStyle = '#ffffff'
      ctx.fillRect(cx - 2, cy - hh, 4, height)
      // Delta Wings
      ctx.fillStyle = '#e0e0e0'
      ctx.beginPath()
      ctx.moveTo(cx, cy + hh * 0.4)
      ctx.lineTo(cx - hw, cy + hh * 0.9)
      ctx.lineTo(cx + hw, cy + hh * 0.9)
      ctx.closePath()
      ctx.fill()
      // Tail stabilizer
      ctx.fillStyle = '#00e5ff'
      ctx.fillRect(cx - 5, cy - hh, 10, 4)
      // Cockpit
      ctx.fillStyle = '#0055aa'
      ctx.fillRect(cx - 1.5, cy - hh * 0.2, 3, 7)
    } else if (type === 'boat') {
      // Hull
      ctx.fillStyle = '#2e7d32'
      ctx.beginPath()
      ctx.moveTo(cx, cy + hh)
      ctx.lineTo(cx - hw, cy - hh * 0.5)
      ctx.lineTo(cx - hw, cy - hh)
      ctx.lineTo(cx + hw, cy - hh)
      ctx.lineTo(cx + hw, cy - hh * 0.5)
      ctx.closePath()
      ctx.fill()
      // Cabin
      ctx.fillStyle = '#ffffff'
      ctx.fillRect(cx - hw * 0.5, cy - hh * 0.4, width * 0.5, height * 0.4)
      // Smoke pipe
      ctx.fillStyle = '#1b5e20'
      ctx.fillRect(cx - 2, cy - hh * 0.8, 4, 6)
    } else if (type === 'gunboat') {
      // Dark armored hull
      ctx.fillStyle = '#263238'
      ctx.beginPath()
      ctx.moveTo(cx, cy + hh)
      ctx.lineTo(cx - hw, cy - hh * 0.5)
      ctx.lineTo(cx - hw, cy - hh)
      ctx.lineTo(cx + hw, cy - hh)
      ctx.lineTo(cx + hw, cy - hh * 0.5)
      ctx.closePath()
      ctx.fill()
      // Turret deck
      ctx.fillStyle = '#ff9800'
      ctx.fillRect(cx - 3, cy - 3, 6, 6)
      // Dual cannons
      ctx.fillStyle = '#eceff1'
      ctx.fillRect(cx - 4, cy + 2, 2, 8)
      ctx.fillRect(cx + 2, cy + 2, 2, 8)
    } else if (type === 'tank') {
      // Treads
      ctx.fillStyle = '#212121'
      ctx.fillRect(cx - hw, cy - hh, 4, height)
      ctx.fillRect(cx + hw - 4, cy - hh, 4, height)
      // Armor body
      ctx.fillStyle = '#5d4037'
      ctx.fillRect(cx - hw + 3, cy - hh + 2, width - 6, height - 4)
      // Turret
      ctx.fillStyle = '#8d6e63'
      ctx.beginPath()
      ctx.arc(cx, cy, 5, 0, Math.PI * 2)
      ctx.fill()
      // Cannon
      ctx.fillStyle = '#d7ccc8'
      ctx.fillRect(cx - 1.5, cy - hh - 4, 3, 8)
    } else if (type === 'bridge') {
      // Asphalt road
      ctx.fillStyle = '#424242'
      ctx.fillRect(cx - hw, cy - hh, width, height)
      // Yellow lane dividers
      ctx.fillStyle = '#fbc02d'
      ctx.fillRect(cx - hw, cy - 1, width, 2)
      // Steel girders
      ctx.fillStyle = '#78909c'
      ctx.fillRect(cx - hw, cy - hh, width, 3)
      ctx.fillRect(cx - hw, cy + hh - 3, width, 3)
    }
  }
}
