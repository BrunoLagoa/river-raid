import { compactArray } from './utils'
import type { SceneryType } from './BiomeSystem'

interface SceneryObject {
  type: SceneryType
  x: number
  y: number
  width: number
  height: number
  active: boolean
  side: 'left' | 'right'
  variant: number
}

const SCENERY_CONFIGS: Record<SceneryType, { width: number; height: number; weight: number }> = {
  palm: { width: 18, height: 36, weight: 20 },
  tree: { width: 22, height: 30, weight: 25 },
  house: { width: 28, height: 24, weight: 12 },
  bush: { width: 16, height: 10, weight: 22 },
  rock: { width: 14, height: 10, weight: 15 },
  fueltank: { width: 16, height: 20, weight: 6 },
  pine: { width: 22, height: 38, weight: 30 },
  igloo: { width: 30, height: 22, weight: 12 },
  snowman: { width: 16, height: 26, weight: 6 },
}

const SPAWN_INTERVAL = 280

export class Scenery {
  objects: SceneryObject[] = []
  private canvasHeight: number
  private spawnProgress = 0
  private sceneryWeights: Record<SceneryType, number> = {
    palm: 20, tree: 25, house: 12, bush: 22, rock: 15, fueltank: 6,
    pine: 0, igloo: 0, snowman: 0,
  }

  constructor(_canvasWidth: number, canvasHeight: number) {
    this.canvasHeight = canvasHeight
  }

  setCanvasHeight(h: number): void {
    this.canvasHeight = h
  }

  setSceneryWeights(weights: Record<SceneryType, number>): void {
    this.sceneryWeights = weights
  }

  private pickType(): SceneryType {
    const entries = Object.entries(this.sceneryWeights) as [SceneryType, number][]
    const total = entries.reduce((s, [, w]) => s + w, 0)
    let roll = Math.random() * total
    for (const [type, w] of entries) {
      roll -= w
      if (roll <= 0) return type
    }
    return 'bush'
  }

  get activeCount(): number {
    let n = 0
    for (const o of this.objects) if (o.active) n++
    return n
  }

  update(
    dt: number,
    scrollSpeed: number,
    world: { getBoundsAtY: (y: number) => { left: number; right: number } },
    canvasWidth: number,
  ): void {
    const travel = scrollSpeed * dt
    this.spawnProgress += travel

    for (const obj of this.objects) {
      obj.y += travel
    }

    if (this.spawnProgress >= SPAWN_INTERVAL) {
      this.spawn(world, canvasWidth)
      this.spawnProgress = Math.random() * 50 // small variance for next spawn
    }

    compactArray(this.objects, (o) => o.y < this.canvasHeight + 100 && o.active)
  }

  private spawn(
    world: { getBoundsAtY: (y: number) => { left: number; right: number } },
    canvasWidth: number,
  ): void {
    const spawnY = -60 - Math.random() * 40
    const bounds = world.getBoundsAtY(spawnY)

    // Randomly decide if we spawn on left, right, or both (both is rare)
    const modes: ('left' | 'right' | 'both')[] = ['left', 'right', 'both']
    const weights = [45, 45, 10]
    const roll = Math.random() * 100
    let mode: 'left' | 'right' | 'both' = 'left'
    let cumulative = 0
    for (let i = 0; i < modes.length; i++) {
      cumulative += weights[i]
      if (roll < cumulative) {
        mode = modes[i]
        break
      }
    }

    const sides: ('left' | 'right')[] = []
    if (mode === 'left' || mode === 'both') sides.push('left')
    if (mode === 'right' || mode === 'both') sides.push('right')

    for (const side of sides) {
      const type = this.pickType()
      const cfg = SCENERY_CONFIGS[type]
      const variant = Math.floor(Math.random() * 3)

      let x: number
      if (side === 'left') {
        const minX = cfg.width / 2 + 10
        const maxX = bounds.left - 20
        x = minX + Math.random() * Math.max(0, maxX - minX)
      } else {
        const minX = bounds.right + 20
        const maxX = canvasWidth - cfg.width / 2 - 10
        x = minX + Math.random() * Math.max(0, maxX - minX)
      }

      this.objects.push({
        type,
        x,
        y: spawnY,
        width: cfg.width,
        height: cfg.height,
        active: true,
        side,
        variant,
      })
    }
  }

  render(ctx: CanvasRenderingContext2D, brightness = 1.0): void {
    ctx.save()
    if (brightness < 0.99) ctx.globalAlpha = brightness

    // Single dispatch loop — no per-frame Map grouping (each object draws
    // independently, so grouping bought nothing but GC churn).
    for (const o of this.objects) {
      if (o.y < -o.height || o.y > this.canvasHeight + o.height) continue
      switch (o.type) {
        case 'palm': this.renderPalm(ctx, o); break
        case 'tree': this.renderTree(ctx, o); break
        case 'house': this.renderHouse(ctx, o); break
        case 'bush': this.renderBush(ctx, o); break
        case 'rock': this.renderRock(ctx, o); break
        case 'fueltank': this.renderFuelTank(ctx, o); break
        case 'pine': this.renderPine(ctx, o); break
        case 'igloo': this.renderIgloo(ctx, o); break
        case 'snowman': this.renderSnowman(ctx, o); break
      }
    }
    ctx.restore()
  }

  // ─── Pixel-art renderers (Atari 2600 style) ─────────────────────────────────

  private renderPalm(ctx: CanvasRenderingContext2D, obj: SceneryObject): void {
    // Palm tree: tall vertical trunk + horizontal frond bars
    const cx = obj.x
    const baseY = obj.y + obj.height / 2
    const p = 2 // pixel unit

    // Brown trunk
    ctx.fillStyle = '#6b4226'
    ctx.fillRect(cx - p, baseY - 16 * p, p * 2, 16 * p)

    // Green fronds — horizontal bars at top, getting wider
    ctx.fillStyle = '#7cba3c'
    ctx.fillRect(cx - 5 * p, baseY - 16 * p, 10 * p, p * 2) // top bar
    ctx.fillRect(cx - 4 * p, baseY - 14 * p, 8 * p, p * 2)
    ctx.fillRect(cx - 6 * p, baseY - 12 * p, 12 * p, p * 2) // widest
    ctx.fillRect(cx - 3 * p, baseY - 10 * p, 6 * p, p * 2)
    // Darker frond tips
    ctx.fillStyle = '#5a9a2a'
    ctx.fillRect(cx - 6 * p, baseY - 12 * p, p * 2, p * 2)
    ctx.fillRect(cx + 4 * p, baseY - 12 * p, p * 2, p * 2)
  }

  private renderTree(ctx: CanvasRenderingContext2D, obj: SceneryObject): void {
    // Tree: cross/plus shaped canopy with brown center (matches reference image)
    const cx = obj.x
    const cy = obj.y
    const p = 2 // pixel unit

    // Light green cross — vertical bar
    ctx.fillStyle = '#7cba3c'
    ctx.fillRect(cx - 3 * p, cy - 5 * p, 6 * p, 10 * p)
    // Light green cross — horizontal bar
    ctx.fillRect(cx - 5 * p, cy - 3 * p, 10 * p, 6 * p)

    // Slightly darker corners to round off the cross
    ctx.fillStyle = '#6aaa2e'
    ctx.fillRect(cx - 5 * p, cy - 3 * p, p * 2, p * 2)
    ctx.fillRect(cx + 3 * p, cy - 3 * p, p * 2, p * 2)
    ctx.fillRect(cx - 5 * p, cy + 1 * p, p * 2, p * 2)
    ctx.fillRect(cx + 3 * p, cy + 1 * p, p * 2, p * 2)

    // Brown trunk center
    ctx.fillStyle = '#6b4226'
    ctx.fillRect(cx - p, cy - p, p * 2, p * 2)
  }

  private renderHouse(ctx: CanvasRenderingContext2D, obj: SceneryObject): void {
    // Hangar/building: gray rectangular body with dark windows (matches reference image)
    const cx = obj.x
    const baseY = obj.y + obj.height / 2
    const p = 2 // pixel unit

    // Dark base/shadow
    ctx.fillStyle = '#555555'
    ctx.fillRect(cx - 7 * p, baseY - 2 * p, 14 * p, 4 * p)

    // Main gray body
    ctx.fillStyle = '#b0b0b0'
    ctx.fillRect(cx - 6 * p, baseY - 6 * p, 12 * p, 4 * p)

    // Roof line (slightly wider, lighter)
    ctx.fillStyle = '#cccccc'
    ctx.fillRect(cx - 7 * p, baseY - 7 * p, 14 * p, p)

    // Dark green windows — 3 evenly spaced
    ctx.fillStyle = '#2a5a2a'
    ctx.fillRect(cx - 4 * p, baseY - 5 * p, 2 * p, 2 * p)
    ctx.fillRect(cx - p, baseY - 5 * p, 2 * p, 2 * p)
    ctx.fillRect(cx + 2 * p, baseY - 5 * p, 2 * p, 2 * p)

    // Antenna on variant 1
    if (obj.variant === 1) {
      ctx.fillStyle = '#888888'
      ctx.fillRect(cx, baseY - 9 * p, p, 2 * p)
    }
  }

  private renderBush(ctx: CanvasRenderingContext2D, obj: SceneryObject): void {
    // Small bush: 2-layer green pixel blob
    const cx = obj.x
    const cy = obj.y
    const p = 2

    ctx.fillStyle = '#5a9a2a'
    ctx.fillRect(cx - 3 * p, cy - p, 6 * p, 2 * p)
    ctx.fillStyle = '#7cba3c'
    ctx.fillRect(cx - 2 * p, cy - 2 * p, 4 * p, 4 * p)
    // Darker center
    ctx.fillStyle = '#4a8a1a'
    ctx.fillRect(cx - p, cy - p, 2 * p, 2 * p)
  }

  private renderRock(ctx: CanvasRenderingContext2D, obj: SceneryObject): void {
    // Rock: blocky gray pixel shape
    const cx = obj.x
    const cy = obj.y
    const p = 2

    ctx.fillStyle = '#888888'
    ctx.fillRect(cx - 2 * p, cy - p, 4 * p, 2 * p)
    ctx.fillStyle = '#777777'
    ctx.fillRect(cx - 3 * p, cy + p, 6 * p, p)
    // Highlight pixel
    ctx.fillStyle = '#aaaaaa'
    ctx.fillRect(cx - p, cy - p, p, p)
  }

  private renderFuelTank(ctx: CanvasRenderingContext2D, obj: SceneryObject): void {
    // Fuel depot: small red structure on the bank
    const cx = obj.x
    const baseY = obj.y + obj.height / 2
    const p = 2

    // Red body
    ctx.fillStyle = '#cc3322'
    ctx.fillRect(cx - 3 * p, baseY - 5 * p, 6 * p, 8 * p)

    // White stripe
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(cx - 3 * p, baseY - 2 * p, 6 * p, p)

    // "F" letter
    ctx.fillStyle = '#ffffff'
    ctx.font = 'bold 7px monospace'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText('F', cx, baseY - 3 * p)

    // Dark border
    ctx.strokeStyle = '#881100'
    ctx.lineWidth = 1
    ctx.strokeRect(cx - 3 * p, baseY - 5 * p, 6 * p, 8 * p)
  }

  private renderPine(ctx: CanvasRenderingContext2D, obj: SceneryObject): void {
    // Snow-capped conifer: tapering green tiers with white snow on each branch.
    const cx = obj.x
    const baseY = obj.y + obj.height / 2
    const p = 2

    // Trunk
    ctx.fillStyle = '#5a3a22'
    ctx.fillRect(cx - p, baseY - 3 * p, 2 * p, 4 * p)

    // Green tiers (wide bottom → narrow top)
    ctx.fillStyle = '#2f6b3a'
    ctx.fillRect(cx - 7 * p, baseY - 5 * p, 14 * p, 3 * p)
    ctx.fillRect(cx - 5 * p, baseY - 8 * p, 10 * p, 3 * p)
    ctx.fillRect(cx - 4 * p, baseY - 11 * p, 8 * p, 3 * p)
    ctx.fillRect(cx - 3 * p, baseY - 14 * p, 6 * p, 3 * p)
    ctx.fillRect(cx - 2 * p, baseY - 16 * p, 4 * p, 3 * p)

    // Snow caps along the top of each tier
    ctx.fillStyle = '#eef6ff'
    ctx.fillRect(cx - 7 * p, baseY - 5 * p, 14 * p, p)
    ctx.fillRect(cx - 5 * p, baseY - 8 * p, 10 * p, p)
    ctx.fillRect(cx - 4 * p, baseY - 11 * p, 8 * p, p)
    ctx.fillRect(cx - 3 * p, baseY - 14 * p, 6 * p, p)
    ctx.fillRect(cx - 2 * p, baseY - 16 * p, 4 * p, p)
    // Snow clumps for variety
    ctx.fillRect(cx - 6 * p, baseY - 4 * p, 2 * p, p)
    if (obj.variant === 1) ctx.fillRect(cx + 3 * p, baseY - 7 * p, 2 * p, p)
  }

  private renderIgloo(ctx: CanvasRenderingContext2D, obj: SceneryObject): void {
    // Ice-block dome with a dark entrance tunnel.
    const cx = obj.x
    const baseY = obj.y + obj.height / 2
    const p = 2

    // Dome rows (rounded)
    ctx.fillStyle = '#dbe8f5'
    ctx.fillRect(cx - 8 * p, baseY - 2 * p, 16 * p, 3 * p)
    ctx.fillRect(cx - 7 * p, baseY - 5 * p, 14 * p, 3 * p)
    ctx.fillRect(cx - 5 * p, baseY - 8 * p, 10 * p, 3 * p)
    ctx.fillRect(cx - 3 * p, baseY - 10 * p, 6 * p, 2 * p)

    // Block seams (shaded) + highlight
    ctx.fillStyle = '#b9cde0'
    ctx.fillRect(cx - 8 * p, baseY - 2 * p, 16 * p, p)
    ctx.fillRect(cx - 7 * p, baseY - 5 * p, 14 * p, p)
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(cx - 5 * p, baseY - 8 * p, 4 * p, p)

    // Entrance arch (dark) + snow tunnel
    ctx.fillStyle = '#3a4a5a'
    ctx.fillRect(cx - 2 * p, baseY - p, 4 * p, 3 * p)
    ctx.fillStyle = '#dbe8f5'
    ctx.fillRect(cx - 3 * p, baseY - 3 * p, 6 * p, 2 * p)
  }

  private renderSnowman(ctx: CanvasRenderingContext2D, obj: SceneryObject): void {
    // Three stacked snowballs, coal face, carrot nose, stick arms.
    const cx = obj.x
    const baseY = obj.y + obj.height / 2
    const p = 2

    // Bottom ball + shading
    ctx.fillStyle = '#f2f8ff'
    ctx.fillRect(cx - 4 * p, baseY - 4 * p, 8 * p, 5 * p)
    ctx.fillStyle = '#d2e2f0'
    ctx.fillRect(cx - 4 * p, baseY, 8 * p, p)

    // Middle ball + head
    ctx.fillStyle = '#f2f8ff'
    ctx.fillRect(cx - 3 * p, baseY - 8 * p, 6 * p, 4 * p)
    ctx.fillRect(cx - 2 * p, baseY - 12 * p, 4 * p, 4 * p)

    // Coal eyes + button
    ctx.fillStyle = '#222222'
    ctx.fillRect(cx - 2 * p, baseY - 11 * p, p, p)
    ctx.fillRect(cx + p, baseY - 11 * p, p, p)
    ctx.fillRect(cx - p, baseY - 6 * p, 2 * p, p)

    // Carrot nose
    ctx.fillStyle = '#e8821e'
    ctx.fillRect(cx, baseY - 10 * p, 2 * p, p)

    // Stick arms
    ctx.fillStyle = '#6b4a2a'
    ctx.fillRect(cx - 6 * p, baseY - 7 * p, 2 * p, p)
    ctx.fillRect(cx + 4 * p, baseY - 7 * p, 2 * p, p)

    // Scarf (most variants)
    if (obj.variant !== 2) {
      ctx.fillStyle = '#cc3344'
      ctx.fillRect(cx - 3 * p, baseY - 8 * p, 6 * p, p)
    }
  }

  reset(_canvasWidth: number, canvasHeight: number): void {
    this.canvasHeight = canvasHeight
    this.objects = []
    this.spawnProgress = 0
  }
}
