import type { HazardManager, SeaMine, Whirlpool, ShoreBunker } from './HazardManager'

export class HazardRenderer {
  render(
    ctx: CanvasRenderingContext2D,
    hazards: HazardManager,
    reducedMotion = false,
  ): void {
    this.renderWhirlpools(ctx, hazards.whirlpools, reducedMotion)
    this.renderMines(ctx, hazards.mines, reducedMotion)
    this.renderBunkers(ctx, hazards.bunkers)
  }

  private renderMines(
    ctx: CanvasRenderingContext2D,
    mines: ReadonlyArray<SeaMine>,
    reducedMotion: boolean,
  ): void {
    for (const mine of mines) {
      if (!mine.active) continue

      ctx.save()
      ctx.translate(mine.x, mine.y)

      const r = mine.width / 2

      // 1. Spikes (8 radial spikes)
      ctx.strokeStyle = '#ff3344'
      ctx.lineWidth = 2
      for (let i = 0; i < 8; i++) {
        const angle = (i * Math.PI) / 4 + (reducedMotion ? 0 : Math.sin(mine.pulseTimer * 0.5) * 0.1)
        const x1 = Math.cos(angle) * (r - 2)
        const y1 = Math.sin(angle) * (r - 2)
        const x2 = Math.cos(angle) * (r + 4)
        const y2 = Math.sin(angle) * (r + 4)

        ctx.beginPath()
        ctx.moveTo(x1, y1)
        ctx.lineTo(x2, y2)
        ctx.stroke()
      }

      // 2. Iron hull body
      ctx.fillStyle = '#1e242b'
      ctx.beginPath()
      ctx.arc(0, 0, r - 1, 0, Math.PI * 2)
      ctx.fill()

      ctx.fillStyle = '#3a4450'
      ctx.beginPath()
      ctx.arc(-2, -2, r * 0.55, 0, Math.PI * 2)
      ctx.fill()

      // 3. Flashing warning LED
      const isCritical = mine.chainExplodeTimer > 0
      const pulseRate = isCritical ? 20 : 4
      const pulseAlpha = reducedMotion
        ? 0.8
        : 0.4 + 0.6 * (0.5 + 0.5 * Math.sin(mine.pulseTimer * pulseRate))

      // globalAlpha instead of an `rgba(...)` template literal: this runs for
      // every live mine every frame and the project bans per-frame allocation.
      ctx.globalAlpha = pulseAlpha
      ctx.fillStyle = isCritical ? '#ffdc00' : '#ff1428'
      ctx.beginPath()
      ctx.arc(0, 0, 3.5, 0, Math.PI * 2)
      ctx.fill()

      ctx.restore()
    }
  }

  private renderWhirlpools(
    ctx: CanvasRenderingContext2D,
    whirlpools: ReadonlyArray<Whirlpool>,
    reducedMotion: boolean,
  ): void {
    for (const wp of whirlpools) {
      if (!wp.active) continue

      ctx.save()
      ctx.translate(wp.x, wp.y)

      const radius = wp.radius
      const baseAngle = reducedMotion ? 0 : wp.angle

      // Outer water depression gradient
      if (typeof ctx.createRadialGradient === 'function') {
        const grad = ctx.createRadialGradient(0, 0, 2, 0, 0, radius)
        grad.addColorStop(0, 'rgba(0, 16, 36, 0.75)')
        grad.addColorStop(0.6, 'rgba(0, 90, 160, 0.35)')
        grad.addColorStop(1, 'rgba(0, 140, 200, 0)')
        ctx.fillStyle = grad
      } else {
        ctx.fillStyle = 'rgba(0, 90, 160, 0.35)'
      }
      ctx.beginPath()
      ctx.arc(0, 0, radius, 0, Math.PI * 2)
      ctx.fill()

      // 3 Swirling foam arms
      ctx.lineWidth = 2.5
      for (let i = 0; i < 3; i++) {
        const armAngle = baseAngle + (i * Math.PI * 2) / 3
        ctx.strokeStyle = i % 2 === 0 ? 'rgba(210, 245, 255, 0.6)' : 'rgba(120, 215, 255, 0.4)'

        ctx.beginPath()
        for (let step = 0; step < 16; step++) {
          const t = step / 16
          const spiralR = radius * (1 - t * 0.8)
          const spiralA = armAngle + t * Math.PI * 1.5
          const sx = Math.cos(spiralA) * spiralR
          const sy = Math.sin(spiralA) * spiralR

          if (step === 0) ctx.moveTo(sx, sy)
          else ctx.lineTo(sx, sy)
        }
        ctx.stroke()
      }

      // Center void sinkhole
      ctx.fillStyle = '#000c1e'
      ctx.beginPath()
      ctx.arc(0, 0, 4, 0, Math.PI * 2)
      ctx.fill()

      ctx.restore()
    }
  }

  private renderBunkers(
    ctx: CanvasRenderingContext2D,
    bunkers: ReadonlyArray<ShoreBunker>,
  ): void {
    for (const bunker of bunkers) {
      if (!bunker.active) continue

      ctx.save()
      ctx.translate(bunker.x, bunker.y)

      const w = bunker.width
      const h = bunker.height
      const isFlash = bunker.damageFlashTimer > 0

      // 1. Concrete bunker base
      ctx.fillStyle = isFlash ? '#ffffff' : '#333e48'
      ctx.beginPath()
      if (typeof ctx.roundRect === 'function') {
        ctx.roundRect(-w / 2, -h / 2, w, h, 4)
      } else {
        ctx.rect(-w / 2, -h / 2, w, h)
      }
      ctx.fill()

      ctx.strokeStyle = isFlash ? '#ffffff' : '#1c242b'
      ctx.lineWidth = 2
      ctx.stroke()

      // Armor plating slits
      ctx.fillStyle = isFlash ? '#ffffff' : '#222b33'
      ctx.fillRect(-w / 2 + 3, -h / 2 + 3, w - 6, 3)

      // 2. Rotating Turret Dome
      ctx.fillStyle = isFlash ? '#ffffff' : '#5c6b77'
      ctx.beginPath()
      ctx.arc(0, 0, w * 0.35, 0, Math.PI * 2)
      ctx.fill()

      ctx.strokeStyle = isFlash ? '#ffffff' : '#2c353d'
      ctx.lineWidth = 1.5
      ctx.stroke()

      // 3. Twin Gun Barrels pointing along bunker.angle
      const barrelLen = 14
      const barrelSpread = 3
      const cosA = Math.cos(bunker.angle)
      const sinA = Math.sin(bunker.angle)
      const perpX = -sinA * barrelSpread
      const perpY = cosA * barrelSpread

      ctx.strokeStyle = isFlash ? '#ffffff' : '#15191d'
      ctx.lineWidth = 2.5

      // Left barrel
      ctx.beginPath()
      ctx.moveTo(perpX, perpY)
      ctx.lineTo(perpX + cosA * barrelLen, perpY + sinA * barrelLen)
      ctx.stroke()

      // Right barrel
      ctx.beginPath()
      ctx.moveTo(-perpX, -perpY)
      ctx.lineTo(-perpX + cosA * barrelLen, -perpY + sinA * barrelLen)
      ctx.stroke()

      // 4. Health pip indicators
      if (bunker.hp < bunker.maxHp) {
        const barW = w - 4
        const barH = 3
        const barX = -barW / 2
        const barY = -h / 2 - 6

        ctx.fillStyle = 'rgba(0, 0, 0, 0.6)'
        ctx.fillRect(barX, barY, barW, barH)

        const hpRatio = bunker.hp / bunker.maxHp
        ctx.fillStyle = hpRatio > 0.5 ? '#00e575' : '#ff3344'
        ctx.fillRect(barX, barY, barW * hpRatio, barH)
      }

      ctx.restore()
    }
  }
}
