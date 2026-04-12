type SceneryType = 'palm' | 'tree' | 'house' | 'bush' | 'rock' | 'fueltank'

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
}

const SPAWN_INTERVAL = 280

function pickType(): SceneryType {
  const entries = Object.entries(SCENERY_CONFIGS) as [SceneryType, { weight: number }][]
  const total = entries.reduce((s, [, c]) => s + c.weight, 0)
  let roll = Math.random() * total
  for (const [type, cfg] of entries) {
    roll -= cfg.weight
    if (roll <= 0) return type
  }
  return 'bush'
}

export class Scenery {
  objects: SceneryObject[] = []
  private canvasHeight: number
  private spawnProgress = 0

  constructor(_canvasWidth: number, canvasHeight: number) {
    this.canvasHeight = canvasHeight
  }

  setCanvasHeight(h: number): void {
    this.canvasHeight = h
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

    this.objects = this.objects.filter((o) => o.y < this.canvasHeight + 100 && o.active)
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
      const type = pickType()
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

  render(ctx: CanvasRenderingContext2D): void {
    for (const obj of this.objects) {
      if (obj.y < -obj.height || obj.y > this.canvasHeight + obj.height) continue
      ctx.save()
      switch (obj.type) {
        case 'palm':
          this.renderPalm(ctx, obj)
          break
        case 'tree':
          this.renderTree(ctx, obj)
          break
        case 'house':
          this.renderHouse(ctx, obj)
          break
        case 'bush':
          this.renderBush(ctx, obj)
          break
        case 'rock':
          this.renderRock(ctx, obj)
          break
        case 'fueltank':
          this.renderFuelTank(ctx, obj)
          break
      }
      ctx.restore()
    }
  }

  private renderPalm(ctx: CanvasRenderingContext2D, obj: SceneryObject): void {
    const cx = obj.x
    const baseY = obj.y + obj.height / 2
    const trunkH = obj.height * 0.7

    ctx.fillStyle = '#6b4226'
    ctx.fillRect(cx - 2, baseY - trunkH, 4, trunkH)

    ctx.fillStyle = '#1a8a1a'
    const topY = baseY - trunkH
    const leafLen = obj.variant === 0 ? 14 : obj.variant === 1 ? 10 : 12
    for (let i = 0; i < 5; i++) {
      const angle = (i / 5) * Math.PI * 2 - Math.PI / 2
      ctx.beginPath()
      ctx.moveTo(cx, topY)
      const lx = cx + Math.cos(angle) * leafLen
      const ly = topY + Math.sin(angle) * leafLen * 0.6 + leafLen * 0.3
      ctx.quadraticCurveTo(cx + Math.cos(angle) * leafLen * 0.5, topY - 4, lx, ly)
      ctx.quadraticCurveTo(cx + Math.cos(angle) * leafLen * 0.5, topY + 2, cx, topY)
      ctx.fill()
    }

    if (obj.variant === 2) {
      ctx.fillStyle = '#cc8800'
      ctx.beginPath()
      ctx.arc(cx, topY + 3, 3, 0, Math.PI * 2)
      ctx.fill()
    }
  }

  private renderTree(ctx: CanvasRenderingContext2D, obj: SceneryObject): void {
    const cx = obj.x
    const baseY = obj.y + obj.height / 2
    const trunkH = obj.height * 0.4
    const crownR = obj.width / 2

    ctx.fillStyle = '#5a3a1a'
    ctx.fillRect(cx - 3, baseY - trunkH, 6, trunkH)

    const crownY = baseY - trunkH - crownR * 0.4
    const greens = ['#1a7a1a', '#2a8a2a', '#0f6a0f']
    ctx.fillStyle = greens[obj.variant]
    ctx.beginPath()
    ctx.arc(cx, crownY, crownR, 0, Math.PI * 2)
    ctx.fill()

    ctx.fillStyle = 'rgba(0,0,0,0.15)'
    ctx.beginPath()
    ctx.arc(cx + 2, crownY + 2, crownR * 0.7, 0, Math.PI * 2)
    ctx.fill()

    if (obj.variant === 1) {
      ctx.fillStyle = '#228822'
      ctx.beginPath()
      ctx.arc(cx - crownR * 0.3, crownY - crownR * 0.3, crownR * 0.5, 0, Math.PI * 2)
      ctx.fill()
    }
  }

  private renderHouse(ctx: CanvasRenderingContext2D, obj: SceneryObject): void {
    const cx = obj.x
    const baseY = obj.y + obj.height / 2
    const w = obj.width
    const h = obj.height * 0.65
    const roofH = obj.height * 0.35

    const wallColors = ['#c4a882', '#b89a78', '#d4b892']
    ctx.fillStyle = wallColors[obj.variant]
    ctx.fillRect(cx - w / 2, baseY - h, w, h)

    ctx.fillStyle = '#8b4513'
    ctx.beginPath()
    ctx.moveTo(cx - w / 2 - 3, baseY - h)
    ctx.lineTo(cx, baseY - h - roofH)
    ctx.lineTo(cx + w / 2 + 3, baseY - h)
    ctx.closePath()
    ctx.fill()

    ctx.fillStyle = '#ffee88'
    const winW = 4
    const winH = 5
    ctx.fillRect(cx - w / 4 - winW / 2, baseY - h + 4, winW, winH)
    ctx.fillRect(cx + w / 4 - winW / 2, baseY - h + 4, winW, winH)

    ctx.fillStyle = '#6b4226'
    ctx.fillRect(cx - 3, baseY - 8, 6, 8)

    if (obj.variant === 2) {
      ctx.fillStyle = '#993333'
      ctx.fillRect(cx + 1, baseY - h - roofH + 2, 3, roofH * 0.5)
    }
  }

  private renderBush(ctx: CanvasRenderingContext2D, obj: SceneryObject): void {
    const cx = obj.x
    const cy = obj.y

    const greens = ['#2a8a2a', '#3a9a3a', '#1a7a1a']
    ctx.fillStyle = greens[obj.variant]
    ctx.beginPath()
    ctx.ellipse(cx, cy, obj.width / 2, obj.height / 2, 0, 0, Math.PI * 2)
    ctx.fill()

    ctx.fillStyle = 'rgba(0,0,0,0.1)'
    ctx.beginPath()
    ctx.ellipse(cx + 2, cy + 1, obj.width / 2.5, obj.height / 3, 0, 0, Math.PI * 2)
    ctx.fill()
  }

  private renderRock(ctx: CanvasRenderingContext2D, obj: SceneryObject): void {
    const cx = obj.x
    const cy = obj.y
    const hw = obj.width / 2
    const hh = obj.height / 2

    const grays = ['#777777', '#888888', '#6a6a6a']
    ctx.fillStyle = grays[obj.variant]
    ctx.beginPath()
    ctx.moveTo(cx - hw, cy + hh)
    ctx.lineTo(cx - hw * 0.6, cy - hh)
    ctx.lineTo(cx + hw * 0.8, cy - hh * 0.7)
    ctx.lineTo(cx + hw, cy + hh)
    ctx.closePath()
    ctx.fill()

    ctx.fillStyle = 'rgba(255,255,255,0.12)'
    ctx.beginPath()
    ctx.moveTo(cx - hw * 0.4, cy - hh * 0.8)
    ctx.lineTo(cx - hw * 0.1, cy - hh * 0.3)
    ctx.lineTo(cx + hw * 0.3, cy - hh * 0.5)
    ctx.closePath()
    ctx.fill()
  }

  private renderFuelTank(ctx: CanvasRenderingContext2D, obj: SceneryObject): void {
    const cx = obj.x
    const baseY = obj.y + obj.height / 2
    const w = obj.width
    const h = obj.height

    ctx.fillStyle = '#aa3333'
    ctx.fillRect(cx - w / 2, baseY - h, w, h)

    ctx.fillStyle = '#ffffff'
    ctx.fillRect(cx - w / 2, baseY - h / 2 - 1, w, 3)

    ctx.fillStyle = '#ddcc44'
    ctx.font = 'bold 7px monospace'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText('F', cx, baseY - h * 0.75)

    ctx.strokeStyle = '#666666'
    ctx.lineWidth = 1
    ctx.strokeRect(cx - w / 2, baseY - h, w, h)

    ctx.fillStyle = '#777777'
    ctx.fillRect(cx - 3, baseY - h - 3, 6, 3)
  }

  reset(_canvasWidth: number, canvasHeight: number): void {
    this.canvasHeight = canvasHeight
    this.objects = []
    this.spawnProgress = 0
  }
}
