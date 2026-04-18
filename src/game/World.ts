import type { ColorPalette } from './Atmosphere'
import type { RandomSource } from './random'

export interface RiverSegment {
  y: number
  centerX: number
  width: number
}

interface FlowLine {
  x: number
  y: number
  length: number
  speedRatio: number
}

// ─── Constants ───────────────────────────────────────────────────────────────

/** Each segment is this many pixels tall */
const SEG_H = 2

/** How many pixels the left/right bank jumps per staircase step */
const STEP_SIZE = 8

/** Pixels of vertical travel between each staircase step */
const STEP_INTERVAL = 10

/** Pixels to hold the same river shape before starting a new transition */
const MIN_HOLD = 120
const MAX_HOLD = 380

/** River width limits */
const MIN_WIDTH = 90
const MAX_WIDTH_RATIO = 0.72   // fraction of canvas width
const SIN_LUT_SIZE = 2048

// ─── World class ─────────────────────────────────────────────────────────────

export class World {
  segments: RiverSegment[] = []
  scrollOffset = 0
  segmentHeight = SEG_H
  private random: RandomSource
  canvasWidth: number
  canvasHeight: number

  private waterLines: FlowLine[] = []
  private gameTime = 0
  private sinLut = new Float32Array(SIN_LUT_SIZE)
  private waveX: number[] = []
  private waveBase: number[] = []
  private visibleSegmentsCache: Array<{ y: number; left: number; right: number; width: number; centerX: number }> = []
  private depthGradient: CanvasGradient | null = null
  private depthGradientCanvasH = 0
  private lastPaletteDepth = ''
  // generation-time bank positions (updated as we push new segments upward)
  private genLeft: number
  private genRight: number

  // where the banks are heading during a transition
  private targetLeft: number
  private targetRight: number

  // state machine for generation
  private genPhase: 'hold' | 'transition' = 'hold'
  private genRemaining = 0      // px remaining in current phase
  private stepAccum = 0         // accumulated px toward next step

  constructor(canvasWidth: number, canvasHeight: number, random: RandomSource = Math.random) {
    this.canvasWidth = canvasWidth
    this.canvasHeight = canvasHeight
    this.random = random

    const maxWidth = Math.min(canvasWidth * MAX_WIDTH_RATIO, 480)
    const startWidth = Math.min(maxWidth, 320)
    const cx = canvasWidth / 2

    this.genLeft = cx - startWidth / 2
    this.genRight = cx + startWidth / 2
    this.targetLeft = this.genLeft
    this.targetRight = this.genRight
    this.genPhase = 'hold'
    this.genRemaining = MAX_HOLD

    this.initWaveCache()
    this.generateInitialSegments()
    this.rebuildVisibleSegmentsCache()
  }

  // ── Initial fill ────────────────────────────────────────────────────────────

  private initWaveCache(): void {
    for (let i = 0; i < SIN_LUT_SIZE; i++) {
      this.sinLut[i] = Math.sin((i / SIN_LUT_SIZE) * Math.PI * 2)
    }
    this.rebuildWaveSamples()
  }

  private rebuildWaveSamples(): void {
    this.waveX = []
    this.waveBase = []
    for (let x = 0; x < this.canvasWidth; x += 4) {
      this.waveX.push(x)
      this.waveBase.push(x * 0.03)
    }
  }

  private fastSin(angle: number): number {
    const twoPi = Math.PI * 2
    let normalized = angle % twoPi
    if (normalized < 0) normalized += twoPi
    const idx = (normalized / twoPi) * SIN_LUT_SIZE
    const i0 = idx | 0
    const i1 = (i0 + 1) % SIN_LUT_SIZE
    const t = idx - i0
    return this.sinLut[i0] + (this.sinLut[i1] - this.sinLut[i0]) * t
  }

  private generateInitialSegments(): void {
    const count = Math.ceil(this.canvasHeight / SEG_H) + 80
    for (let i = 0; i < count; i++) {
      const y = this.canvasHeight - i * SEG_H
      this.segments.push(this.makeSegment(y))
      this.advanceGenState(SEG_H)
    }
  }

  // ── Segment factory ─────────────────────────────────────────────────────────

  private makeSegment(y: number): RiverSegment {
    const cx = (this.genLeft + this.genRight) / 2
    const w = this.genRight - this.genLeft
    return { y, centerX: cx, width: w }
  }

  // ── State-machine advance ────────────────────────────────────────────────────
  //
  // Called once per new segment added.  `dy` is always SEG_H.
  // This drives how the banks evolve as we generate higher and higher segments.

  private advanceGenState(dy: number): void {
    this.genRemaining -= dy

    if (this.genPhase === 'hold') {
      if (this.genRemaining <= 0) {
        this.beginTransition()
      }
      return
    }

    // ── transitioning ─────────────────────────────────────────────────────────
    this.stepAccum += dy
    if (this.stepAccum >= STEP_INTERVAL) {
      this.stepAccum -= STEP_INTERVAL
      this.stepBanks()
    }

    const done =
      this.genRemaining <= 0 ||
      (Math.abs(this.genLeft - this.targetLeft) < 1 &&
        Math.abs(this.genRight - this.targetRight) < 1)

    if (done) {
      this.genLeft = this.targetLeft
      this.genRight = this.targetRight
      this.beginHold()
    }
  }

  private stepBanks(): void {
    // Move each bank one STEP_SIZE toward its target (or snap if close)
    if (this.genLeft < this.targetLeft) {
      this.genLeft = Math.min(this.targetLeft, this.genLeft + STEP_SIZE)
    } else if (this.genLeft > this.targetLeft) {
      this.genLeft = Math.max(this.targetLeft, this.genLeft - STEP_SIZE)
    }

    if (this.genRight < this.targetRight) {
      this.genRight = Math.min(this.targetRight, this.genRight + STEP_SIZE)
    } else if (this.genRight > this.targetRight) {
      this.genRight = Math.max(this.targetRight, this.genRight - STEP_SIZE)
    }
  }

  private beginHold(): void {
    this.genPhase = 'hold'
    this.genRemaining = MIN_HOLD + this.random() * (MAX_HOLD - MIN_HOLD)
    this.stepAccum = 0
  }

  private beginTransition(): void {
    this.genPhase = 'transition'
    this.pickNewTarget()

    // Estimate distance needed for transition
    const maxBankDelta = Math.max(
      Math.abs(this.targetLeft - this.genLeft),
      Math.abs(this.targetRight - this.genRight),
    )
    const stepsNeeded = Math.ceil(maxBankDelta / STEP_SIZE)
    this.genRemaining = stepsNeeded * STEP_INTERVAL + 20
    this.stepAccum = 0
  }

  // ── Target picker ────────────────────────────────────────────────────────────
  //
  // Chooses a new random river "section": different width and/or position.
  // Banks are allowed to move independently (asymmetric transitions).

  private pickNewTarget(): void {
    const maxW = Math.min(this.canvasWidth * MAX_WIDTH_RATIO, 480)
    const margin = 16

    // New river width: bias toward a variety of widths
    const newWidth = MIN_WIDTH + this.random() * (maxW - MIN_WIDTH)

    // New center: allow it to drift, but keep within bounds
    const maxCenter = this.canvasWidth - margin - newWidth / 2
    const minCenter = margin + newWidth / 2
    // Bias center toward middle of canvas with some drift
    const drift = (this.random() - 0.5) * this.canvasWidth * 0.35
    const newCenter = Math.max(minCenter, Math.min(maxCenter, this.canvasWidth / 2 + drift))

    // Allow asymmetric bank movement for more variety
    // Each bank can move independently within plausible limits
    const role = this.random()
    let tLeft: number
    let tRight: number

    if (role < 0.33) {
      // Widen/narrow symmetrically around new center
      tLeft = newCenter - newWidth / 2
      tRight = newCenter + newWidth / 2
    } else if (role < 0.66) {
      // Only left bank moves (right stays)
      tRight = this.genRight
      tLeft = Math.max(margin, tRight - newWidth)
    } else {
      // Only right bank moves (left stays)
      tLeft = this.genLeft
      tRight = Math.min(this.canvasWidth - margin, tLeft + newWidth)
    }

    this.targetLeft = Math.max(margin, tLeft)
    this.targetRight = Math.min(this.canvasWidth - margin, tRight)

    // Guarantee minimum passable width
    if (this.targetRight - this.targetLeft < MIN_WIDTH) {
      const mid = (this.targetLeft + this.targetRight) / 2
      this.targetLeft = mid - MIN_WIDTH / 2
      this.targetRight = mid + MIN_WIDTH / 2
    }
  }

  // ── Update (called every frame) ──────────────────────────────────────────────

  update(dt: number, speed = 120): void {
    this.scrollOffset += speed * dt
    this.gameTime += dt

    // Move all segments downward
    for (const seg of this.segments) {
      seg.y += speed * dt
    }

    // Remove segments that have scrolled off the bottom (single splice instead of N shifts)
    let removeCount = 0
    while (removeCount < this.segments.length && this.segments[removeCount].y > this.canvasHeight + 10) {
      removeCount++
    }
    if (removeCount > 0) {
      this.segments.splice(0, removeCount)
    }

    // Generate new segments at the top as they are needed
    while (
      this.segments.length === 0 ||
      this.segments[this.segments.length - 1].y > -SEG_H
    ) {
      const lastY = this.segments.length > 0
        ? this.segments[this.segments.length - 1].y
        : 0

      const newY = lastY - SEG_H
      this.advanceGenState(SEG_H)
      this.segments.push(this.makeSegment(newY))
    }

    // Update water lines
    for (let i = this.waterLines.length - 1; i >= 0; i--) {
      const wl = this.waterLines[i]
      wl.y += speed * wl.speedRatio * dt
      if (wl.y > this.canvasHeight + 20) {
        // Recycle to top
        wl.y = -20
        wl.x = this.random() * this.canvasWidth
      }
    }

    // Spawn initial water lines if empty
    if (this.waterLines.length === 0) {
      for (let i = 0; i < 40; i++) {
        this.waterLines.push({
          x: this.random() * this.canvasWidth,
          y: this.random() * this.canvasHeight,
          length: 5 + this.random() * 15,
          speedRatio: 1.05 + this.random() * 0.15,
        })
      }
    }

    this.rebuildVisibleSegmentsCache()
  }

  // ── Render ───────────────────────────────────────────────────────────────────

  private rebuildVisibleSegmentsCache(): void {
    this.visibleSegmentsCache.length = 0
    for (const seg of this.segments) {
      if (seg.y < -10 || seg.y > this.canvasHeight + 10) continue
      const left = seg.centerX - seg.width / 2
      const right = left + seg.width
      this.visibleSegmentsCache.push({
        y: seg.y,
        left,
        right,
        width: seg.width,
        centerX: seg.centerX,
      })
    }
  }

  render(ctx: CanvasRenderingContext2D, palette?: ColorPalette): void {
    // Resolve colours — fallback to original hardcoded values when no palette given
    const land       = palette?.landBase       ?? '#1a5c1a'
    const edgeDark   = palette?.landEdgeDark   ?? '#0f4a0f'
    const edgeBright = palette?.landEdgeBright ?? '#2a5aaa'
    const water      = palette?.waterBase      ?? '#1a3a8a'
    const flow       = palette?.waterFlow      ?? '#2a55aa'
    const wave       = palette?.waterWave      ?? 'rgba(120, 180, 255, 0.08)'
    const depth      = palette?.waterDepth     ?? 'rgba(0, 10, 40, 0.15)'
    const shimmerC   = palette?.shimmer        ?? 'rgba(100, 160, 255, 0.08)'

    // Invalidate cached gradient when palette changes
    this.lastPaletteDepth = depth

    // Background land
    ctx.fillStyle = land
    ctx.fillRect(0, 0, this.canvasWidth, this.canvasHeight)

    // River water
    ctx.save()
    ctx.beginPath()
    for (const seg of this.visibleSegmentsCache) {
      ctx.rect(seg.left, seg.y - 1, seg.width, 10 + 2)
    }
    ctx.clip()

    // Base water color
    ctx.fillStyle = water
    ctx.fillRect(0, 0, this.canvasWidth, this.canvasHeight)

    // Flow lines
    ctx.fillStyle = flow
    for (const wl of this.waterLines) {
      ctx.fillRect(wl.x, wl.y, 2, wl.length)
    }

    // Sinusoidal water waves — organic horizontal ripples (cached x-samples + LUT sin)
    ctx.strokeStyle = wave
    ctx.lineWidth = 1
    const waveCount = 8
    const waveSpacing = this.canvasHeight / waveCount
    const timePhase = this.gameTime * 2
    for (let i = 0; i < waveCount; i++) {
      const baseY = (i * waveSpacing + this.gameTime * 25) % (this.canvasHeight + 40) - 20
      const phaseOffset = i * 1.5
      ctx.beginPath()
      for (let k = 0; k < this.waveX.length; k++) {
        const x = this.waveX[k]
        const waveY = baseY + this.fastSin(this.waveBase[k] + timePhase + phaseOffset) * 4
        if (k === 0) ctx.moveTo(x, waveY)
        else ctx.lineTo(x, waveY)
      }
      ctx.stroke()
    }

    // Depth gradient — water gets darker toward the top (cached)
    if (
      !this.depthGradient ||
      this.depthGradientCanvasH !== this.canvasHeight ||
      this.lastPaletteDepth !== depth
    ) {
      this.depthGradient = ctx.createLinearGradient(0, 0, 0, this.canvasHeight)
      this.depthGradient.addColorStop(0, depth)
      this.depthGradient.addColorStop(1, 'rgba(0, 0, 0, 0)')
      this.depthGradientCanvasH = this.canvasHeight
      this.lastPaletteDepth = depth
    }
    ctx.fillStyle = this.depthGradient
    ctx.fillRect(0, 0, this.canvasWidth, this.canvasHeight)

    ctx.restore()

    // Bank edge highlight — dark outer + bright inner for stronger contrast
    for (const seg of this.visibleSegmentsCache) {
      const left = seg.left
      const right = seg.right
      // Dark edge (land side)
      ctx.fillStyle = edgeDark
      ctx.fillRect(left - 2, seg.y, 2, SEG_H)
      ctx.fillRect(right, seg.y, 2, SEG_H)
      // Bright edge (water side)
      ctx.fillStyle = edgeBright
      ctx.fillRect(left, seg.y, 2, SEG_H)
      ctx.fillRect(right - 2, seg.y, 2, SEG_H)
    }

    // Subtle water shimmer (more transparent + smoother motion)
    ctx.save()
    ctx.globalAlpha = 0.35
    ctx.fillStyle = shimmerC
    for (let i = 0; i < this.visibleSegmentsCache.length; i += 10) {
      const seg = this.visibleSegmentsCache[i]
      if (!seg) continue
      const shimmerX = seg.left + ((this.scrollOffset * 0.12 + seg.y * 4) % Math.max(1, seg.width))
      ctx.fillRect(shimmerX, seg.y, 12, SEG_H * 3)
    }
    ctx.restore()
  }

  // ── Bounds queries (unchanged interface) ─────────────────────────────────────

  getBoundsAtY(y: number): { left: number; right: number } {
    if (this.segments.length === 0) {
      return { left: 0, right: this.canvasWidth }
    }

    // Binary search for the segment closest to `y`
    let lo = 0
    let hi = this.segments.length - 1
    while (lo < hi) {
      const mid = (lo + hi) >> 1
      if (this.segments[mid].y < y) {
        hi = mid
      } else {
        lo = mid + 1
      }
    }

    const a = this.segments[lo]
    return {
      left: a.centerX - a.width / 2,
      right: a.centerX + a.width / 2,
    }
  }

  clampToRiver(x: number, y: number, halfW: number): number {
    const bounds = this.getBoundsAtY(y)
    return Math.max(bounds.left + halfW + 2, Math.min(bounds.right - halfW - 2, x))
  }

  isOutOfBounds(x: number, y: number, halfW: number): boolean {
    const bounds = this.getBoundsAtY(y)
    return x - halfW < bounds.left || x + halfW > bounds.right
  }

  // ── Reset ────────────────────────────────────────────────────────────────────

  reset(canvasWidth: number, canvasHeight: number): void {
    this.canvasWidth = canvasWidth
    this.canvasHeight = canvasHeight
    this.scrollOffset = 0

    const maxWidth = Math.min(canvasWidth * MAX_WIDTH_RATIO, 480)
    const startWidth = Math.min(maxWidth, 320)
    const cx = canvasWidth / 2

    this.genLeft = cx - startWidth / 2
    this.genRight = cx + startWidth / 2
    this.targetLeft = this.genLeft
    this.targetRight = this.genRight
    this.genPhase = 'hold'
    this.genRemaining = MAX_HOLD
    this.stepAccum = 0

    this.segments = []
    this.depthGradient = null
    this.rebuildWaveSamples()
    this.generateInitialSegments()
    this.rebuildVisibleSegmentsCache()
  }
}
