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
}

export class UI {
  render(
    ctx: CanvasRenderingContext2D,
    score: number,
    fuel: number,
    canvasWidth: number,
    muted = false,
    paused = false,
    minimap?: MinimapData,
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

    if (paused) {
      ctx.fillStyle = 'rgba(0,0,0,0.6)'
      ctx.fillRect(0, 0, canvasWidth, ctx.canvas.height)

      ctx.font = 'bold 32px "Courier New", monospace'
      ctx.fillStyle = '#44aaff'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText('PAUSED', canvasWidth / 2, ctx.canvas.height / 2 - 16)

      ctx.font = '14px "Courier New", monospace'
      ctx.fillStyle = '#88aacc'
      ctx.fillText('Press P or ESC to resume', canvasWidth / 2, ctx.canvas.height / 2 + 20)
    }

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
}
