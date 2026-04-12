export interface RiverSegment {
  y: number
  centerX: number
  width: number
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

// ─── World class ─────────────────────────────────────────────────────────────

export class World {
  segments: RiverSegment[] = []
  scrollOffset = 0
  segmentHeight = SEG_H
  canvasWidth: number
  canvasHeight: number

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

  constructor(canvasWidth: number, canvasHeight: number) {
    this.canvasWidth = canvasWidth
    this.canvasHeight = canvasHeight

    const maxWidth = Math.min(canvasWidth * MAX_WIDTH_RATIO, 480)
    const startWidth = Math.min(maxWidth, 320)
    const cx = canvasWidth / 2

    this.genLeft = cx - startWidth / 2
    this.genRight = cx + startWidth / 2
    this.targetLeft = this.genLeft
    this.targetRight = this.genRight
    this.genPhase = 'hold'
    this.genRemaining = MAX_HOLD

    this.generateInitialSegments()
  }

  // ── Initial fill ────────────────────────────────────────────────────────────

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
    this.genRemaining = MIN_HOLD + Math.random() * (MAX_HOLD - MIN_HOLD)
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
    const newWidth = MIN_WIDTH + Math.random() * (maxW - MIN_WIDTH)

    // New center: allow it to drift, but keep within bounds
    const maxCenter = this.canvasWidth - margin - newWidth / 2
    const minCenter = margin + newWidth / 2
    // Bias center toward middle of canvas with some drift
    const drift = (Math.random() - 0.5) * this.canvasWidth * 0.35
    const newCenter = Math.max(minCenter, Math.min(maxCenter, this.canvasWidth / 2 + drift))

    // Allow asymmetric bank movement for more variety
    // Each bank can move independently within plausible limits
    const role = Math.random()
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

    // Move all segments downward
    for (const seg of this.segments) {
      seg.y += speed * dt
    }

    // Remove segments that have scrolled off the bottom
    while (this.segments.length > 0 && this.segments[0].y > this.canvasHeight + 10) {
      this.segments.shift()
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
  }

  // ── Render ───────────────────────────────────────────────────────────────────

  render(ctx: CanvasRenderingContext2D): void {
    // Background land (solid green)
    ctx.fillStyle = '#1a5c1a'
    ctx.fillRect(0, 0, this.canvasWidth, this.canvasHeight)

    // River water
    ctx.fillStyle = '#1a3a8a'
    for (const seg of this.segments) {
      if (seg.y < -SEG_H || seg.y > this.canvasHeight + SEG_H) continue
      const left = seg.centerX - seg.width / 2
      ctx.fillRect(left, seg.y, seg.width, SEG_H)
    }

    // Bank edge highlight — dark outer + bright inner for stronger contrast
    for (const seg of this.segments) {
      if (seg.y < -SEG_H || seg.y > this.canvasHeight + SEG_H) continue
      const left = seg.centerX - seg.width / 2
      const right = left + seg.width
      // Dark edge (land side)
      ctx.fillStyle = '#0f4a0f'
      ctx.fillRect(left - 2, seg.y, 2, SEG_H)
      ctx.fillRect(right, seg.y, 2, SEG_H)
      // Bright edge (water side)
      ctx.fillStyle = '#2a5aaa'
      ctx.fillRect(left, seg.y, 2, SEG_H)
      ctx.fillRect(right - 2, seg.y, 2, SEG_H)
    }

    // Subtle water shimmer
    ctx.fillStyle = 'rgba(100, 160, 255, 0.05)'
    for (let i = 0; i < this.segments.length; i += 8) {
      const seg = this.segments[i]
      if (!seg || seg.y < -SEG_H || seg.y > this.canvasHeight + SEG_H) continue
      const left = seg.centerX - seg.width / 2
      const shimmerX = left + ((this.scrollOffset * 0.25 + seg.y * 9) % Math.max(1, seg.width))
      ctx.fillRect(shimmerX, seg.y, 16, SEG_H * 4)
    }
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
    this.generateInitialSegments()
  }
}
