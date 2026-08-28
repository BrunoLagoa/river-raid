// ─── LightingSystem.ts ───────────────────────────────────────────────────────
// Manages dynamic 2D lighting and darkness masks during night, dawn, and sunset:
//   1. Darkness overlay mask scaled to the current time of day / atmosphere.
//   2. Forward-facing conical headlight beam projected from the player's aircraft.
//   3. Dynamic point lights cast by active bullets, muzzle flashes, and explosions.
//
// Uses canvas composition ('destination-out') to carve light regions out of the
// darkness mask in a single high-performance pass without per-frame allocations.

import {
  LIGHTING_HEADLIGHT_ANGLE,
  LIGHTING_HEADLIGHT_RANGE,
  LIGHTING_NIGHT_ALPHA,
  LIGHTING_DAWN_ALPHA,
  LIGHTING_SUNSET_ALPHA,
  LIGHTING_BULLET_RADIUS,
  LIGHTING_EXPLOSION_RADIUS,
  LIGHTING_HEADLIGHT_WARMUP,
  LIGHTING_HEADLIGHT_FADE_OUT,
  LIGHTING_HEADLIGHT_FLICKER_SPEED,
  LIGHTING_HEADLIGHT_FLICKER_DEPTH,
  LIGHTING_HEADLIGHT_MIN_REACH,
} from './constants'

export interface PointLight {
  x: number
  y: number
  radius: number
  intensity: number // 0.0 to 1.0
}

export class LightingSystem {
  private canvasWidth: number
  private canvasHeight: number
  private maskCanvas: HTMLCanvasElement | null = null
  private maskCtx: CanvasRenderingContext2D | null = null
  /** Intensidade efetiva do farol (0–1): é ela que o render usa, não o liga/desliga. */
  private headlightIntensity = 0
  private headlightOn = false
  private headlightTimer = 0
  /** Intensidade no instante da última troca, para a transição nunca dar salto. */
  private headlightFrom = 0

  constructor(canvasWidth: number, canvasHeight: number) {
    this.canvasWidth = canvasWidth
    this.canvasHeight = canvasHeight
    this.initMaskCanvas()
  }

  private initMaskCanvas(): void {
    if (typeof document === 'undefined') return
    try {
      this.maskCanvas = document.createElement('canvas')
      this.maskCanvas.width = this.canvasWidth
      this.maskCanvas.height = this.canvasHeight
      this.maskCtx = this.maskCanvas.getContext('2d')
    } catch {
      this.maskCanvas = null
      this.maskCtx = null
    }
  }

  setCanvasSize(w: number, h: number): void {
    this.canvasWidth = w
    this.canvasHeight = h
    if (this.maskCanvas) {
      this.maskCanvas.width = w
      this.maskCanvas.height = h
    }
  }

  /**
   * Calculates the target darkness alpha based on atmosphere phase and brightness.
   */
  /** Intensidade atual do farol, 0–1. Exposta para testes e HUD/debug. */
  getHeadlightIntensity(): number {
    return this.headlightIntensity
  }

  /**
   * Anima o farol. Acender é um warm-up com piscadas que vão sumindo conforme a
   * lâmpada "esquenta"; apagar é um fade curto. Com `reducedMotion` a transição
   * é suave e sem flicker.
   */
  update(dt: number, on: boolean, reducedMotion = false): void {
    this.updateHeadlight(dt, on, reducedMotion)
  }

  updateHeadlight(dt: number, on: boolean, reducedMotion = false): void {
    if (!Number.isFinite(dt) || dt < 0) return

    if (on !== this.headlightOn) {
      this.headlightOn = on
      this.headlightTimer = 0
      this.headlightFrom = this.headlightIntensity
    }
    this.headlightTimer += dt

    if (on) {
      const duration = LIGHTING_HEADLIGHT_WARMUP
      const t = duration > 0 ? Math.min(1, this.headlightTimer / duration) : 1
      // smoothstep do valor de partida até o brilho cheio
      const eased = t * t * (3 - 2 * t)
      const ramp = this.headlightFrom + (1 - this.headlightFrom) * eased
      const flicker = reducedMotion
        ? 0
        : (1 - t) * LIGHTING_HEADLIGHT_FLICKER_DEPTH * Math.sin(this.headlightTimer * LIGHTING_HEADLIGHT_FLICKER_SPEED)
      this.headlightIntensity = Math.max(0, Math.min(1, ramp + flicker))
      return
    }

    const fade = LIGHTING_HEADLIGHT_FADE_OUT
    const t = fade > 0 ? Math.min(1, this.headlightTimer / fade) : 1
    // Cai rápido no começo e "morre" devagar, como filamento esfriando.
    this.headlightIntensity = this.headlightFrom * (1 - t) * (1 - t)
  }

  /** Corta a animação (nova run / respawn) sem transição. */
  reset(): void {
    this.resetHeadlight()
  }

  resetHeadlight(): void {
    this.headlightIntensity = 0
    this.headlightOn = false
    this.headlightTimer = 0
    this.headlightFrom = 0
  }

  getDarknessAlpha(phaseIndex: number, phaseProgress: number, isNight = false): number {
    // phaseIndex: 0 = Day, 1 = Sunset, 2 = Night, 3 = Dawn
    if (isNight || phaseIndex === 2) {
      return LIGHTING_NIGHT_ALPHA
    }
    if (phaseIndex === 3) {
      // Dawn (fading out)
      return LIGHTING_DAWN_ALPHA * (1 - phaseProgress * 0.7)
    }
    if (phaseIndex === 1) {
      // Sunset (fading in)
      return LIGHTING_SUNSET_ALPHA * (0.3 + phaseProgress * 0.7)
    }
    return 0
  }

  render(
    targetCtx: CanvasRenderingContext2D,
    player: { x: number; y: number; state: string } | null,
    bullets: ReadonlyArray<{ x: number; y: number; active: boolean }>,
    explosions: ReadonlyArray<{ x: number; y: number; radius?: number; timer?: number; duration?: number; active?: boolean }>,
    darknessAlpha: number,
    enabled = true
  ): void {
    if (!enabled || darknessAlpha <= 0.02) return

    const w = this.canvasWidth
    const h = this.canvasHeight

    // Use offscreen mask canvas if available, or direct fallback on targetCtx
    const ctx = this.maskCtx || targetCtx
    if (this.maskCtx) {
      this.maskCtx.clearRect(0, 0, w, h)
    } else {
      ctx.save()
    }

    // 1. Fill base darkness
    ctx.fillStyle = `rgba(6, 12, 28, ${darknessAlpha})`
    ctx.fillRect(0, 0, w, h)

    // 2. Carve light sources using destination-out
    ctx.save()
    ctx.globalCompositeOperation = 'destination-out'

    // A. Farol cônico — a intensidade vem de updateHeadlight(), então acender e
    // apagar são animados em vez de aparecer/sumir de um frame para o outro.
    if (this.headlightIntensity > 0.01 && player && player.state === 'alive') {
      const prevAlpha = ctx.globalAlpha
      ctx.globalAlpha = prevAlpha * this.headlightIntensity
      this.renderHeadlight(ctx, player.x, player.y, this.headlightIntensity)
      ctx.globalAlpha = prevAlpha
    }

    // B. Bullets Point Lights
    for (let i = 0; i < bullets.length; i++) {
      const b = bullets[i]
      if (!b.active) continue
      this.renderPointLight(ctx, b.x, b.y, LIGHTING_BULLET_RADIUS, 0.85)
    }

    // C. Explosions Point Lights
    for (let i = 0; i < explosions.length; i++) {
      const exp = explosions[i]
      if (exp.active === false) continue
      const r = exp.radius || LIGHTING_EXPLOSION_RADIUS
      this.renderPointLight(ctx, exp.x, exp.y, r, 0.95)
    }

    ctx.restore()

    // 3. If using offscreen mask, blit onto target canvas
    if (this.maskCtx && this.maskCanvas) {
      targetCtx.drawImage(this.maskCanvas, 0, 0)
    } else {
      ctx.restore()
    }
  }

  private renderHeadlight(
    ctx: CanvasRenderingContext2D,
    px: number,
    py: number,
    intensity = 1,
  ): void {
    // O cone também cresce ao acender: só o alpha faria a luz "aparecer pronta".
    const reach = LIGHTING_HEADLIGHT_MIN_REACH + (1 - LIGHTING_HEADLIGHT_MIN_REACH) * intensity
    const range = LIGHTING_HEADLIGHT_RANGE * reach
    const halfAngle = LIGHTING_HEADLIGHT_ANGLE / 2

    if (typeof ctx.createRadialGradient !== 'function') {
      ctx.fillStyle = 'rgba(255, 255, 255, 0.8)'
      ctx.beginPath()
      ctx.arc(px, py, 45, 0, Math.PI * 2)
      ctx.fill()
      return
    }

    // Main conical beam
    const grad = ctx.createRadialGradient(px, py, 10, px, py - range * 0.6, range)
    grad.addColorStop(0, 'rgba(255, 255, 255, 1.0)')
    grad.addColorStop(0.5, 'rgba(255, 255, 255, 0.7)')
    grad.addColorStop(1, 'rgba(255, 255, 255, 0)')

    ctx.fillStyle = grad
    ctx.beginPath()
    ctx.moveTo(px, py)
    const leftX = px - Math.tan(halfAngle) * range
    const rightX = px + Math.tan(halfAngle) * range
    ctx.lineTo(leftX, py - range)
    ctx.lineTo(rightX, py - range)
    ctx.closePath()
    ctx.fill()

    // Subtle glow immediately surrounding the plane
    const aura = ctx.createRadialGradient(px, py, 5, px, py, 45)
    aura.addColorStop(0, 'rgba(255, 255, 255, 0.9)')
    aura.addColorStop(1, 'rgba(255, 255, 255, 0)')
    ctx.fillStyle = aura
    ctx.beginPath()
    ctx.arc(px, py, 45, 0, Math.PI * 2)
    ctx.fill()
  }

  private renderPointLight(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    radius: number,
    maxAlpha = 0.9
  ): void {
    if (typeof ctx.createRadialGradient !== 'function') {
      ctx.fillStyle = 'rgba(255, 255, 255, 0.8)'
      ctx.beginPath()
      ctx.arc(x, y, radius, 0, Math.PI * 2)
      ctx.fill()
      return
    }

    const grad = ctx.createRadialGradient(x, y, 0, x, y, radius)
    grad.addColorStop(0, `rgba(255, 255, 255, ${maxAlpha})`)
    grad.addColorStop(0.4, `rgba(255, 255, 255, ${maxAlpha * 0.6})`)
    grad.addColorStop(1, 'rgba(255, 255, 255, 0)')

    ctx.fillStyle = grad
    ctx.beginPath()
    ctx.arc(x, y, radius, 0, Math.PI * 2)
    ctx.fill()
  }
}
