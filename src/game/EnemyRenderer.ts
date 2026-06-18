import type { Enemy, EnemyBullet, EnemyType } from './EnemyManager'

// Distinct initial per enemy type — a shape/text cue independent of colour,
// drawn over each enemy when colourblind mode is enabled.
const TYPE_INITIAL: Record<EnemyType, string> = {
  helicopter: 'H',
  plane: 'P',
  boat: 'B',
  bridge: 'X',
  tank: 'T',
  gunboat: 'G',
}

export class EnemyRenderer {
  render(ctx: CanvasRenderingContext2D, enemies: Enemy[], bullets: EnemyBullet[], gameTime: number, colorblind = false): void {
    // Single dispatch loop — each enemy draws independently, so no need to
    // group by type into a per-frame Map (avoids GC churn in this hot path).
    for (const e of enemies) {
      if (!e.active) continue
      switch (e.type) {
        case 'helicopter': this.renderHelicopter(ctx, e, gameTime); break
        case 'plane': this.renderPlane(ctx, e); break
        case 'boat': this.renderBoat(ctx, e); break
        case 'bridge': this.renderBridge(ctx, e); break
        case 'tank': this.renderTank(ctx, e); break
        case 'gunboat': this.renderGunboat(ctx, e); break
      }
    }

    if (colorblind) {
      ctx.font = 'bold 11px "Courier New", monospace'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      for (const e of enemies) {
        if (!e.active || e.type === 'bridge') continue
        const label = TYPE_INITIAL[e.type]
        const y = e.y - e.height / 2 - 7
        ctx.fillStyle = '#000000'
        ctx.fillText(label, e.x + 1, y + 1)
        ctx.fillStyle = '#ffffff'
        ctx.fillText(label, e.x, y)
      }
    }

    ctx.fillStyle = '#cc44ff'
    for (const bullet of bullets) {
      if (!bullet.active) continue
      if (bullet.fromPlane) {
        ctx.fillRect(bullet.x - bullet.width / 2, bullet.y, bullet.width, bullet.height)
      }
    }
    ctx.fillStyle = '#ee88ff'
    for (const bullet of bullets) {
      if (!bullet.active) continue
      if (bullet.fromPlane) {
        ctx.fillRect(bullet.x - 1, bullet.y, 2, bullet.height * 0.5)
      }
    }
    ctx.fillStyle = '#ff4444'
    for (const bullet of bullets) {
      if (!bullet.active) continue
      if (!bullet.fromPlane) {
        ctx.fillRect(bullet.x - bullet.width / 2, bullet.y, bullet.width, bullet.height)
      }
    }
    ctx.fillStyle = '#ff8888'
    for (const bullet of bullets) {
      if (!bullet.active) continue
      if (!bullet.fromPlane) {
        ctx.fillRect(bullet.x - 1, bullet.y, 2, bullet.height * 0.5)
      }
    }
  }

  private renderHelicopter(ctx: CanvasRenderingContext2D, e: Enemy, gameTime: number): void {
    const cx = e.x
    const cy = e.y
    ctx.fillStyle = '#cc2222'
    ctx.fillRect(cx - 10, cy - 4, 20, 8)
    ctx.fillStyle = '#aa1111'
    ctx.fillRect(cx - 4, cy - 8, 8, 4)
    ctx.fillStyle = '#ff4444'
    ctx.fillRect(cx + 8, cy - 2, 6, 4)
    ctx.fillStyle = '#dd3333'
    ctx.fillRect(cx - 14, cy - 1, 4, 2)
    const time = gameTime * 20
    const rotorWidth = 16 * Math.abs(Math.cos(time))
    ctx.strokeStyle = '#ff6666'
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.moveTo(cx - rotorWidth, cy - 4)
    ctx.lineTo(cx + rotorWidth, cy - 4)
    ctx.stroke()
    if ('canShoot' in e && e.canShoot) {
      ctx.fillStyle = '#ffaa00'
      ctx.fillRect(cx - 2, cy + 4, 4, 4)
    }
  }

  private renderPlane(ctx: CanvasRenderingContext2D, e: Enemy): void {
    const cx = e.x
    const cy = e.y
    ctx.fillStyle = '#8855bb'
    ctx.beginPath()
    ctx.moveTo(cx, cy + e.height / 2)
    ctx.lineTo(cx - e.width / 2, cy - e.height / 2)
    ctx.lineTo(cx - 4, cy - e.height / 2 + 6)
    ctx.lineTo(cx, cy - e.height / 2 + 4)
    ctx.lineTo(cx + 4, cy - e.height / 2 + 6)
    ctx.lineTo(cx + e.width / 2, cy - e.height / 2)
    ctx.closePath()
    ctx.fill()
    ctx.fillStyle = '#6633aa'
    ctx.fillRect(cx - 12, cy + 2, 24, 4)
    ctx.fillStyle = '#aa77ee'
    ctx.fillRect(cx - 2, cy + 4, 4, 6)
    if ('canShoot' in e && e.canShoot) {
      ctx.fillStyle = '#ffaa00'
      ctx.fillRect(cx - 2, cy + e.height / 2, 4, 4)
    }
  }

  private renderBoat(ctx: CanvasRenderingContext2D, e: Enemy): void {
    const cx = e.x
    const cy = e.y
    ctx.fillStyle = '#5588bb'
    ctx.beginPath()
    ctx.moveTo(cx - e.width / 2, cy - 2)
    ctx.lineTo(cx - e.width / 2 + 4, cy + e.height / 2)
    ctx.lineTo(cx + e.width / 2 - 4, cy + e.height / 2)
    ctx.lineTo(cx + e.width / 2, cy - 2)
    ctx.closePath()
    ctx.fill()
    ctx.fillStyle = '#3366aa'
    ctx.fillRect(cx - 2, cy - e.height / 2, 4, e.height * 0.6)
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(cx - 1, cy - e.height / 2 + 2, 2, 4)
  }

  private renderBridge(ctx: CanvasRenderingContext2D, e: Enemy): void {
    const left = e.x - e.width / 2
    const top = e.y - e.height / 2
    ctx.fillStyle = '#7a5a3a'
    ctx.fillRect(left, top, e.width, e.height)
    ctx.fillStyle = '#5a3a1a'
    const pillarSpacing = 10
    for (let px = left; px < left + e.width; px += pillarSpacing) {
      ctx.fillRect(px, top, 3, e.height)
    }
    ctx.fillStyle = '#9a7a5a'
    ctx.fillRect(left, top, e.width, 3)
    ctx.fillRect(left, top + e.height - 3, e.width, 3)
  }

  private renderTank(ctx: CanvasRenderingContext2D, e: Enemy): void {
    const left = e.x - e.width / 2
    const top = e.y - e.height / 2
    ctx.fillStyle = '#2f7f2f'
    ctx.fillRect(left, top, e.width, e.height)
    ctx.fillStyle = '#7fcf7f'
    ctx.fillRect(e.x - 5, top - 4, 10, 4)
    ctx.fillStyle = '#1f4f1f'
    ctx.fillRect(e.x - 1, top - 8, 2, 8)
  }

  private renderGunboat(ctx: CanvasRenderingContext2D, e: Enemy): void {
    const cx = e.x
    const cy = e.y
    ctx.fillStyle = '#2f7f9f'
    ctx.beginPath()
    ctx.moveTo(cx - e.width / 2, cy - 1)
    ctx.lineTo(cx - e.width / 2 + 4, cy + e.height / 2)
    ctx.lineTo(cx + e.width / 2 - 4, cy + e.height / 2)
    ctx.lineTo(cx + e.width / 2, cy - 1)
    ctx.closePath()
    ctx.fill()
    ctx.fillStyle = '#8fdfff'
    ctx.fillRect(cx - 3, cy - e.height / 2, 6, 5)
  }
}
