import type { GhostPlaybackState } from './GhostReplaySystem'

export class GhostRenderer {
  render(
    ctx: CanvasRenderingContext2D,
    ghost: GhostPlaybackState,
    animFrame = 0
  ): void {
    const { x, y, bank, shooting } = ghost

    ctx.save()
    ctx.globalAlpha = 0.38

    // Banking tilt (-6° to +6°)
    if (bank !== 0) {
      ctx.translate(x, y)
      ctx.rotate((bank * 6 * Math.PI) / 180)
      ctx.translate(-x, -y)
    }

    // Holographic flicker / glow effect
    const flicker = 0.9 + 0.1 * Math.sin(animFrame * 1.5)
    ctx.shadowColor = '#00f0ff'
    ctx.shadowBlur = 12 * flicker

    // Ghost Aircraft Wings (Cyan hologram silhouette)
    for (const s of [-1, 1]) {
      ctx.fillStyle = 'rgba(0, 240, 255, 0.45)'
      ctx.beginPath()
      ctx.moveTo(x + s * 2, y - 2)
      ctx.lineTo(x + s * 14, y + 8)
      ctx.lineTo(x + s * 14, y + 11)
      ctx.lineTo(x + s * 4, y + 8)
      ctx.closePath()
      ctx.fill()

      // Wing scanline wireframe
      ctx.strokeStyle = '#00f0ff'
      ctx.lineWidth = 1
      ctx.stroke()
    }

    // Tail fins
    for (const s of [-1, 1]) {
      ctx.fillStyle = 'rgba(0, 200, 255, 0.4)'
      ctx.beginPath()
      ctx.moveTo(x + s * 1, y + 9)
      ctx.lineTo(x + s * 7, y + 14)
      ctx.lineTo(x + s * 3, y + 14)
      ctx.closePath()
      ctx.fill()
    }

    // Fuselage body
    ctx.fillStyle = 'rgba(14, 165, 233, 0.55)'
    ctx.beginPath()
    ctx.moveTo(x, y - 17)
    ctx.lineTo(x - 4, y - 4)
    ctx.lineTo(x - 4, y + 10)
    ctx.lineTo(x - 3, y + 14)
    ctx.lineTo(x + 3, y + 14)
    ctx.lineTo(x + 4, y + 10)
    ctx.lineTo(x + 4, y - 4)
    ctx.closePath()
    ctx.fill()

    ctx.strokeStyle = '#38bdf8'
    ctx.lineWidth = 1
    ctx.stroke()

    // Hologram cockpit
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(x - 1, y - 7, 2, 4)

    // Holographic Thruster flame
    ctx.fillStyle = '#00f0ff'
    const flameH = [4, 7, 5, 8][animFrame % 4]
    ctx.fillRect(x - 2, y + 14, 4, flameH)

    // Scanline interference stripes
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.25)'
    ctx.lineWidth = 1
    for (let dy = -16; dy <= 14; dy += 4) {
      ctx.beginPath()
      ctx.moveTo(x - 14, y + dy)
      ctx.lineTo(x + 14, y + dy)
      ctx.stroke()
    }

    // Ghost firing tracers
    if (shooting) {
      ctx.fillStyle = 'rgba(0, 240, 255, 0.7)'
      ctx.fillRect(x - 1, y - 28, 2, 8)
      ctx.fillRect(x - 1, y - 44, 2, 8)
    }

    // "RECORD" tag above aircraft
    ctx.shadowBlur = 0
    ctx.fillStyle = '#38bdf8'
    ctx.font = "bold 8px 'Courier New', monospace"
    ctx.textAlign = 'center'
    ctx.fillText('RECORD', x, y - 22)

    ctx.restore()
  }
}
