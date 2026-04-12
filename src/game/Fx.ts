interface Particle {
  x: number
  y: number
  vx: number
  vy: number
  life: number
  maxLife: number
  size: number
  color: string
  active: boolean
}

interface ScorePopup {
  x: number
  y: number
  text: string
  life: number
  maxLife: number
  active: boolean
}

const POOL_SIZE = 100
const POPUP_POOL_SIZE = 20

export class Fx {
  private particles: Particle[] = []
  private freeStack: number[] = []
  private popups: ScorePopup[] = []
  private flashColor = ''
  private flashAlpha = 0
  private flashDuration = 0
  private flashTimer = 0

  public shakeX = 0
  public shakeY = 0
  private shakeTimer = 0
  private shakeIntensity = 0

  constructor() {
    for (let i = 0; i < POOL_SIZE; i++) {
      this.particles.push({
        x: 0, y: 0, vx: 0, vy: 0,
        life: 0, maxLife: 1, size: 2,
        color: '#ffffff', active: false,
      })
      this.freeStack.push(i)
    }
    for (let i = 0; i < POPUP_POOL_SIZE; i++) {
      this.popups.push({
        x: 0, y: 0, text: '',
        life: 0, maxLife: 1, active: false,
      })
    }
  }

  explosion(x: number, y: number, color: string): void {
    const count = 8 + Math.floor(Math.random() * 5)
    for (let i = 0; i < count; i++) {
      const p = this.getNextParticle()
      if (!p) break
      const angle = (i / count) * Math.PI * 2 + Math.random() * 0.5
      const speed = 40 + Math.random() * 80
      p.x = x
      p.y = y
      p.vx = Math.cos(angle) * speed
      p.vy = Math.sin(angle) * speed
      p.life = 0.3 + Math.random() * 0.4
      p.maxLife = p.life
      p.size = 2 + Math.random() * 3
      p.color = color
      p.active = true
    }
    
    // Shake effect on small explosions
    this.addShake(5, 0.15)
  }

  bigExplosion(x: number, y: number, color: string): void {
    const count = 14 + Math.floor(Math.random() * 6)
    for (let i = 0; i < count; i++) {
      const p = this.getNextParticle()
      if (!p) break
      const angle = (i / count) * Math.PI * 2 + Math.random() * 0.5
      const speed = 50 + Math.random() * 120
      p.x = x
      p.y = y
      p.vx = Math.cos(angle) * speed
      p.vy = Math.sin(angle) * speed
      p.life = 0.4 + Math.random() * 0.5
      p.maxLife = p.life
      p.size = 3 + Math.random() * 4
      p.color = color
      p.active = true
    }
    this.addShake(8, 0.3)
  }

  addShake(intensity: number, duration: number): void {
    this.shakeIntensity = Math.max(this.shakeIntensity, intensity)
    this.shakeTimer = Math.max(this.shakeTimer, duration)
  }

  smokeTrail(x: number, y: number, color = '#888888'): void {
    const p = this.getNextParticle()
    if (!p) return
    p.x = x + (Math.random() - 0.5) * 4
    p.y = y + (Math.random() - 0.5) * 2
    p.vx = (Math.random() - 0.5) * 10
    p.vy = 80 + Math.random() * 40
    p.life = 0.3 + Math.random() * 0.2
    p.maxLife = p.life
    p.size = 2 + Math.random() * 2
    p.color = color
    p.active = true
  }

  deathSmoke(x: number, y: number): void {
    const count = 4 + Math.floor(Math.random() * 3)
    for (let i = 0; i < count; i++) {
      const p = this.getNextParticle()
      if (!p) break
      p.x = x + (Math.random() - 0.5) * 16
      p.y = y + (Math.random() - 0.5) * 8
      p.vx = (Math.random() - 0.5) * 20
      p.vy = 40 + Math.random() * 60
      p.life = 0.5 + Math.random() * 0.4
      p.maxLife = p.life
      p.size = 3 + Math.random() * 3
      p.color = i % 2 === 0 ? '#333333' : '#555555'
      p.active = true
    }
  }

  scorePopup(x: number, y: number, text: string): void {
    const popup = this.popups.find((p) => !p.active)
    if (!popup) return
    popup.x = x
    popup.y = y
    popup.text = text
    popup.life = 0.8
    popup.maxLife = 0.8
    popup.active = true
  }

  flash(color: string, duration: number): void {
    this.flashColor = color
    this.flashDuration = duration
    this.flashTimer = duration
    this.flashAlpha = 1
  }

  update(dt: number): void {
    for (let i = 0; i < this.particles.length; i++) {
      const p = this.particles[i]
      if (!p.active) continue
      p.x += p.vx * dt
      p.y += p.vy * dt
      p.vx *= 0.96
      p.vy *= 0.96
      p.life -= dt
      if (p.life <= 0) {
        p.active = false
        this.freeStack.push(i)
      }
    }

    for (const popup of this.popups) {
      if (!popup.active) continue
      popup.y -= 30 * dt
      popup.life -= dt
      if (popup.life <= 0) popup.active = false
    }

    if (this.flashTimer > 0) {
      this.flashTimer -= dt
      this.flashAlpha = Math.max(0, this.flashTimer / this.flashDuration)
      if (this.flashTimer <= 0) {
        this.flashColor = ''
        this.flashAlpha = 0
      }
    }

    if (this.shakeTimer > 0) {
      this.shakeTimer -= dt
      if (this.shakeTimer <= 0) {
        this.shakeTimer = 0
        this.shakeIntensity = 0
        this.shakeX = 0
        this.shakeY = 0
      } else {
        this.shakeX = (Math.random() - 0.5) * 2 * this.shakeIntensity
        this.shakeY = (Math.random() - 0.5) * 2 * this.shakeIntensity
      }
    }
  }

  render(ctx: CanvasRenderingContext2D): void {
    for (const p of this.particles) {
      if (!p.active) continue
      const alpha = Math.max(0, p.life / p.maxLife)
      ctx.save()
      ctx.globalAlpha = alpha
      ctx.fillStyle = p.color
      ctx.fillRect(p.x - p.size / 2, p.y - p.size / 2, p.size, p.size)
      ctx.restore()
    }

    for (const popup of this.popups) {
      if (!popup.active) continue
      const alpha = Math.max(0, popup.life / popup.maxLife)
      ctx.save()
      ctx.globalAlpha = alpha
      ctx.fillStyle = '#ffffff'
      ctx.font = 'bold 14px "Courier New", monospace'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText(popup.text, popup.x, popup.y)
      ctx.restore()
    }

    if (this.flashAlpha > 0 && this.flashColor) {
      ctx.save()
      ctx.globalAlpha = this.flashAlpha * 0.3
      ctx.fillStyle = this.flashColor
      ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height)
      ctx.restore()
    }
  }

  private getNextParticle(): Particle | null {
    if (this.freeStack.length === 0) return null
    return this.particles[this.freeStack.pop()!]
  }

  reset(): void {
    this.freeStack.length = 0
    for (let i = 0; i < this.particles.length; i++) {
      this.particles[i].active = false
      this.freeStack.push(i)
    }
    for (const p of this.popups) p.active = false
    this.flashTimer = 0
    this.flashAlpha = 0
    this.shakeX = 0
    this.shakeY = 0
    this.shakeTimer = 0
    this.shakeIntensity = 0
  }
}
