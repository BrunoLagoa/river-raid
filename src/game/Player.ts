export type GameState = 'alive' | 'exploding' | 'dead'

export interface Bullet {
  x: number
  y: number
  speed: number
  width: number
  height: number
  active: boolean
}

export class Player {
  x: number
  y: number
  width = 28
  height = 32
  speed = 300
  state: GameState = 'alive'
  bullets: Bullet[] = []
  shootCooldown = 0
  shootInterval = 0.18
  justShot = false
  private animFrame = 0
  private animTimer = 0

  readonly keys: Set<string> = new Set()
  private explodingTimer = 0
  private readonly explodingDuration = 1.2

  constructor(canvasWidth: number, canvasHeight: number) {
    this.x = canvasWidth / 2
    this.y = canvasHeight - 80
  }

  attachInput(): void {
    window.addEventListener('keydown', this.onKeyDown)
    window.addEventListener('keyup', this.onKeyUp)
  }

  detachInput(): void {
    window.removeEventListener('keydown', this.onKeyDown)
    window.removeEventListener('keyup', this.onKeyUp)
    this.keys.clear()
  }

  update(dt: number, leftBound: number, rightBound: number): void {
    if (this.state === 'alive') {
      if (this.keys.has('ArrowLeft')) {
        this.x -= this.speed * dt
      }
      if (this.keys.has('ArrowRight')) {
        this.x += this.speed * dt
      }
      this.x = Math.max(leftBound + this.width / 2 + 2, Math.min(rightBound - this.width / 2 - 2, this.x))

      this.shootCooldown -= dt
      if (this.keys.has(' ') && this.shootCooldown <= 0) {
        this.bullets.push({
          x: this.x,
          y: this.y - this.height / 2,
          speed: 500,
          width: 3,
          height: 12,
          active: true,
        })
        this.shootCooldown = this.shootInterval
        this.justShot = true
      }

      this.animTimer += dt
      if (this.animTimer > 0.1) {
        this.animTimer = 0
        this.animFrame = (this.animFrame + 1) % 4
      }
    }

    if (this.state === 'exploding') {
      this.explodingTimer -= dt
      if (this.explodingTimer <= 0) {
        this.state = 'dead'
      }
    }

    for (const bullet of this.bullets) {
      bullet.y -= bullet.speed * dt
      if (bullet.y + bullet.height < 0) {
        bullet.active = false
      }
    }
    this.bullets = this.bullets.filter((b) => b.active)
  }

  render(ctx: CanvasRenderingContext2D): void {
    if (this.state === 'alive') {
      this.renderShip(ctx)
    }

    if (this.state === 'exploding') {
      this.renderExplosion(ctx)
    }

    for (const bullet of this.bullets) {
      ctx.save()
      ctx.fillStyle = '#ffee44'
      ctx.fillRect(bullet.x - bullet.width / 2, bullet.y, bullet.width, bullet.height)
      ctx.fillStyle = '#ffffff88'
      ctx.fillRect(bullet.x - 1, bullet.y, 2, bullet.height * 0.6)
      ctx.restore()
    }
  }

  private renderShip(ctx: CanvasRenderingContext2D): void {
    const cx = this.x
    const cy = this.y
    ctx.save()

    ctx.fillStyle = '#ccddee'
    ctx.beginPath()
    ctx.moveTo(cx, cy - 16)
    ctx.lineTo(cx - 6, cy + 4)
    ctx.lineTo(cx - 6, cy + 14)
    ctx.lineTo(cx + 6, cy + 14)
    ctx.lineTo(cx + 6, cy + 4)
    ctx.closePath()
    ctx.fill()

    ctx.fillStyle = '#aabbcc'
    ctx.fillRect(cx - 14, cy + 2, 8, 6)
    ctx.fillRect(cx + 6, cy + 2, 8, 6)

    ctx.fillStyle = '#4488cc'
    ctx.beginPath()
    ctx.moveTo(cx, cy - 16)
    ctx.lineTo(cx - 4, cy - 4)
    ctx.lineTo(cx + 4, cy - 4)
    ctx.closePath()
    ctx.fill()

    ctx.fillStyle = '#88ccff'
    ctx.fillRect(cx - 2, cy - 10, 4, 6)

    const flameOffsets = [3, 4, 3, 5]
    const flameH = flameOffsets[this.animFrame]
    ctx.fillStyle = '#ff8800'
    ctx.fillRect(cx - 3, cy + 14, 6, flameH)
    ctx.fillStyle = '#ffcc00'
    ctx.fillRect(cx - 1, cy + 14, 2, flameH - 1)

    ctx.restore()
  }

  private renderExplosion(ctx: CanvasRenderingContext2D): void {
    const progress = 1 - this.explodingTimer / this.explodingDuration
    const r1 = 5 + progress * 35
    const r2 = 3 + progress * 20
    const r3 = 2 + progress * 12

    ctx.save()
    ctx.globalAlpha = Math.max(0, 1 - progress * 0.8)

    ctx.fillStyle = '#ff4400'
    ctx.beginPath()
    ctx.arc(this.x, this.y, r1, 0, Math.PI * 2)
    ctx.fill()

    ctx.fillStyle = '#ff8800'
    ctx.beginPath()
    ctx.arc(this.x, this.y, r2, 0, Math.PI * 2)
    ctx.fill()

    ctx.fillStyle = '#ffdd44'
    ctx.beginPath()
    ctx.arc(this.x, this.y, r3, 0, Math.PI * 2)
    ctx.fill()

    const particleCount = 8
    for (let i = 0; i < particleCount; i++) {
      const angle = (i / particleCount) * Math.PI * 2 + progress * 2
      const dist = progress * 40
      const px = this.x + Math.cos(angle) * dist
      const py = this.y + Math.sin(angle) * dist
      ctx.fillStyle = '#ffaa22'
      ctx.globalAlpha = Math.max(0, 1 - progress)
      ctx.fillRect(px - 2, py - 2, 4, 4)
    }

    ctx.restore()
  }

  explode(): void {
    if (this.state === 'alive') {
      this.state = 'exploding'
      this.explodingTimer = this.explodingDuration
    }
  }

  reset(canvasWidth: number, canvasHeight: number): void {
    this.x = canvasWidth / 2
    this.y = canvasHeight - 80
    this.state = 'alive'
    this.bullets = []
    this.shootCooldown = 0
    this.justShot = false
    this.animFrame = 0
    this.animTimer = 0
    this.keys.clear()
  }

  private onKeyDown = (e: KeyboardEvent): void => {
    this.keys.add(e.key)
    if (e.key === ' ' || e.key === 'ArrowLeft' || e.key === 'ArrowRight' || e.key === 'ArrowUp' || e.key === 'ArrowDown') {
      e.preventDefault()
    }
  }

  private onKeyUp = (e: KeyboardEvent): void => {
    this.keys.delete(e.key)
  }
}
