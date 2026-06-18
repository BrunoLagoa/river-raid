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

    ctx.fillStyle = 'rgba(0,0,0,0.5)'
    ctx.fillRect(0, 0, canvasWidth, 52)

    ctx.font = 'bold 16px "Courier New", monospace'
    ctx.fillStyle = '#ffee44'
    ctx.textAlign = 'left'
    ctx.fillText(`${score.toString().padStart(6, '0')}`, 14, 26)

    ctx.font = 'bold 10px "Courier New", monospace'
    ctx.fillStyle = '#aaaacc'
    ctx.fillText('SCORE', 14, 12)

    // Life icons
    for (let i = 0; i < lives; i++) {
      this.drawMiniPlane(ctx, 22 + i * 22, 38)
    }

    // Distance — centered readout for a sense of progress
    ctx.textAlign = 'center'
    ctx.font = 'bold 10px "Courier New", monospace'
    ctx.fillStyle = '#aaaacc'
    ctx.fillText(this.distanceLabel, canvasWidth / 2, 12)
    ctx.font = 'bold 16px "Courier New", monospace'
    ctx.fillStyle = '#88ddff'
    ctx.fillText(`${this.distanceMeters.toLocaleString()} m`, canvasWidth / 2, 28)

    const barWidth = 100
    const barHeight = 12
    const barX = canvasWidth - barWidth - 14
    const barY = 6

    ctx.font = 'bold 10px "Courier New", monospace'
    ctx.textAlign = 'right'
    ctx.fillStyle = '#aaaacc'
    ctx.fillText('FUEL', barX - 6, 16)

    ctx.fillStyle = '#222222'
    ctx.fillRect(barX, barY, barWidth, barHeight)

    const fuelRatio = Math.max(0, Math.min(1, fuel / 100))
    let fuelColor: string
    if (fuelRatio > 0.4) {
      fuelColor = '#00dd55'
    } else if (fuelRatio > 0.2) {
      fuelColor = '#ddaa00'
    } else {
      fuelColor = '#dd2200'
    }

    if (fuelRatio > 0) {
      ctx.fillStyle = fuelColor
      ctx.fillRect(barX, barY, barWidth * fuelRatio, barHeight)
    }

    const segCount = 10
    const segW = barWidth / segCount
    for (let i = 0; i < segCount; i++) {
      ctx.fillStyle = 'rgba(0,0,0,0.3)'
      ctx.fillRect(barX + i * segW + segW - 1, barY, 1, barHeight)
    }

    ctx.strokeStyle = '#667788'
    ctx.lineWidth = 1
    ctx.strokeRect(barX, barY, barWidth, barHeight)

    ctx.fillStyle = '#ffffff'
    ctx.font = 'bold 8px monospace'
    ctx.textAlign = 'center'
    ctx.fillText(`${Math.round(fuel)}%`, barX + barWidth / 2, barY + barHeight - 2)

    // Add shortcuts legend below fuel bar
    ctx.font = '9px "Courier New", monospace'
    ctx.fillStyle = '#8899aa'
    ctx.textAlign = 'right'
    ctx.fillText('P pausa', canvasWidth - 14, 32)
    ctx.fillText('M muta o som', canvasWidth - 14, 44)

    if (muted) {
      ctx.font = 'bold 10px "Courier New", monospace'
      ctx.fillStyle = '#ff4444'
      ctx.textAlign = 'right'
      ctx.fillText('MUTED', canvasWidth - 100, 44)
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
      ctx.fillStyle = objectiveData.completed ? 'rgba(0, 40, 20, 0.78)' : 'rgba(10, 18, 34, 0.78)'
      ctx.strokeStyle = objectiveData.completed ? '#44dd88' : '#4d6a8f'
      ctx.lineWidth = 1
      const boxW = 240
      const boxH = 52
      const boxX = 14
      const boxY = activeY
      ctx.fillRect(boxX, boxY, boxW, boxH)
      ctx.strokeRect(boxX + 0.5, boxY + 0.5, boxW - 1, boxH - 1)

      ctx.fillStyle = objectiveData.completed ? '#88ffbb' : '#cfe4ff'
      ctx.font = 'bold 10px "Courier New", monospace'
      ctx.textAlign = 'left'
      ctx.fillText(objectiveData.title, boxX + 8, boxY + 13)

      ctx.fillStyle = '#ffffff'
      ctx.font = 'bold 12px "Courier New", monospace'
      ctx.fillText(objectiveData.detail, boxX + 8, boxY + 27)

      const progressWidth = 88
      const progressHeight = 6
      const progressX = boxX + boxW - progressWidth - 10
      const progressY = boxY + 11
      ctx.fillStyle = '#1a2432'
      ctx.fillRect(progressX, progressY, progressWidth, progressHeight)
      ctx.fillStyle = objectiveData.completed ? '#44dd88' : '#55aaff'
      ctx.fillRect(progressX, progressY, Math.max(2, progressWidth * Math.max(0, Math.min(1, objectiveData.progressRatio))), progressHeight)
      ctx.strokeStyle = '#334455'
      ctx.strokeRect(progressX + 0.5, progressY + 0.5, progressWidth - 1, progressHeight - 1)

      ctx.font = '9px "Courier New", monospace'
      ctx.fillStyle = '#a9bed8'
      ctx.textAlign = 'left'
      if (objectiveData.timeLeftText) {
        ctx.fillText(objectiveData.timeLeftText, boxX + 8, boxY + 38)
      }
      ctx.fillText(objectiveData.progressText, boxX + 8, boxY + 48)
      ctx.fillStyle = objectiveData.completed ? '#88ffbb' : '#ffcc66'
      ctx.textAlign = 'right'
      ctx.fillText(objectiveData.statusText, boxX + boxW - 10, boxY + 48)
      ctx.fillStyle = '#8899aa'
      ctx.textAlign = 'right'
      ctx.fillText(objectiveData.rewardText, progressX + progressWidth, boxY + 28)
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
    const width = 120
    const height = 82
    const x = canvasWidth - width - 14
    const y = 58
    const visibleHeight = 280
    const scaleX = width / ctx.canvas.width
    const scaleY = height / visibleHeight

    ctx.save()

    // Background
    ctx.fillStyle = 'rgba(4, 10, 20, 0.7)'
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

    // Border drawn AFTER restore so it's always on top and never clipped
    ctx.save()
    ctx.strokeStyle = '#445566'
    ctx.lineWidth = 1
    ctx.strokeRect(x, y, width, height)
    ctx.fillStyle = '#8899aa'
    ctx.font = '9px "Courier New", monospace'
    ctx.textAlign = 'left'
    ctx.fillText('RADAR', x + 6, y + 11)
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
