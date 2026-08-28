import type { SkinId } from './SkinService'

export class PlayerSkinRenderer {
  render(
    ctx: CanvasRenderingContext2D,
    cx: number,
    cy: number,
    skinId: SkinId = 'classic',
    animFrame = 0,
    bankDir = 0
  ): void {
    ctx.save()

    // Slight banking tilt rotation (-6° to +6°)
    if (bankDir !== 0) {
      ctx.translate(cx, cy)
      ctx.rotate((bankDir * 6 * Math.PI) / 180)
      ctx.translate(-cx, -cy)
    }

    switch (skinId) {
      case 'stealth':
        this.renderStealth(ctx, cx, cy, animFrame)
        break
      case 'biplane':
        this.renderBiplane(ctx, cx, cy, animFrame)
        break
      case 'cyber_neon':
        this.renderCyberNeon(ctx, cx, cy, animFrame)
        break
      case 'classic':
      default:
        this.renderClassic(ctx, cx, cy, animFrame)
        break
    }

    ctx.restore()
  }

  // ─── CLASSIC 2600 FIGHTER ───────────────────────────────────────────────────
  private renderClassic(
    ctx: CanvasRenderingContext2D,
    cx: number,
    cy: number,
    animFrame: number
  ): void {
    // Swept wings
    for (const s of [-1, 1]) {
      ctx.fillStyle = '#eab308'
      ctx.beginPath()
      ctx.moveTo(cx + s * 2, cy - 2)
      ctx.lineTo(cx + s * 14, cy + 8)
      ctx.lineTo(cx + s * 14, cy + 11)
      ctx.lineTo(cx + s * 4, cy + 8)
      ctx.closePath()
      ctx.fill()

      // Wing highlight
      ctx.fillStyle = '#fde047'
      ctx.beginPath()
      ctx.moveTo(cx + s * 2, cy - 2)
      ctx.lineTo(cx + s * 14, cy + 8)
      ctx.lineTo(cx + s * 11, cy + 8)
      ctx.lineTo(cx + s * 2, cy)
      ctx.closePath()
      ctx.fill()

      // Wingtip red pod
      ctx.fillStyle = '#dc2626'
      ctx.fillRect(cx + s * 14 - 1, cy + 6, 2, 5)
    }

    // Rear tail fins
    ctx.fillStyle = '#ca8a04'
    for (const s of [-1, 1]) {
      ctx.beginPath()
      ctx.moveTo(cx + s * 1, cy + 9)
      ctx.lineTo(cx + s * 7, cy + 14)
      ctx.lineTo(cx + s * 3, cy + 14)
      ctx.lineTo(cx + s * 1, cy + 11)
      ctx.closePath()
      ctx.fill()
    }

    // Fuselage dart (nose up)
    ctx.fillStyle = '#facc15'
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

    // Port shade
    ctx.fillStyle = '#ca8a04'
    ctx.beginPath()
    ctx.moveTo(cx, cy - 17)
    ctx.lineTo(cx - 4, cy - 4)
    ctx.lineTo(cx - 4, cy + 10)
    ctx.lineTo(cx - 1, cy + 12)
    ctx.lineTo(cx - 1, cy - 8)
    ctx.closePath()
    ctx.fill()

    // Cockpit canopy (red classic)
    ctx.fillStyle = '#ef4444'
    ctx.beginPath()
    ctx.moveTo(cx, cy - 9)
    ctx.lineTo(cx - 2, cy - 3)
    ctx.lineTo(cx + 2, cy - 3)
    ctx.closePath()
    ctx.fill()

    ctx.fillStyle = '#ffffff'
    ctx.fillRect(cx - 1, cy - 8, 1, 2)

    // Afterburner exhaust
    const flameH = [4, 7, 5, 8][animFrame % 4]
    ctx.fillStyle = '#ff8800'
    ctx.fillRect(cx - 3, cy + 14, 6, flameH)
    ctx.fillStyle = '#fde047'
    ctx.fillRect(cx - 2, cy + 14, 4, flameH - 1)
  }

  // ─── STEALTH F-117 NIGHTHAWK ────────────────────────────────────────────────
  private renderStealth(
    ctx: CanvasRenderingContext2D,
    cx: number,
    cy: number,
    animFrame: number
  ): void {
    // Faceted stealth wings
    for (const s of [-1, 1]) {
      ctx.fillStyle = '#18181b'
      ctx.beginPath()
      ctx.moveTo(cx + s * 2, cy - 6)
      ctx.lineTo(cx + s * 15, cy + 9)
      ctx.lineTo(cx + s * 8, cy + 12)
      ctx.lineTo(cx + s * 3, cy + 8)
      ctx.closePath()
      ctx.fill()

      // Wing facet highlight
      ctx.fillStyle = '#27272a'
      ctx.beginPath()
      ctx.moveTo(cx + s * 2, cy - 6)
      ctx.lineTo(cx + s * 15, cy + 9)
      ctx.lineTo(cx + s * 12, cy + 9)
      ctx.lineTo(cx + s * 2, cy - 2)
      ctx.closePath()
      ctx.fill()

      // Neon purple edge strip
      ctx.fillStyle = '#a855f7'
      ctx.fillRect(cx + s * 14 - 1, cy + 7, 2, 4)
    }

    // V-tail fins
    ctx.fillStyle = '#3f3f46'
    for (const s of [-1, 1]) {
      ctx.beginPath()
      ctx.moveTo(cx + s * 2, cy + 8)
      ctx.lineTo(cx + s * 8, cy + 14)
      ctx.lineTo(cx + s * 4, cy + 15)
      ctx.closePath()
      ctx.fill()
    }

    // Diamond stealth fuselage
    ctx.fillStyle = '#09090b'
    ctx.beginPath()
    ctx.moveTo(cx, cy - 18)
    ctx.lineTo(cx - 5, cy - 2)
    ctx.lineTo(cx - 4, cy + 12)
    ctx.lineTo(cx + 4, cy + 12)
    ctx.lineTo(cx + 5, cy - 2)
    ctx.closePath()
    ctx.fill()

    // Spine facet
    ctx.fillStyle = '#27272a'
    ctx.beginPath()
    ctx.moveTo(cx, cy - 18)
    ctx.lineTo(cx - 1, cy + 12)
    ctx.lineTo(cx + 1, cy + 12)
    ctx.closePath()
    ctx.fill()

    // Violet sensor cockpit
    ctx.fillStyle = '#c084fc'
    ctx.beginPath()
    ctx.moveTo(cx, cy - 10)
    ctx.lineTo(cx - 2, cy - 4)
    ctx.lineTo(cx + 2, cy - 4)
    ctx.closePath()
    ctx.fill()

    // Purple ion flame
    const flameH = [5, 8, 6, 9][animFrame % 4]
    ctx.fillStyle = '#9333ea'
    ctx.fillRect(cx - 3, cy + 12, 6, flameH)
    ctx.fillStyle = '#c084fc'
    ctx.fillRect(cx - 1, cy + 12, 2, flameH - 2)
  }

  // ─── VINTAGE BIPLANE ────────────────────────────────────────────────────────
  private renderBiplane(
    ctx: CanvasRenderingContext2D,
    cx: number,
    cy: number,
    animFrame: number
  ): void {
    // Upper and lower wings (thick vintage wings)
    for (const s of [-1, 1]) {
      ctx.fillStyle = '#4d5c38'
      ctx.fillRect(cx + s * 2, cy - 4, s * 13, 7)

      // Wing struts
      ctx.fillStyle = '#78350f'
      ctx.fillRect(cx + s * 11, cy - 4, 2, 7)

      // Roundel insignia
      ctx.fillStyle = '#ef4444'
      ctx.beginPath()
      ctx.arc(cx + s * 9, cy - 0.5, 3, 0, Math.PI * 2)
      ctx.fill()
      ctx.fillStyle = '#ffffff'
      ctx.beginPath()
      ctx.arc(cx + s * 9, cy - 0.5, 1.5, 0, Math.PI * 2)
      ctx.fill()
    }

    // Fuselage
    ctx.fillStyle = '#3f4c2e'
    ctx.beginPath()
    ctx.moveTo(cx, cy - 15)
    ctx.lineTo(cx - 4, cy - 5)
    ctx.lineTo(cx - 3, cy + 13)
    ctx.lineTo(cx + 3, cy + 13)
    ctx.lineTo(cx + 4, cy - 5)
    ctx.closePath()
    ctx.fill()

    // Open cockpit & windshield
    ctx.fillStyle = '#713f12'
    ctx.fillRect(cx - 2, cy - 1, 4, 3)
    ctx.fillStyle = '#e0f2fe'
    ctx.fillRect(cx - 2, cy - 4, 4, 2)

    // Tail fin & horizontal stabilizer
    ctx.fillStyle = '#d97706'
    ctx.fillRect(cx - 7, cy + 11, 14, 3)

    // Nose propeller (spinning animation)
    const propAngle = (animFrame * 45 * Math.PI) / 180
    ctx.save()
    ctx.translate(cx, cy - 15)
    ctx.rotate(propAngle)
    ctx.fillStyle = '#fef08a'
    ctx.fillRect(-6, -1, 12, 2)
    ctx.fillStyle = '#713f12'
    ctx.beginPath()
    ctx.arc(0, 0, 2, 0, Math.PI * 2)
    ctx.fill()
    ctx.restore()

    // White smoke puff
    const puff = [3, 5, 4, 6][animFrame % 4]
    ctx.fillStyle = '#e2e8f0'
    ctx.beginPath()
    ctx.arc(cx, cy + 14 + puff / 2, puff / 2, 0, Math.PI * 2)
    ctx.fill()
  }

  // ─── CYBER NEON VIPER ───────────────────────────────────────────────────────
  private renderCyberNeon(
    ctx: CanvasRenderingContext2D,
    cx: number,
    cy: number,
    animFrame: number
  ): void {
    // Forward-swept neon wings
    for (const s of [-1, 1]) {
      ctx.fillStyle = '#0f172a'
      ctx.beginPath()
      ctx.moveTo(cx + s * 2, cy + 2)
      ctx.lineTo(cx + s * 16, cy - 5)
      ctx.lineTo(cx + s * 14, cy + 8)
      ctx.lineTo(cx + s * 3, cy + 10)
      ctx.closePath()
      ctx.fill()

      // Glowing cyan leading edge
      ctx.fillStyle = '#00f0ff'
      ctx.beginPath()
      ctx.moveTo(cx + s * 2, cy + 2)
      ctx.lineTo(cx + s * 16, cy - 5)
      ctx.lineTo(cx + s * 13, cy - 3)
      ctx.lineTo(cx + s * 2, cy + 4)
      ctx.closePath()
      ctx.fill()

      // Magenta laser wingtip
      ctx.fillStyle = '#ff007f'
      ctx.fillRect(cx + s * 16 - 1, cy - 7, 2, 6)
    }

    // Sleek cyber fuselage
    ctx.fillStyle = '#020617'
    ctx.beginPath()
    ctx.moveTo(cx, cy - 18)
    ctx.lineTo(cx - 4, cy - 3)
    ctx.lineTo(cx - 3, cy + 13)
    ctx.lineTo(cx + 3, cy + 13)
    ctx.lineTo(cx + 4, cy - 3)
    ctx.closePath()
    ctx.fill()

    // Center neon cyan spine
    ctx.fillStyle = '#00f0ff'
    ctx.fillRect(cx - 1, cy - 14, 2, 22)

    // Magenta cockpit canopy
    ctx.fillStyle = '#ff007f'
    ctx.beginPath()
    ctx.moveTo(cx, cy - 10)
    ctx.lineTo(cx - 2, cy - 4)
    ctx.lineTo(cx + 2, cy - 4)
    ctx.closePath()
    ctx.fill()

    // Dual plasma thrusters
    const flameH = [5, 9, 6, 10][animFrame % 4]
    ctx.fillStyle = '#00f0ff'
    ctx.fillRect(cx - 4, cy + 13, 3, flameH)
    ctx.fillRect(cx + 1, cy + 13, 3, flameH)
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(cx - 3, cy + 13, 1, flameH - 2)
    ctx.fillRect(cx + 2, cy + 13, 1, flameH - 2)
  }
}
