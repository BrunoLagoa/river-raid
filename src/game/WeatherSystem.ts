// ─── WeatherSystem.ts ────────────────────────────────────────────────────────
// Manages procedural weather particle effects driven by the current biome:
//   • Forest     → Rain with occasional lightning flash
//   • Desert     → Sandstorm with golden dust particles and horizontal drift
//   • Industrial → Smog with floating soot and incandescent ember sparks
//   • Snow       → Snowfall with sinusoidal wind drift
//
// Zero-allocation particle loop: pre-allocated pools recycled on screen-wrap.
// Supports reducedMotion by disabling lightning flashes and reducing particle density.

import type { WeatherType } from './BiomeSystem'
import {
  WEATHER_MAX_RAIN_DROPS,
  WEATHER_MAX_SNOW_FLAKES,
  WEATHER_MAX_SAND_GRAINS,
  WEATHER_MAX_SMOG_PUFFS,
  WEATHER_LIGHTNING_FLASH_DURATION,
  WEATHER_LIGHTNING_INTERVAL_MIN,
  WEATHER_LIGHTNING_INTERVAL_MAX,
  WEATHER_OCCURRENCE_CHANCE,
  WEATHER_RAIN_ALPHA_BASE,
  WEATHER_RAIN_ALPHA_VARIATION,
} from './constants'
import type { RandomSource } from './random'

export interface WeatherParticle {
  x: number
  y: number
  vx: number
  vy: number
  size: number
  length: number
  alpha: number
  color: string
  kind: WeatherType
  phase: number
  active: boolean
}

/**
 * Prova, em tempo de compilação, que a tabela de ocorrência cobre todo
 * `WeatherType`: um clima novo no BiomeSystem quebra o build aqui em vez de cair
 * silenciosamente no fallback.
 */
const OCCURRENCE_CHANCE: Record<WeatherType, number> = WEATHER_OCCURRENCE_CHANCE

export class WeatherSystem {
  private particles: WeatherParticle[] = []
  private canvasWidth: number
  private canvasHeight: number
  private random: RandomSource
  private lightningTimer = 0
  private lightningFlashTimer = 0
  private currentWeather: WeatherType = 'rain'
  /** Último clima pedido pelo bioma — a troca é o gatilho do sorteio. */
  private requestedWeather: WeatherType | null = null
  /** Resultado do sorteio: se falso, o trecho passa limpo. */
  private weatherOccurs = true

  constructor(
    canvasWidth: number,
    canvasHeight: number,
    random: RandomSource = Math.random
  ) {
    this.canvasWidth = canvasWidth
    this.canvasHeight = canvasHeight
    this.random = random
    this.lightningTimer = this.nextLightningDelay()
    this.initPool()
  }

  private nextLightningDelay(): number {
    return (
      WEATHER_LIGHTNING_INTERVAL_MIN +
      this.random() * (WEATHER_LIGHTNING_INTERVAL_MAX - WEATHER_LIGHTNING_INTERVAL_MIN)
    )
  }

  private initPool(): void {
    const totalMax = Math.max(
      WEATHER_MAX_RAIN_DROPS,
      WEATHER_MAX_SNOW_FLAKES,
      WEATHER_MAX_SAND_GRAINS,
      WEATHER_MAX_SMOG_PUFFS
    )

    this.particles = []
    for (let i = 0; i < totalMax; i++) {
      this.particles.push({
        x: this.random() * this.canvasWidth,
        y: this.random() * this.canvasHeight,
        vx: 0,
        vy: 0,
        size: 1,
        length: 8,
        alpha: 0.7,
        color: '#ffffff',
        kind: 'rain',
        phase: this.random() * Math.PI * 2,
        active: false,
      })
    }
  }

  setCanvasSize(w: number, h: number): void {
    this.canvasWidth = w
    this.canvasHeight = h
  }

  getCurrentWeather(): WeatherType {
    return this.currentWeather
  }

  isLightningActive(): boolean {
    return this.lightningFlashTimer > 0
  }

  /**
   * Resets particle state for a specific weather type.
   */
  private spawnParticle(p: WeatherParticle, kind: WeatherType, fromTop = false): void {
    p.kind = kind
    p.active = true
    p.x = this.random() * this.canvasWidth
    p.y = fromTop ? -10 - this.random() * 20 : this.random() * this.canvasHeight
    p.phase = this.random() * Math.PI * 2

    switch (kind) {
      case 'rain':
        p.vx = -40 - this.random() * 30
        p.vy = 420 + this.random() * 180
        p.length = 12 + this.random() * 10
        p.size = 1.5
        p.alpha = WEATHER_RAIN_ALPHA_BASE + this.random() * WEATHER_RAIN_ALPHA_VARIATION
        p.color = '#aadcff'
        break

      case 'snow':
        p.vx = -15 + this.random() * 30
        p.vy = 55 + this.random() * 45
        p.length = 2 + this.random() * 2
        p.size = 2 + this.random() * 2.5
        p.alpha = 0.6 + this.random() * 0.35
        p.color = '#eaf4ff'
        break

      case 'sandstorm':
        p.vx = -160 - this.random() * 120
        p.vy = 40 + this.random() * 60
        p.length = 6 + this.random() * 8
        p.size = 1.8 + this.random() * 1.5
        p.alpha = 0.4 + this.random() * 0.45
        p.color = this.random() > 0.3 ? '#e0b870' : '#d29e50'
        break

      case 'smog':
        p.vx = -25 + this.random() * 50
        p.vy = -30 - this.random() * 40
        p.length = 3 + this.random() * 4
        p.size = 2 + this.random() * 3.5
        if (this.random() < 0.25) {
          // Glowing hot ember
          p.color = '#ff6622'
          p.alpha = 0.75 + this.random() * 0.25
        } else {
          // Dark soot puff
          p.color = '#44444c'
          p.alpha = 0.35 + this.random() * 0.35
        }
        break

      default:
        p.active = false
        break
    }
  }

  update(
    dt: number,
    scrollSpeed: number,
    requested: WeatherType,
    reducedMotion = false
  ): void {
    if (!Number.isFinite(dt) || dt <= 0) return

    // Cada troca de clima é sorteada uma vez e vale para o trecho inteiro — sem
    // isso a chuva reapareceria a cada frame (ou piscaria, se sorteada sempre).
    if (requested !== this.requestedWeather) {
      this.requestedWeather = requested
      const chance = OCCURRENCE_CHANCE[requested]
      this.weatherOccurs = chance >= 1 || this.random() < chance
    }
    const weatherType: WeatherType = this.weatherOccurs ? requested : 'clear'
    this.currentWeather = weatherType

    const targetMax = this.getTargetCount(weatherType, reducedMotion)

    // Lightning timers only run during rain and when reducedMotion is off
    if (weatherType === 'rain' && !reducedMotion) {
      if (this.lightningFlashTimer > 0) {
        this.lightningFlashTimer -= dt
        if (this.lightningFlashTimer < 0) this.lightningFlashTimer = 0
      } else {
        this.lightningTimer -= dt
        if (this.lightningTimer <= 0) {
          this.lightningFlashTimer = WEATHER_LIGHTNING_FLASH_DURATION
          this.lightningTimer = this.nextLightningDelay()
        }
      }
    } else {
      this.lightningFlashTimer = 0
    }

    // Update existing particles and activate new ones up to targetMax
    let activeCount = 0
    for (let i = 0; i < this.particles.length; i++) {
      const p = this.particles[i]

      if (!p.active || p.kind !== weatherType) {
        if (activeCount < targetMax) {
          this.spawnParticle(p, weatherType, false)
          activeCount++
        } else {
          p.active = false
          continue
        }
      } else if (activeCount >= targetMax) {
        p.active = false
        continue
      } else {
        activeCount++
      }

      // Physics integration
      p.phase += dt * 3
      let vx = p.vx
      let vy = p.vy

      if (p.kind === 'snow') {
        vx += Math.sin(p.phase) * 20
        vy += scrollSpeed * 0.15
      } else if (p.kind === 'rain') {
        vy += scrollSpeed * 0.3
      } else if (p.kind === 'sandstorm') {
        vy += scrollSpeed * 0.2
      } else if (p.kind === 'smog') {
        vx += Math.cos(p.phase) * 15
        vy += scrollSpeed * 0.05
      }

      if (reducedMotion) {
        vx *= 0.5
        vy *= 0.6
      }

      p.x += vx * dt
      p.y += vy * dt

      // Wrap around bounds
      if (p.kind === 'smog') {
        if (p.y < -20 || p.x < -20 || p.x > this.canvasWidth + 20) {
          this.spawnParticle(p, weatherType, true)
          p.y = this.canvasHeight + 10
        }
      } else {
        if (p.y > this.canvasHeight + 20 || p.x < -30 || p.x > this.canvasWidth + 30) {
          this.spawnParticle(p, weatherType, true)
        }
      }
    }
  }

  private getTargetCount(kind: WeatherType, reducedMotion: boolean): number {
    let base = 0
    switch (kind) {
      case 'rain':
        base = WEATHER_MAX_RAIN_DROPS
        break
      case 'snow':
        base = WEATHER_MAX_SNOW_FLAKES
        break
      case 'sandstorm':
        base = WEATHER_MAX_SAND_GRAINS
        break
      case 'smog':
        base = WEATHER_MAX_SMOG_PUFFS
        break
      default:
        base = 0
        break
    }
    return reducedMotion ? Math.round(base * 0.25) : base
  }

  render(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    enabled = true,
    reducedMotion = false
  ): void {
    if (!enabled) return

    // 1. Render Lightning Flash (Rain only)
    if (this.lightningFlashTimer > 0 && !reducedMotion) {
      const alpha = (this.lightningFlashTimer / WEATHER_LIGHTNING_FLASH_DURATION) * 0.3
      ctx.save()
      ctx.fillStyle = `rgba(225, 240, 255, ${alpha})`
      ctx.fillRect(0, 0, width, height)
      ctx.restore()
    }

    // 2. Render Sandstorm Haze
    if (this.currentWeather === 'sandstorm') {
      ctx.save()
      ctx.fillStyle = 'rgba(210, 160, 80, 0.07)'
      ctx.fillRect(0, 0, width, height)
      ctx.restore()
    }

    // 3. Render Particles
    ctx.save()
    for (let i = 0; i < this.particles.length; i++) {
      const p = this.particles[i]
      if (!p.active) continue

      ctx.fillStyle = p.color
      ctx.strokeStyle = p.color
      ctx.globalAlpha = p.alpha

      if (p.kind === 'rain') {
        ctx.lineWidth = p.size
        ctx.beginPath()
        ctx.moveTo(p.x, p.y)
        ctx.lineTo(p.x + (p.vx / p.vy) * p.length, p.y + p.length)
        ctx.stroke()
      } else if (p.kind === 'sandstorm') {
        ctx.lineWidth = p.size
        ctx.beginPath()
        ctx.moveTo(p.x, p.y)
        ctx.lineTo(p.x - p.length, p.y + p.length * 0.25)
        ctx.stroke()
      } else if (p.kind === 'snow') {
        ctx.beginPath()
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2)
        ctx.fill()
      } else if (p.kind === 'smog') {
        ctx.beginPath()
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2)
        ctx.fill()
      }
    }
    ctx.restore()
  }

  reset(): void {
    this.lightningTimer = this.nextLightningDelay()
    this.lightningFlashTimer = 0
    // Nova run sorteia o clima de novo, em vez de herdar o do jogo anterior.
    this.requestedWeather = null
    this.weatherOccurs = true
    for (const p of this.particles) {
      p.active = false
    }
  }
}
