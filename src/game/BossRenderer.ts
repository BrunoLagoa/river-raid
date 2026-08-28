// ─── BossRenderer.ts ─────────────────────────────────────────────────────────
// Renders the Dreadnought Boss with pixel-art armor plating, rotating turrets,
// central reactor core glow, engine fire, and damage flash highlights.

import type { BossDreadnought } from './BossDreadnought'

export class BossRenderer {
  render(ctx: CanvasRenderingContext2D, boss: BossDreadnought): void {
    if (!boss.active) return

    ctx.save()
    ctx.translate(boss.x, boss.y)

    // 1. Engine Thrusters / Wake Fire
    if (boss.isAlive) {
      this.renderThrusters(ctx, boss.phase === 3)
    }

    // 2. Main Armored Hull
    const flash = boss.damageFlashTimer > 0
    this.renderHull(ctx, boss.width, boss.height, flash)

    // 3. Central Core (Exposed in Phase 2 & 3)
    if (boss.phase >= 2 && boss.isAlive) {
      this.renderCore(ctx, boss.phase === 3)
    }

    // 4. Rotating Turrets
    for (const t of boss.turrets) {
      if (!t.active) {
        // Destroyed turret stump
        ctx.fillStyle = '#222226'
        ctx.beginPath()
        ctx.arc(t.xOffset, t.yOffset, t.width / 2, 0, Math.PI * 2)
        ctx.fill()
        continue
      }

      this.renderTurret(ctx, t.xOffset, t.yOffset, t.angle, t.damageFlashTimer > 0)
    }

    ctx.restore()
  }

  private renderThrusters(ctx: CanvasRenderingContext2D, berserk: boolean): void {
    const flameH = berserk ? 32 + Math.random() * 12 : 18 + Math.random() * 8
    const flameColor = berserk ? '#ff2200' : '#ff8800'
    const coreColor = berserk ? '#ffff44' : '#ffffff'

    const engines = [-28, 28]
    for (const ex of engines) {
      // Outer flame
      ctx.fillStyle = flameColor
      ctx.beginPath()
      ctx.moveTo(ex - 8, -75)
      ctx.lineTo(ex + 8, -75)
      ctx.lineTo(ex, -75 - flameH)
      ctx.closePath()
      ctx.fill()

      // Inner flame
      ctx.fillStyle = coreColor
      ctx.beginPath()
      ctx.moveTo(ex - 4, -75)
      ctx.lineTo(ex + 4, -75)
      ctx.lineTo(ex, -75 - flameH * 0.6)
      ctx.closePath()
      ctx.fill()
    }
  }

  private renderHull(
    ctx: CanvasRenderingContext2D,
    w: number,
    h: number,
    flash: boolean
  ): void {
    const hw = w / 2
    const hh = h / 2

    // Armor base color
    ctx.fillStyle = flash ? '#ffffff' : '#3a4454'
    ctx.strokeStyle = flash ? '#ffffff' : '#1e2430'
    ctx.lineWidth = 2

    // Tapered Battleship Bow & Stern Hull
    ctx.beginPath()
    ctx.moveTo(0, hh)            // Bow tip pointing downward
    ctx.lineTo(hw, hh - 40)
    ctx.lineTo(hw - 4, -hh + 30)
    ctx.lineTo(hw - 14, -hh)
    ctx.lineTo(-hw + 14, -hh)
    ctx.lineTo(-hw + 4, -hh + 30)
    ctx.lineTo(-hw, hh - 40)
    ctx.closePath()
    ctx.fill()
    ctx.stroke()

    // Deck Armor Plates
    ctx.fillStyle = flash ? '#eef4ff' : '#4d5b6e'
    ctx.fillRect(-hw + 12, -hh + 20, w - 24, h - 55)

    // Bridge Tower Superstructure
    ctx.fillStyle = flash ? '#ffffff' : '#2a313d'
    ctx.fillRect(-18, -35, 36, 45)
    ctx.strokeStyle = '#62748c'
    ctx.lineWidth = 1.5
    ctx.strokeRect(-18, -35, 36, 45)

    // Metal Grid Deck Lines
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.25)'
    ctx.lineWidth = 1
    for (let y = -hh + 35; y < hh - 45; y += 18) {
      ctx.beginPath()
      ctx.moveTo(-hw + 16, y)
      ctx.lineTo(hw - 16, y)
      ctx.stroke()
    }
  }

  private renderCore(ctx: CanvasRenderingContext2D, berserk: boolean): void {
    const coreColor = berserk ? '#ff0044' : '#00ddff'
    const glowColor = berserk ? 'rgba(255, 0, 80, 0.4)' : 'rgba(0, 220, 255, 0.4)'

    // Pulsing reactor aura
    const pulse = 12 + Math.sin(Date.now() * 0.01) * 3
    ctx.fillStyle = glowColor
    ctx.beginPath()
    ctx.arc(0, 10, pulse + 6, 0, Math.PI * 2)
    ctx.fill()

    // Reactor Core Sphere
    ctx.fillStyle = coreColor
    ctx.beginPath()
    ctx.arc(0, 10, pulse, 0, Math.PI * 2)
    ctx.fill()

    // Core Highlight
    ctx.fillStyle = '#ffffff'
    ctx.beginPath()
    ctx.arc(-3, 7, pulse * 0.4, 0, Math.PI * 2)
    ctx.fill()
  }

  private renderTurret(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    angle: number,
    flash: boolean
  ): void {
    ctx.save()
    ctx.translate(x, y)

    // Base ring
    ctx.fillStyle = flash ? '#ffffff' : '#222730'
    ctx.beginPath()
    ctx.arc(0, 0, 9, 0, Math.PI * 2)
    ctx.fill()

    // Rotated Gun Barrel
    ctx.rotate(angle)
    ctx.fillStyle = flash ? '#ffffff' : '#556274'
    ctx.fillRect(0, -3, 14, 6)
    ctx.fillStyle = flash ? '#ffffff' : '#181b22'
    ctx.fillRect(8, -2, 6, 4)

    // Center Dome
    ctx.fillStyle = flash ? '#ffffff' : '#3f4957'
    ctx.beginPath()
    ctx.arc(0, 0, 6, 0, Math.PI * 2)
    ctx.fill()

    ctx.restore()
  }
}
