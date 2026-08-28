// ─── Atmosphere.ts ───────────────────────────────────────────────────────────
// Manages three purely-visual atmospheric effects:
//   1. Day/Night Cycle — smooth palette interpolation over 12 minutes
//   2. Parallax Clouds — slow-moving pixel-art cloud blobs
//   3. CRT Scanlines   — single-drawcall screen-space overlay
// None of these affect gameplay logic.

export interface ColorPalette {
  landBase: string
  landEdgeDark: string
  landEdgeBright: string
  waterBase: string
  waterFlow: string
  waterWave: string   // rgba(...)
  waterDepth: string  // rgba(...)
  shimmer: string     // rgba(...)
  brightness: number  // 0.0–1.0 for scenery dimming
}

// ─── Internal colour representation ──────────────────────────────────────────
// Stored as [r,g,b] (0-255) for efficient lerping.

export type RGB = [number, number, number]
export type RGBA = [number, number, number, number]

export interface PaletteRaw {
  landBase: RGB
  landEdgeDark: RGB
  landEdgeBright: RGB
  waterBase: RGB
  waterFlow: RGB
  waterWave: RGBA
  waterDepth: RGBA
  shimmer: RGBA
  brightness: number
}

// ─── Phase palettes ───────────────────────────────────────────────────────────

const PALETTES: PaletteRaw[] = [
  // 0 — Day
  {
    landBase:       [26,  92, 26],
    landEdgeDark:   [15,  74, 15],
    landEdgeBright: [42,  90, 170],
    waterBase:      [26,  58, 138],
    waterFlow:      [42,  85, 170],
    waterWave:      [120, 180, 255, 0.08],
    waterDepth:     [0,   10,  40, 0.15],
    shimmer:        [100, 160, 255, 0.08],
    brightness: 1.0,
  },
  // 1 — Sunset
  {
    landBase:       [60,  50, 10],
    landEdgeDark:   [40,  30,  5],
    landEdgeBright: [130, 80,  40],
    waterBase:      [42,  42,  90],
    waterFlow:      [70,  55, 110],
    waterWave:      [255, 160,  80, 0.06],
    waterDepth:     [30,  10,   0, 0.18],
    shimmer:        [255, 160,  80, 0.07],
    brightness: 0.75,
  },
  // 2 — Night
  {
    landBase:       [10,  26, 10],
    landEdgeDark:   [5,   12,  5],
    landEdgeBright: [20,  50,  80],
    waterBase:      [10,  26,  58],
    waterFlow:      [20,  40,  80],
    waterWave:      [80, 120, 200, 0.04],
    waterDepth:     [0,    5,  20, 0.22],
    shimmer:        [60,  100, 200, 0.05],
    brightness: 0.45,
  },
  // 3 — Dawn
  {
    landBase:       [26,  58, 26],
    landEdgeDark:   [15,  38, 15],
    landEdgeBright: [60,  90, 130],
    waterBase:      [26,  42, 106],
    waterFlow:      [50,  70, 140],
    waterWave:      [200, 180, 255, 0.06],
    waterDepth:     [10,  5,  30, 0.18],
    shimmer:        [180, 160, 255, 0.06],
    brightness: 0.70,
  },
]

// ─── Day/Night modulation profiles ──────────────────────────────────────────
// Applied on top of any biome's base palette.
// brightness: multiplier (1.0 = no change, 0.45 = night)
// tintRGB: target colour for tinting
// tintStrength: how strongly to push colours toward tintRGB (0 = none)

interface DayNightModulation {
  brightness: number
  tintRGB: RGB
  tintStrength: number
}

const MODULATIONS: DayNightModulation[] = [
  // 0 — Day (neutral: no tint)
  { brightness: 1.00, tintRGB: [255, 255, 255], tintStrength: 0.00 },
  // 1 — Sunset (warm orange tint, dimmer)
  { brightness: 0.85, tintRGB: [255, 140,  80], tintStrength: 0.18 },
  // 2 — Night (cool blue tint, much dimmer)
  { brightness: 0.55, tintRGB: [ 60,  80, 140], tintStrength: 0.30 },
  // 3 — Dawn (soft purple tint, slightly dim)
  { brightness: 0.75, tintRGB: [200, 170, 220], tintStrength: 0.15 },
]

function lerpModulation(a: DayNightModulation, b: DayNightModulation, t: number): DayNightModulation {
  return {
    brightness:    lerpN(a.brightness, b.brightness, t),
    tintRGB:       lerpRGB(a.tintRGB, b.tintRGB, t),
    tintStrength:  lerpN(a.tintStrength, b.tintStrength, t),
  }
}

function modulateRGB(base: RGB, mod: DayNightModulation): RGB {
  const dimmed: RGB = [
    Math.round(Math.min(255, base[0] * mod.brightness)),
    Math.round(Math.min(255, base[1] * mod.brightness)),
    Math.round(Math.min(255, base[2] * mod.brightness)),
  ]
  return lerpRGB(dimmed, mod.tintRGB, mod.tintStrength)
}

function modulatePalette(base: PaletteRaw, mod: DayNightModulation): PaletteRaw {
  return {
    landBase:       modulateRGB(base.landBase,       mod),
    landEdgeDark:   modulateRGB(base.landEdgeDark,   mod),
    landEdgeBright: modulateRGB(base.landEdgeBright, mod),
    waterBase:      modulateRGB(base.waterBase,      mod),
    waterFlow:      modulateRGB(base.waterFlow,      mod),
    waterWave:      [...modulateRGB([base.waterWave[0], base.waterWave[1], base.waterWave[2]], mod), parseFloat((base.waterWave[3] * mod.brightness).toFixed(3))] as RGBA,
    waterDepth:     [...modulateRGB([base.waterDepth[0], base.waterDepth[1], base.waterDepth[2]], mod), parseFloat((base.waterDepth[3] * (1 + (1 - mod.brightness) * 0.5)).toFixed(3))] as RGBA,
    shimmer:        [...modulateRGB([base.shimmer[0], base.shimmer[1], base.shimmer[2]], mod), parseFloat((base.shimmer[3] * mod.brightness).toFixed(3))] as RGBA,
    brightness:     base.brightness * mod.brightness,
  }
}


const CLOUD_COLORS: RGBA[] = [
  [255, 255, 255, 0.15], // Day   — white
  [255, 180, 120, 0.12], // Sunset — warm orange
  [50,   60,  80, 0.07], // Night  — dark blue-grey
  [220, 180, 255, 0.10], // Dawn   — soft purple
]

// ─── Helpers ──────────────────────────────────────────────────────────────────

function smoothstep(t: number): number {
  return t * t * (3 - 2 * t)
}

function lerpN(a: number, b: number, t: number): number {
  return a + (b - a) * t
}

function lerpRGB(a: RGB, b: RGB, t: number): RGB {
  return [
    Math.round(lerpN(a[0], b[0], t)),
    Math.round(lerpN(a[1], b[1], t)),
    Math.round(lerpN(a[2], b[2], t)),
  ]
}

function lerpRGBA(a: RGBA, b: RGBA, t: number): RGBA {
  return [
    Math.round(lerpN(a[0], b[0], t)),
    Math.round(lerpN(a[1], b[1], t)),
    Math.round(lerpN(a[2], b[2], t)),
    parseFloat(lerpN(a[3], b[3], t).toFixed(3)),
  ]
}

function toHex(rgb: RGB): string {
  return '#' + rgb.map((c) => c.toString(16).padStart(2, '0')).join('')
}

function toRgba(rgba: RGBA): string {
  return `rgba(${rgba[0]}, ${rgba[1]}, ${rgba[2]}, ${rgba[3]})`
}

function rawToPalette(r: PaletteRaw): ColorPalette {
  return {
    landBase:       toHex(r.landBase),
    landEdgeDark:   toHex(r.landEdgeDark),
    landEdgeBright: toHex(r.landEdgeBright),
    waterBase:      toHex(r.waterBase),
    waterFlow:      toHex(r.waterFlow),
    waterWave:      toRgba(r.waterWave),
    waterDepth:     toRgba(r.waterDepth),
    shimmer:        toRgba(r.shimmer),
    brightness:     r.brightness,
  }
}

export function lerpPaletteRaw(a: PaletteRaw, b: PaletteRaw, t: number): PaletteRaw {
  return {
    landBase:       lerpRGB(a.landBase,       b.landBase,       t),
    landEdgeDark:   lerpRGB(a.landEdgeDark,   b.landEdgeDark,   t),
    landEdgeBright: lerpRGB(a.landEdgeBright, b.landEdgeBright, t),
    waterBase:      lerpRGB(a.waterBase,      b.waterBase,      t),
    waterFlow:      lerpRGB(a.waterFlow,      b.waterFlow,      t),
    waterWave:      lerpRGBA(a.waterWave,     b.waterWave,      t),
    waterDepth:     lerpRGBA(a.waterDepth,    b.waterDepth,     t),
    shimmer:        lerpRGBA(a.shimmer,       b.shimmer,        t),
    brightness:     lerpN(a.brightness,       b.brightness,     t),
  }
}

// ─── Cloud ────────────────────────────────────────────────────────────────────

interface Cloud {
  x: number
  y: number
  size: number    // base pixel cell size (~50-130px)
  opacity: number // baked-in opacity multiplier
  variant: number // 0, 1, 2 — shape family
  speedRatio: number // fraction of scrollSpeed
}

const NUM_CLOUDS = 5
const CLOUD_MIN_SIZE = 50
const CLOUD_MAX_SIZE = 130
const CLOUD_MIN_SPEED = 0.25
const CLOUD_MAX_SPEED = 0.35

function makeCloud(canvasWidth: number, canvasHeight: number, randomY = true): Cloud {
  return {
    x: Math.random() * canvasWidth,
    y: randomY ? Math.random() * canvasHeight : -(CLOUD_MAX_SIZE + Math.random() * 80),
    size: CLOUD_MIN_SIZE + Math.random() * (CLOUD_MAX_SIZE - CLOUD_MIN_SIZE),
    opacity: 0.5 + Math.random() * 0.5,
    variant: Math.floor(Math.random() * 3),
    speedRatio: CLOUD_MIN_SPEED + Math.random() * (CLOUD_MAX_SPEED - CLOUD_MIN_SPEED),
  }
}

// ─── Snowflake ──────────────────────────────────────────────────────────────
// Foreground falling-snow particles, only visible in the snow biome. Drift down
// with a gentle horizontal sway; recycled at the top when they leave the screen.

interface Snowflake {
  x: number
  y: number
  size: number    // 1-3 px square
  vy: number      // fall speed (px/s)
  sway: number    // horizontal sway amplitude (px/s)
  phase: number   // sway oscillator phase
  opacity: number // baked-in opacity multiplier
}

const NUM_SNOWFLAKES = 90

function makeSnowflake(canvasWidth: number, canvasHeight: number, randomY = true): Snowflake {
  return {
    x: Math.random() * canvasWidth,
    y: randomY ? Math.random() * canvasHeight : -4 - Math.random() * 20,
    size: 1 + Math.floor(Math.random() * 3),
    vy: 28 + Math.random() * 46,
    sway: 8 + Math.random() * 18,
    phase: Math.random() * Math.PI * 2,
    opacity: 0.5 + Math.random() * 0.5,
  }
}

// ─── Atmosphere class ─────────────────────────────────────────────────────────

const CYCLE_DURATION = 120   // 2 minutes total
const PHASE_DURATION = 30    // 30 seconds per phase
const HOLD_FRACTION  = 0.35  // 35% of each phase holds the colour steady

export class Atmosphere {
  private cycleTime = 0
  private currentPaletteRaw: PaletteRaw = PALETTES[0]
  private phaseIndex = 0
  private clouds: Cloud[] = []
  private snowflakes: Snowflake[] = []
  private snowIntensity = 0
  private canvasWidth: number
  private canvasHeight: number

  constructor(canvasWidth: number, canvasHeight: number) {
    this.canvasWidth = canvasWidth
    this.canvasHeight = canvasHeight
    this.initClouds()
    this.initSnow()
  }

  // ── Initialisation ───────────────────────────────────────────────────────────

  private initClouds(): void {
    this.clouds = []
    for (let i = 0; i < NUM_CLOUDS; i++) {
      this.clouds.push(makeCloud(this.canvasWidth, this.canvasHeight, true))
    }
  }

  private initSnow(): void {
    this.snowflakes = []
    for (let i = 0; i < NUM_SNOWFLAKES; i++) {
      this.snowflakes.push(makeSnowflake(this.canvasWidth, this.canvasHeight, true))
    }
  }

  /** Intensidade da nevasca (0-1). Definida pelo Game conforme o bioma de neve. */
  setSnow(intensity: number): void {
    this.snowIntensity = Math.max(0, Math.min(1, intensity))
  }

  // ── Update ───────────────────────────────────────────────────────────────────

  update(dt: number, scrollSpeed: number, basePalette?: PaletteRaw): void {
    if (!Number.isFinite(dt)) return
    this.cycleTime = (this.cycleTime + dt) % CYCLE_DURATION
    if (this.cycleTime < 0) this.cycleTime += CYCLE_DURATION

    // ── Day/Night palette interpolation ────────────────────────────────────────
    const phaseIndex = Math.floor(this.cycleTime / PHASE_DURATION) % 4
    const phaseProgress = (this.cycleTime % PHASE_DURATION) / PHASE_DURATION
    this.phaseIndex = phaseIndex

    let blend = 0
    if (phaseProgress < HOLD_FRACTION) {
      blend = 0
    } else if (phaseProgress > 1 - HOLD_FRACTION) {
      blend = 1
    } else {
      const t = (phaseProgress - HOLD_FRACTION) / (1 - 2 * HOLD_FRACTION)
      blend = smoothstep(t)
    }

    const nextPhase = (phaseIndex + 1) % 4
    if (basePalette) {
      // Biome mode: apply day/night modulation on top of the biome's base palette
      const mod = lerpModulation(MODULATIONS[phaseIndex], MODULATIONS[nextPhase], blend)
      this.currentPaletteRaw = modulatePalette(basePalette, mod)
    } else {
      // Legacy mode: interpolate between fixed phase palettes
      this.currentPaletteRaw = lerpPaletteRaw(PALETTES[phaseIndex], PALETTES[nextPhase], blend)
    }

    // ── Clouds ─────────────────────────────────────────────────────────────────
    for (const cloud of this.clouds) {
      cloud.y += scrollSpeed * cloud.speedRatio * dt
      if (cloud.y > this.canvasHeight + CLOUD_MAX_SIZE) {
        // Recycle: re-enter from top with new random properties
        const fresh = makeCloud(this.canvasWidth, this.canvasHeight, false)
        cloud.x = fresh.x
        cloud.y = fresh.y
        cloud.size = fresh.size
        cloud.opacity = fresh.opacity
        cloud.variant = fresh.variant
        cloud.speedRatio = fresh.speedRatio
      }
    }

    // ── Snow particles ───────────────────────────────────────────────────────
    // Always advanced (only ~90 flakes); rendered only when snowIntensity > 0.
    for (const f of this.snowflakes) {
      f.phase += dt * 1.2
      f.y += (f.vy + scrollSpeed * 0.12) * dt
      f.x += Math.sin(f.phase) * f.sway * dt
      if (f.y > this.canvasHeight + 4) {
        const fresh = makeSnowflake(this.canvasWidth, this.canvasHeight, false)
        f.x = fresh.x; f.y = fresh.y; f.size = fresh.size
        f.vy = fresh.vy; f.sway = fresh.sway; f.phase = fresh.phase; f.opacity = fresh.opacity
      } else if (f.x < -4) {
        f.x = this.canvasWidth + 4
      } else if (f.x > this.canvasWidth + 4) {
        f.x = -4
      }
    }
  }

  // ── Public palette getter ────────────────────────────────────────────────────

  getPalette(): ColorPalette {
    return rawToPalette(this.currentPaletteRaw)
  }

  /** Fase do ciclo dia/noite atual: 0=dia, 1=pôr do sol, 2=noite, 3=amanhecer. */
  getPhaseIndex(): number {
    return this.phaseIndex
  }

  getPhaseProgress(): number {
    return (this.cycleTime % PHASE_DURATION) / PHASE_DURATION
  }

  isNight(): boolean {
    return this.phaseIndex === 2
  }

  // ── Render: Clouds ───────────────────────────────────────────────────────────

  renderClouds(ctx: CanvasRenderingContext2D): void {
    // Blend cloud colour based on current phase and next phase
    const nextPhase = (this.phaseIndex + 1) % 4
    const phaseProgress = (this.cycleTime % PHASE_DURATION) / PHASE_DURATION
    let blend = 0
    if (phaseProgress >= HOLD_FRACTION && phaseProgress <= 1 - HOLD_FRACTION) {
      blend = smoothstep((phaseProgress - HOLD_FRACTION) / (1 - 2 * HOLD_FRACTION))
    } else if (phaseProgress > 1 - HOLD_FRACTION) {
      blend = 1
    }

    const ca = CLOUD_COLORS[this.phaseIndex]
    const cb = CLOUD_COLORS[nextPhase]
    const cloudRGBA = lerpRGBA(ca, cb, blend)

    for (const cloud of this.clouds) {
      if (cloud.y < -CLOUD_MAX_SIZE || cloud.y > this.canvasHeight + CLOUD_MAX_SIZE) continue

      ctx.save()
      ctx.globalAlpha = cloudRGBA[3] * cloud.opacity
      ctx.fillStyle = `rgb(${cloudRGBA[0]}, ${cloudRGBA[1]}, ${cloudRGBA[2]})`

      this.drawCloudShape(ctx, cloud.x, cloud.y, cloud.size, cloud.variant)
      ctx.restore()
    }
  }

  private drawCloudShape(
    ctx: CanvasRenderingContext2D,
    cx: number,
    cy: number,
    size: number,
    variant: number,
  ): void {
    // Pixel-art blobs: groups of rounded rectangles.
    // All coordinates relative to (cx, cy) using 'size' as the base unit.
    const u = size / 10  // 1 unit = size/10 px

    if (variant === 0) {
      // Wide flat cloud — classic cumulus shape
      ctx.fillRect(cx - 4 * u, cy,        8 * u, 2 * u)
      ctx.fillRect(cx - 3 * u, cy - 2 * u, 6 * u, 2 * u)
      ctx.fillRect(cx - 2 * u, cy - 4 * u, 4 * u, 2 * u)
      ctx.fillRect(cx - 5 * u, cy,        2 * u, 2 * u)
      ctx.fillRect(cx + 3 * u, cy,        2 * u, 2 * u)
    } else if (variant === 1) {
      // Tall puffy cloud
      ctx.fillRect(cx - 3 * u, cy,         6 * u, 3 * u)
      ctx.fillRect(cx - 2 * u, cy - 3 * u, 4 * u, 3 * u)
      ctx.fillRect(cx - 4 * u, cy + 1 * u, 2 * u, 2 * u)
      ctx.fillRect(cx + 2 * u, cy + 1 * u, 2 * u, 2 * u)
      ctx.fillRect(cx - 1 * u, cy - 5 * u, 2 * u, 2 * u)
    } else {
      // Scattered wisp cloud
      ctx.fillRect(cx - 5 * u, cy,         4 * u, 2 * u)
      ctx.fillRect(cx - 1 * u, cy - 1 * u, 5 * u, 2 * u)
      ctx.fillRect(cx + 4 * u, cy + 1 * u, 3 * u, 1 * u)
      ctx.fillRect(cx - 3 * u, cy + 2 * u, 3 * u, 1 * u)
    }
  }

  // ── Render: Snow weather ─────────────────────────────────────────────────────
  // Foreground falling snow + a faint cold wash, scaled by snowIntensity so it
  // fades in/out smoothly across the biome transition.

  renderWeather(ctx: CanvasRenderingContext2D): void {
    const s = this.snowIntensity
    if (s <= 0.01) return
    ctx.save()
    // Faint icy wash over the whole scene
    ctx.fillStyle = `rgba(214, 236, 255, ${(0.05 * s).toFixed(3)})`
    ctx.fillRect(0, 0, this.canvasWidth, this.canvasHeight)
    // Falling flakes
    ctx.fillStyle = '#ffffff'
    for (const f of this.snowflakes) {
      ctx.globalAlpha = f.opacity * s
      ctx.fillRect(f.x, f.y, f.size, f.size)
    }
    ctx.globalAlpha = 1
    ctx.restore()
  }

  // ── Render: Scanlines ────────────────────────────────────────────────────────
  // Draw horizontal dark lines every 4px to simulate a CRT TV effect.
  // Using direct fillRect loop instead of CanvasPattern to avoid
  // InvalidStateError when patterns cross canvas contexts.

  renderScanlines(ctx: CanvasRenderingContext2D, width: number, height: number): void {
    ctx.save()
    ctx.fillStyle = 'rgba(0, 0, 0, 0.04)'
    for (let y = 0; y < height; y += 4) {
      ctx.fillRect(0, y, width, 2)
    }
    ctx.restore()
  }

  // ── Lifecycle ────────────────────────────────────────────────────────────────

  resize(canvasWidth: number, canvasHeight: number): void {
    this.canvasWidth = canvasWidth
    this.canvasHeight = canvasHeight
  }

  reset(canvasWidth: number, canvasHeight: number): void {
    this.canvasWidth = canvasWidth
    this.canvasHeight = canvasHeight
    this.cycleTime = 0
    this.phaseIndex = 0
    this.currentPaletteRaw = PALETTES[0]
    this.snowIntensity = 0
    this.initClouds()
    this.initSnow()
  }
}
