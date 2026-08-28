import { ObjectPool } from './ObjectPool'
import { BulletRenderer } from './BulletRenderer'
import { resolveBulletKind, type BulletKind } from './BulletStyles'
import {
  PLAYER_WIDTH, PLAYER_HEIGHT, PLAYER_SPEED,
  PLAYER_VERTICAL_SPEED, PLAYER_MIN_Y_RATIO, PLAYER_MAX_Y_MARGIN,
  PLAYER_SHOOT_INTERVAL, PLAYER_MAX_BULLETS,
  PLAYER_BULLET_SPEED, PLAYER_BULLET_W, PLAYER_BULLET_H,
  PLAYER_EXPLODING_DURATION, PLAYER_RESPAWN_Y_OFFSET,
  PLAYER_INVINCIBILITY_TIME, PLAYER_SHIELD_BREAK_INVINCIBILITY,
  PLAYER_DOUBLE_SHOT_SPREAD, PLAYER_DOUBLE_SHOT_SPEED_MULTIPLIER,
  POWERUP_RAPID_FIRE_COOLDOWN_MULTIPLIER,
  OVERDRIVE_LASER_WIDTH,
} from './constants'

export type GameState = 'alive' | 'exploding' | 'dead'

export interface Bullet {
  x: number
  y: number
  speed: number
  width: number
  height: number
  active: boolean
  /** Visual state, frozen at spawn from the fire power-ups then active. */
  kind: BulletKind
}

export class Player {
  x: number
  y: number
  width = PLAYER_WIDTH
  height = PLAYER_HEIGHT
  speed = PLAYER_SPEED
  verticalSpeed = PLAYER_VERTICAL_SPEED
  private canvasHeight: number
  state: GameState = 'alive'
  private bulletPool = new ObjectPool<Bullet>(
    PLAYER_MAX_BULLETS,
    () => ({ x: 0, y: 0, speed: PLAYER_BULLET_SPEED, width: PLAYER_BULLET_W, height: PLAYER_BULLET_H, active: false, kind: 'normal' as BulletKind }),
    (b) => { b.active = true },
  )
  private bulletRenderer = new BulletRenderer()
  get bullets(): Bullet[] { return this.bulletPool.activeItems }
  /** Visual state the next shot will be fired with. */
  get currentBulletKind(): BulletKind {
    return resolveBulletKind(this.doubleShotTimer, this.rapidFireTimer)
  }
  shootCooldown = 0
  shootInterval = PLAYER_SHOOT_INTERVAL
  justShot = false
  doubleShotTimer = 0
  rapidFireTimer = 0
  magnetFuelTimer = 0
  shieldActive = false
  invincibilityTimer = 0
  overdriveActive = false
  private readonly MAX_BULLETS = PLAYER_MAX_BULLETS
  private animFrame = 0
  private animTimer = 0

  readonly keys: Set<string> = new Set()
  private explodingTimer = 0
  private readonly explodingDuration = PLAYER_EXPLODING_DURATION

  setTouchTarget(x: number | null, y: number | null = null): void {
    this.touchTargetX = x
    this.touchTargetY = y
  }
  private touchTargetX: number | null = null
  private touchTargetY: number | null = null

  constructor(canvasWidth: number, canvasHeight: number) {
    this.x = canvasWidth / 2
    this.y = canvasHeight - PLAYER_RESPAWN_Y_OFFSET
    this.canvasHeight = canvasHeight
  }

  /** Clamp a Y to the allowed vertical travel range. */
  private clampY(y: number): number {
    const top = this.canvasHeight * PLAYER_MIN_Y_RATIO
    const bottom = this.canvasHeight - PLAYER_MAX_Y_MARGIN
    return Math.max(top, Math.min(bottom, y))
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

  resize(_canvasWidth: number, canvasHeight: number, leftBound: number, rightBound: number): void {
    this.canvasHeight = canvasHeight
    this.y = this.clampY(this.y)
    this.x = Math.max(leftBound + this.width / 2 + 2, Math.min(rightBound - this.width / 2 - 2, this.x))
  }

  update(dt: number, leftBound: number, rightBound: number, onMiss?: () => void): void {
    if (this.state === 'alive') {
      for (const b of this.bulletPool.activeItems) {
        b.y -= b.speed * dt
        if (b.y < -50) {
          b.active = false
          if (onMiss) onMiss()
        }
      }

      if (this.touchTargetX !== null) {
        const dx = this.touchTargetX - this.x
        const maxMove = this.speed * dt
        if (Math.abs(dx) <= maxMove) {
          this.x = this.touchTargetX
        } else {
          this.x += Math.sign(dx) * maxMove
        }
      } else {
        if (this.keys.has('ArrowLeft') || this.keys.has('a')) {
          this.x -= this.speed * dt
        }
        if (this.keys.has('ArrowRight') || this.keys.has('d')) {
          this.x += this.speed * dt
        }
      }
      this.x = Math.max(leftBound + this.width / 2 + 2, Math.min(rightBound - this.width / 2 - 2, this.x))

      // Vertical movement — forward (up) / back (down), clamped to the travel range.
      if (this.touchTargetY !== null) {
        const dy = this.touchTargetY - this.y
        const maxMove = this.verticalSpeed * dt
        this.y = Math.abs(dy) <= maxMove ? this.touchTargetY : this.y + Math.sign(dy) * maxMove
      } else {
        if (this.keys.has('ArrowUp') || this.keys.has('w')) {
          this.y -= this.verticalSpeed * dt
        }
        if (this.keys.has('ArrowDown') || this.keys.has('s')) {
          this.y += this.verticalSpeed * dt
        }
      }
      this.y = this.clampY(this.y)

      if (this.doubleShotTimer > 0) this.doubleShotTimer -= dt
      if (this.rapidFireTimer > 0) this.rapidFireTimer -= dt
      if (this.magnetFuelTimer > 0) this.magnetFuelTimer -= dt
      if (this.invincibilityTimer > 0) this.invincibilityTimer -= dt

      this.shootCooldown -= dt

      const wantShoot = this.keys.has(' ') || this.touchTargetX !== null
      if (wantShoot && this.shootCooldown <= 0 && this.bullets.length < this.MAX_BULLETS) {
        const effectiveCooldown = this.shootInterval * (this.rapidFireTimer > 0 ? POWERUP_RAPID_FIRE_COOLDOWN_MULTIPLIER : 1.0)
        // Only the visual kind varies — width/height stay at the pool defaults
        // so hitboxes (and therefore balance) are identical across states.
        const kind = this.currentBulletKind
        if (this.doubleShotTimer > 0) {
          const doubleShotSpeed = PLAYER_BULLET_SPEED * PLAYER_DOUBLE_SHOT_SPEED_MULTIPLIER

          const b1 = this.bulletPool.acquire()
          b1.x = this.x - PLAYER_DOUBLE_SHOT_SPREAD
          b1.y = this.y - this.height / 2
          b1.speed = doubleShotSpeed
          b1.kind = kind

          const b2 = this.bulletPool.acquire()
          b2.x = this.x + PLAYER_DOUBLE_SHOT_SPREAD
          b2.y = this.y - this.height / 2
          b2.speed = doubleShotSpeed
          b2.kind = kind
        } else {
          const b = this.bulletPool.acquire()
          b.x = this.x
          b.y = this.y - this.height / 2
          b.speed = PLAYER_BULLET_SPEED
          b.kind = kind
        }
        this.shootCooldown = effectiveCooldown
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
  }

  setReducedMotion(enabled: boolean): void {
    this.bulletRenderer.setReducedMotion(enabled)
  }

  setColorblind(enabled: boolean): void {
    this.bulletRenderer.setColorblind(enabled)
  }

  render(ctx: CanvasRenderingContext2D): void {
    if (this.state === 'alive') {
      if (this.overdriveActive) {
        this.renderOverdriveBeam(ctx)
      }
      ctx.save()
      if (this.invincibilityTimer > 0) {
        ctx.globalAlpha = Math.floor(this.invincibilityTimer * 10) % 2 === 0 ? 0.4 : 1.0
      }
      this.renderShip(ctx)
      if (this.shieldActive) {
        this.renderShield(ctx)
      }
      ctx.restore()
    }

    if (this.state === 'exploding') {
      this.renderExplosion(ctx)
    }

    this.bulletRenderer.render(ctx, this.bullets)
  }

  private renderOverdriveBeam(ctx: CanvasRenderingContext2D): void {
    const cx = this.x
    const topY = 0
    const startY = this.y - this.height / 2
    const beamHeight = startY - topY
    if (beamHeight <= 0) return

    // Widths derive from the hitbox so the beam never lies about its reach.
    const outerW = OVERDRIVE_LASER_WIDTH
    const midW = outerW / 2
    const coreW = outerW / 6

    ctx.save()
    // Outer glow
    ctx.fillStyle = 'rgba(0, 240, 255, 0.35)'
    ctx.fillRect(cx - outerW / 2, topY, outerW, beamHeight)

    // Mid plasma layer
    ctx.fillStyle = 'rgba(120, 255, 255, 0.7)'
    ctx.fillRect(cx - midW / 2, topY, midW, beamHeight)

    // Core white beam
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(cx - coreW / 2, topY, coreW, beamHeight)

    // Energy muzzle ring at nose
    ctx.fillStyle = '#00ffff'
    ctx.beginPath()
    ctx.arc(cx, startY, 8, 0, Math.PI * 2)
    ctx.fill()

    ctx.restore()
  }

  private renderShip(ctx: CanvasRenderingContext2D): void {
    const cx = this.x
    const cy = this.y
    ctx.save()

    // ── Swept wings (mirror left/right) ──────────────────────────────────────
    for (const s of [-1, 1]) {
      ctx.fillStyle = '#9fb3c8'
      ctx.beginPath()
      ctx.moveTo(cx + s * 2, cy - 2)
      ctx.lineTo(cx + s * 14, cy + 8)
      ctx.lineTo(cx + s * 14, cy + 11)
      ctx.lineTo(cx + s * 4, cy + 8)
      ctx.closePath()
      ctx.fill()
      // Leading-edge highlight
      ctx.fillStyle = '#c3d2e2'
      ctx.beginPath()
      ctx.moveTo(cx + s * 2, cy - 2)
      ctx.lineTo(cx + s * 14, cy + 8)
      ctx.lineTo(cx + s * 11, cy + 8)
      ctx.lineTo(cx + s * 2, cy)
      ctx.closePath()
      ctx.fill()
      // Wingtip pod
      ctx.fillStyle = '#7f93a8'
      ctx.fillRect(cx + s * 14 - 1, cy + 6, 2, 5)
    }

    // ── Rear tail fins ───────────────────────────────────────────────────────
    ctx.fillStyle = '#8aa0b6'
    for (const s of [-1, 1]) {
      ctx.beginPath()
      ctx.moveTo(cx + s * 1, cy + 9)
      ctx.lineTo(cx + s * 7, cy + 14)
      ctx.lineTo(cx + s * 3, cy + 14)
      ctx.lineTo(cx + s * 1, cy + 11)
      ctx.closePath()
      ctx.fill()
    }

    // ── Fuselage dart (nose up) ──────────────────────────────────────────────
    ctx.fillStyle = '#d6e2f0'
    ctx.beginPath()
    ctx.moveTo(cx, cy - 17)
    ctx.lineTo(cx - 4, cy - 4)
    ctx.lineTo(cx - 4, cy + 10)
    ctx.lineTo(cx - 3, cy + 14)
    ctx.lineTo(cx + 3, cy + 14)
    ctx.lineTo(cx + 4, cy + 10)
    ctx.lineTo(cx + 4, cy - 4)
    ctx.closePath()
    ctx.fill()
    // Port-side shade
    ctx.fillStyle = '#aabccd'
    ctx.beginPath()
    ctx.moveTo(cx, cy - 17)
    ctx.lineTo(cx - 4, cy - 4)
    ctx.lineTo(cx - 4, cy + 10)
    ctx.lineTo(cx - 1, cy + 12)
    ctx.lineTo(cx - 1, cy - 8)
    ctx.closePath()
    ctx.fill()
    // Spine highlight + blue accent
    ctx.fillStyle = '#f2f8ff'
    ctx.fillRect(cx - 1, cy - 12, 2, 18)
    ctx.fillStyle = '#2f7fd6'
    ctx.fillRect(cx - 4, cy + 4, 8, 2)

    // ── Cockpit canopy ───────────────────────────────────────────────────────
    ctx.fillStyle = '#bfe9ff'
    ctx.beginPath()
    ctx.moveTo(cx, cy - 9)
    ctx.lineTo(cx - 2, cy - 3)
    ctx.lineTo(cx + 2, cy - 3)
    ctx.closePath()
    ctx.fill()
    ctx.fillStyle = '#7fc8f0'
    ctx.fillRect(cx - 2, cy - 4, 4, 1)
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(cx - 1, cy - 8, 1, 2)

    // ── Blinking nav lights — port red, starboard green ──────────────────────
    if (Math.floor(performance.now() / 250) % 2 === 0) {
      ctx.fillStyle = '#ff5555'
      ctx.fillRect(cx - 14, cy + 6, 2, 2)
      ctx.fillStyle = '#55ff77'
      ctx.fillRect(cx + 12, cy + 6, 2, 2)
    }

    // ── Afterburner exhaust (layered, animated) ──────────────────────────────
    const flameOffsets = [4, 6, 4, 7]
    const flameH = flameOffsets[this.animFrame]
    ctx.save()
    ctx.globalAlpha = 0.45
    ctx.fillStyle = '#ff8800'
    ctx.fillRect(cx - 4, cy + 14, 8, flameH)
    ctx.restore()
    ctx.fillStyle = '#ff8800'
    ctx.fillRect(cx - 3, cy + 14, 6, flameH)
    ctx.fillStyle = '#ffcc00'
    ctx.fillRect(cx - 2, cy + 14, 4, flameH - 1)
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(cx - 1, cy + 14, 2, Math.max(1, flameH - 3))

    ctx.restore()
  }

  private renderShield(ctx: CanvasRenderingContext2D): void {
    const cx = this.x
    const cy = this.y
    const time = performance.now() / 200
    
    ctx.save()
    ctx.translate(cx, cy)
    
    // Efeito de pulsação (respiração) no próprio tamanho e brilho
    const pulse = Math.sin(time * 0.5) * 1.5
    
    // Anel Giratório Interno (Gira no sentido Horário)
    ctx.rotate(time * 0.3)
    ctx.strokeStyle = '#4488ff'
    ctx.lineWidth = 2
    ctx.setLineDash([15, 10]) // Define que o aro é quebrado/tracejado
    ctx.beginPath()
    ctx.arc(0, 0, 22 + pulse, 0, Math.PI * 2)
    ctx.stroke()
    
    // Anel Giratório Externo (Gira no sentido Anti-Horário)
    ctx.rotate(-time * 0.8) // Zera e inverte a rotação
    ctx.strokeStyle = 'rgba(204, 255, 255, 0.7)'
    ctx.lineWidth = 1
    ctx.setLineDash([8, 12])
    ctx.beginPath()
    ctx.arc(0, 0, 25 + pulse, 0, Math.PI * 2)
    ctx.stroke()
    
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

  /** Respawn mid-game after losing a life. Recenters the player and grants invincibility. */
  respawn(canvasWidth: number, canvasHeight: number): void {
    this.canvasHeight = canvasHeight
    this.x = canvasWidth / 2
    this.y = canvasHeight - PLAYER_RESPAWN_Y_OFFSET
    this.touchTargetY = null
    this.state = 'alive'
    this.bulletPool.resetAll()
    this.shootCooldown = 0
    this.justShot = false
    this.shieldActive = false
    this.doubleShotTimer = 0
    this.rapidFireTimer = 0
    this.magnetFuelTimer = 0
    this.invincibilityTimer = PLAYER_INVINCIBILITY_TIME
    this.animFrame = 0
    this.animTimer = 0
  }

  breakShield(): void {
    this.shieldActive = false
    this.invincibilityTimer = PLAYER_SHIELD_BREAK_INVINCIBILITY
  }

  reset(canvasWidth: number, canvasHeight: number): void {
    this.canvasHeight = canvasHeight
    this.x = canvasWidth / 2
    this.y = canvasHeight - PLAYER_RESPAWN_Y_OFFSET
    this.state = 'alive'
    this.bulletPool.resetAll()
    this.shootCooldown = 0
    this.justShot = false
    this.doubleShotTimer = 0
    this.rapidFireTimer = 0
    this.magnetFuelTimer = 0
    this.shieldActive = false
    this.invincibilityTimer = 0
    this.overdriveActive = false
    this.animFrame = 0
    this.animTimer = 0
    this.keys.clear()
    this.touchTargetX = null
    this.touchTargetY = null
  }

  private onKeyDown = (e: KeyboardEvent): void => {
    this.keys.add(e.key)
    if (e.key === ' ' || e.key === 'ArrowLeft' || e.key === 'ArrowRight' || e.key === 'ArrowUp' || e.key === 'ArrowDown' || e.key === 'a' || e.key === 'd') {
      e.preventDefault()
    }
  }

  private onKeyUp = (e: KeyboardEvent): void => {
    this.keys.delete(e.key)
  }
}
