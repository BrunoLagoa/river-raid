interface MinimapEntity {
  x: number
  y: number
}

interface MinimapSegment {
  y: number
  centerX: number
  width: number
}

interface MinimapData {
  player: MinimapEntity
  segments: MinimapSegment[]
  enemies: MinimapEntity[]
  fuelTanks: MinimapEntity[]
  powerUps: MinimapEntity[]
}

interface ObjectiveData {
  title: string
  detail: string
  progressText: string
  progressRatio: number
  statusText: string
  rewardText: string
  timeLeftText?: string
  completed: boolean
}

interface AchievementToast {
  title: string
  description: string
  timer: number
}

const TOAST_DURATION = 3.5
const TOAST_FADE_DURATION = 0.5

export class UI {
  private toasts: AchievementToast[] = []
  private pausedLabel = 'PAUSED'
  private pauseHintLabel = 'Press P or ESC to resume'
  private distanceLabel = 'DIST'
  private distanceMeters = 0

  /** Localized pause-overlay strings (defaults are English). */
  setPauseLabels(paused: string, hint: string): void {
    this.pausedLabel = paused
    this.pauseHintLabel = hint
  }

  setDistanceLabel(label: string): void {
    this.distanceLabel = label
  }

  setDistanceMeters(meters: number): void {
    this.distanceMeters = meters
  }

  pushToast(title: string, description: string): void {
    // Replace existing toast with the same title to avoid duplicates
    const existing = this.toasts.findIndex((t) => t.title === title)
    if (existing !== -1) {
      this.toasts[existing].timer = TOAST_DURATION
      return
    }
    this.toasts.push({ title, description, timer: TOAST_DURATION })
  }

  updateToasts(dt: number): void {
    for (let i = this.toasts.length - 1; i >= 0; i--) {
      this.toasts[i].timer -= dt
      if (this.toasts[i].timer <= 0) {
        this.toasts.splice(i, 1)
      }
    }
  }

  render(
    ctx: CanvasRenderingContext2D,
    score: number,
    fuel: number,
    canvasWidth: number,
    muted = false,
    paused = false,
    minimap?: MinimapData,
    doubleShotTimer = 0,
    slowMotionTimer = 0,
    comboData?: { multiplier: number; timer: number; maxTimer: number },
    objectiveData?: ObjectiveData | null,
    lives = 3,
    rapidFireTimer = 0,
    magnetFuelTimer = 0,
  ): void {
    ctx.save()

    // Top HUD band — taller, darker strip with an accent line so the
    // readouts separate cleanly from the bright terrain below.
    const barH = 60
    ctx.fillStyle = 'rgba(0,0,0,0.55)'
    ctx.fillRect(0, 0, canvasWidth, barH)
    ctx.fillStyle = 'rgba(130,175,215,0.32)'
    ctx.fillRect(0, barH - 1, canvasWidth, 1)

    // Score — top-left
    ctx.font = 'bold 11px "Courier New", monospace'
    ctx.fillStyle = '#aab4d0'
    ctx.textAlign = 'left'
    ctx.fillText('SCORE', 16, 17)
    ctx.font = 'bold 22px "Courier New", monospace'
    ctx.fillStyle = '#ffee44'
    ctx.fillText(`${score.toString().padStart(6, '0')}`, 16, 40)

    // Life icons
    for (let i = 0; i < lives; i++) {
      this.drawMiniPlane(ctx, 26 + i * 24, 52)
    }

    // Distance — centered readout for a sense of progress
    ctx.textAlign = 'center'
    ctx.font = 'bold 11px "Courier New", monospace'
    ctx.fillStyle = '#aab4d0'
    ctx.fillText(this.distanceLabel, canvasWidth / 2, 17)
    ctx.font = 'bold 22px "Courier New", monospace'
    ctx.fillStyle = '#8fdcff'
    ctx.fillText(`${this.distanceMeters.toLocaleString()} m`, canvasWidth / 2, 41)

    const barWidth = 124
    const barHeight = 18
    const barX = canvasWidth - barWidth - 16
    const barY = 9

    ctx.font = 'bold 11px "Courier New", monospace'
    ctx.textAlign = 'right'
    ctx.fillStyle = '#aab4d0'
    ctx.fillText('FUEL', barX - 8, barY + 13)

    ctx.fillStyle = '#1a1f26'
    ctx.fillRect(barX, barY, barWidth, barHeight)

    const fuelRatio = Math.max(0, Math.min(1, fuel / 100))
    let fuelColor: string
    if (fuelRatio > 0.4) {
      fuelColor = '#22dd66'
    } else if (fuelRatio > 0.2) {
      fuelColor = '#eebb22'
    } else {
      fuelColor = '#ee3322'
    }

    if (fuelRatio > 0) {
      ctx.fillStyle = fuelColor
      ctx.fillRect(barX, barY, barWidth * fuelRatio, barHeight)
    }

    const segCount = 10
    const segW = barWidth / segCount
    for (let i = 0; i < segCount; i++) {
      ctx.fillStyle = 'rgba(0,0,0,0.35)'
      ctx.fillRect(barX + i * segW + segW - 1, barY, 1, barHeight)
    }

    ctx.strokeStyle = '#7088a0'
    ctx.lineWidth = 1
    ctx.strokeRect(barX, barY, barWidth, barHeight)

    ctx.fillStyle = '#ffffff'
    ctx.font = 'bold 12px "Courier New", monospace'
    ctx.textAlign = 'center'
    ctx.fillText(`${Math.round(fuel)}%`, barX + barWidth / 2, barY + barHeight - 5)

    // Keyboard shortcut legend — below the fuel bar, roomier and lighter
    ctx.font = '11px "Courier New", monospace'
    ctx.fillStyle = '#9aabbd'
    ctx.textAlign = 'right'
    ctx.fillText('P  pausa', canvasWidth - 16, 44)
    ctx.fillText('M  muta o som', canvasWidth - 16, 57)

    if (muted) {
      ctx.font = 'bold 11px "Courier New", monospace'
      ctx.fillStyle = '#ff5555'
      ctx.textAlign = 'right'
      ctx.fillText('MUTED', canvasWidth - 132, 57)
    }

    if (minimap) {
      this.renderMinimap(ctx, canvasWidth, minimap)
    }

    let activeY = 80
    if (doubleShotTimer > 0) {
      ctx.fillStyle = '#ff4444'
      ctx.font = 'bold 12px "Courier New", monospace'
      ctx.textAlign = 'left'
      ctx.fillText(`DOUBLE SHOT ${doubleShotTimer.toFixed(1)}s`, 14, activeY)
      activeY += 16
    }
    if (slowMotionTimer > 0) {
      ctx.fillStyle = '#eebb00'
      ctx.font = 'bold 12px "Courier New", monospace'
      ctx.textAlign = 'left'
      ctx.fillText(`SLOW MOTION ${slowMotionTimer.toFixed(1)}s`, 14, activeY)
      activeY += 16
    }
    if (rapidFireTimer > 0) {
      ctx.fillStyle = '#ff8800'
      ctx.font = 'bold 12px "Courier New", monospace'
      ctx.textAlign = 'left'
      ctx.fillText(`RAPID FIRE ${rapidFireTimer.toFixed(1)}s`, 14, activeY)
      activeY += 16
    }
    if (magnetFuelTimer > 0) {
      ctx.fillStyle = '#00cccc'
      ctx.font = 'bold 12px "Courier New", monospace'
      ctx.textAlign = 'left'
      ctx.fillText(`MAGNET FUEL ${magnetFuelTimer.toFixed(1)}s`, 14, activeY)
      activeY += 16
    }

    if (comboData && comboData.multiplier > 1) {
      const { multiplier, timer } = comboData
      ctx.save()
      const pulse = timer > 0 ? Math.sin(timer * Math.PI) * 4 : 0
      const fontSize = 16 + pulse
      let fillStyle = '#ffff00'
      if (multiplier === 3) fillStyle = '#ffa500'
      if (multiplier >= 4) fillStyle = '#ff00ff'

      ctx.fillStyle = fillStyle
      ctx.font = `bold ${fontSize}px "Courier New", monospace`
      ctx.textAlign = 'left'
      let text = `${multiplier}X COMBO`
      if (multiplier >= 4) {
        text += ` MAX! (${comboData.maxTimer.toFixed(1)}s)`
      }
      ctx.fillText(text, 14, activeY + (pulse/2))
      ctx.restore()
      activeY += 18
    }

    if (objectiveData) {
      ctx.save()
      const boxX = 14
      const boxY = activeY
      const boxW = Math.min(308, canvasWidth - boxX - 14)
      const boxH = 66
      const pad = 12

      ctx.fillStyle = objectiveData.completed ? 'rgba(0, 42, 22, 0.82)' : 'rgba(10, 18, 34, 0.82)'
      ctx.strokeStyle = objectiveData.completed ? '#44dd88' : '#4d6a8f'
      ctx.lineWidth = 1
      ctx.fillRect(boxX, boxY, boxW, boxH)
      ctx.strokeRect(boxX + 0.5, boxY + 0.5, boxW - 1, boxH - 1)

      // Accent stripe on the left edge for a quick visual anchor
      ctx.fillStyle = objectiveData.completed ? '#44dd88' : '#55aaff'
      ctx.fillRect(boxX, boxY, 3, boxH)

      // Title
      ctx.fillStyle = objectiveData.completed ? '#88ffbb' : '#cfe4ff'
      ctx.font = 'bold 11px "Courier New", monospace'
      ctx.textAlign = 'left'
      ctx.fillText(objectiveData.title, boxX + pad, boxY + 17)

      // Progress bar — top right
      const progressWidth = 96
      const progressHeight = 7
      const progressX = boxX + boxW - progressWidth - pad
      const progressY = boxY + 9
      ctx.fillStyle = '#1a2432'
      ctx.fillRect(progressX, progressY, progressWidth, progressHeight)
      ctx.fillStyle = objectiveData.completed ? '#44dd88' : '#55aaff'
      ctx.fillRect(progressX, progressY, Math.max(2, progressWidth * Math.max(0, Math.min(1, objectiveData.progressRatio))), progressHeight)
      ctx.strokeStyle = '#334455'
      ctx.strokeRect(progressX + 0.5, progressY + 0.5, progressWidth - 1, progressHeight - 1)

      // Detail — full width, larger so it reads at a glance
      ctx.fillStyle = '#ffffff'
      ctx.font = 'bold 14px "Courier New", monospace'
      ctx.textAlign = 'left'
      ctx.fillText(objectiveData.detail, boxX + pad, boxY + 40)

      // Bottom row — progress count, time remaining, reward
      ctx.font = 'bold 11px "Courier New", monospace'
      ctx.fillStyle = objectiveData.completed ? '#9affc6' : '#cfe4ff'
      ctx.textAlign = 'left'
      ctx.fillText(objectiveData.progressText, boxX + pad, boxY + 58)

      if (objectiveData.timeLeftText) {
        ctx.font = '11px "Courier New", monospace'
        ctx.fillStyle = '#a9bed8'
        ctx.fillText(objectiveData.timeLeftText, boxX + pad + 64, boxY + 58)
      }

      ctx.font = 'bold 11px "Courier New", monospace'
      ctx.fillStyle = objectiveData.completed ? '#88ffbb' : '#ffcc66'
      ctx.textAlign = 'right'
      ctx.fillText(objectiveData.statusText, boxX + boxW - pad, boxY + 58)

      ctx.restore()
      activeY += boxH + 6
    }

    if (paused) {
      ctx.fillStyle = 'rgba(0,0,0,0.6)'
      ctx.fillRect(0, 0, canvasWidth, ctx.canvas.height)

      ctx.font = 'bold 32px "Courier New", monospace'
      ctx.fillStyle = '#44aaff'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText(this.pausedLabel, canvasWidth / 2, ctx.canvas.height / 2 - 16)

      ctx.font = '14px "Courier New", monospace'
      ctx.fillStyle = '#88aacc'
      ctx.fillText(this.pauseHintLabel, canvasWidth / 2, ctx.canvas.height / 2 + 20)
    }

    this.renderToasts(ctx, canvasWidth)

    ctx.restore()
  }

  private renderToasts(ctx: CanvasRenderingContext2D, canvasWidth: number): void {
    if (this.toasts.length === 0) return

    const toastW = 260
    const toastH = 48
    const toastX = canvasWidth - toastW - 14
    let toastY = 160

    ctx.save()
    for (const toast of this.toasts) {
      const fadeRatio = Math.min(1, toast.timer / TOAST_FADE_DURATION)
      const alpha = toast.timer >= TOAST_DURATION - TOAST_FADE_DURATION
        ? Math.min(1, (TOAST_DURATION - toast.timer) / TOAST_FADE_DURATION)
        : fadeRatio

      ctx.globalAlpha = alpha

      // Background
      ctx.fillStyle = 'rgba(20, 14, 0, 0.88)'
      ctx.fillRect(toastX, toastY, toastW, toastH)

      // Gold border
      ctx.strokeStyle = '#ccaa00'
      ctx.lineWidth = 1.5
      ctx.strokeRect(toastX + 0.5, toastY + 0.5, toastW - 1, toastH - 1)

      // Star icon
      ctx.font = 'bold 14px "Courier New", monospace'
      ctx.fillStyle = '#ffdd00'
      ctx.textAlign = 'left'
      ctx.textBaseline = 'alphabetic'
      ctx.fillText('\u2605', toastX + 10, toastY + 20)

      // "CONQUISTA" label
      ctx.font = 'bold 9px "Courier New", monospace'
      ctx.fillStyle = '#ccaa00'
      ctx.fillText('CONQUISTA', toastX + 28, toastY + 14)

      // Title
      ctx.font = 'bold 12px "Courier New", monospace'
      ctx.fillStyle = '#ffffff'
      ctx.fillText(toast.title, toastX + 28, toastY + 28)

      // Description
      ctx.font = '9px "Courier New", monospace'
      ctx.fillStyle = '#aaaaaa'
      ctx.fillText(toast.description, toastX + 10, toastY + 42)

      toastY += toastH + 6
    }
    ctx.globalAlpha = 1
    ctx.restore()
  }

  private renderMinimap(ctx: CanvasRenderingContext2D, canvasWidth: number, minimap: MinimapData): void {
    const width = 128
    const height = 90
    const x = canvasWidth - width - 16
    const y = 70
    const visibleHeight = 280
    const scaleX = width / ctx.canvas.width
    const scaleY = height / visibleHeight

    ctx.save()

    // Background
    ctx.fillStyle = 'rgba(4, 10, 20, 0.78)'
    ctx.fillRect(x, y, width, height)

    // Clip ALL drawing to the minimap rect — nothing escapes the border
    ctx.beginPath()
    ctx.rect(x, y, width, height)
    ctx.clip()

    // River segments
    ctx.strokeStyle = '#2a7dff'
    ctx.lineWidth = 1
    for (const seg of minimap.segments) {
      const dy = minimap.player.y - seg.y
      if (dy < -40 || dy > visibleHeight) continue
      const my = y + height - dy * scaleY
      const left = x + (seg.centerX - seg.width / 2) * scaleX
      const right = x + (seg.centerX + seg.width / 2) * scaleX
      ctx.beginPath()
      ctx.moveTo(left, my)
      ctx.lineTo(right, my)
      ctx.stroke()
    }

    // Enemies
    for (const enemy of minimap.enemies) {
      const dy = minimap.player.y - enemy.y
      if (dy < -20 || dy > visibleHeight) continue
      ctx.fillStyle = '#ff5555'
      ctx.fillRect(x + enemy.x * scaleX - 1, y + height - dy * scaleY - 1, 3, 3)
    }

    // Fuel tanks
    for (const fuelTank of minimap.fuelTanks) {
      const dy = minimap.player.y - fuelTank.y
      if (dy < -20 || dy > visibleHeight) continue
      ctx.fillStyle = '#44dd66'
      ctx.fillRect(x + fuelTank.x * scaleX - 1, y + height - dy * scaleY - 1, 3, 3)
    }

    // Power Ups
    for (const p of minimap.powerUps) {
      const dy = minimap.player.y - p.y
      if (dy < -20 || dy > visibleHeight) continue
      ctx.fillStyle = '#44ffff'
      ctx.fillRect(x + p.x * scaleX - 1, y + height - dy * scaleY - 1, 3, 3)
    }

    // Player dot
    ctx.fillStyle = '#ffffff'
    ctx.beginPath()
    ctx.arc(x + minimap.player.x * scaleX, y + height - 8, 3, 0, Math.PI * 2)
    ctx.fill()

    ctx.restore()

    // Header + border drawn AFTER restore so they're always on top and never clipped
    ctx.save()
    ctx.fillStyle = 'rgba(8, 16, 28, 0.9)'
    ctx.fillRect(x, y, width, 16)
    ctx.strokeStyle = '#5a7088'
    ctx.lineWidth = 1
    ctx.strokeRect(x, y, width, height)
    ctx.fillStyle = '#b8c8da'
    ctx.font = 'bold 10px "Courier New", monospace'
    ctx.textAlign = 'left'
    ctx.fillText('RADAR', x + 8, y + 12)
    ctx.restore()
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  resize(_width: number): void {
  }

  private drawMiniPlane(ctx: CanvasRenderingContext2D, cx: number, cy: number): void {
    ctx.save()
    ctx.fillStyle = '#aabbcc'
    // fuselage
    ctx.beginPath()
    ctx.moveTo(cx, cy - 7)
    ctx.lineTo(cx - 3, cy + 3)
    ctx.lineTo(cx + 3, cy + 3)
    ctx.closePath()
    ctx.fill()
    // wings
    ctx.fillRect(cx - 8, cy, 16, 3)
    ctx.restore()
  }
}
