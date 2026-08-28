import type { Enemy, EnemyBullet, EnemyType } from './EnemyTypes'
import { SpriteCache, type CanvasLike } from './SpriteCache'

const TYPE_INITIAL: Record<EnemyType, string> = {
  helicopter: 'H',
  plane: 'P',
  boat: 'B',
  bridge: 'X',
  tank: 'T',
  gunboat: 'G',
}

export class EnemyRenderer {
  private cache = SpriteCache.getInstance()

  private getSprite(type: EnemyType): CanvasLike | null {
    return this.cache.getEnemySprite(type)
  }

  render(ctx: CanvasRenderingContext2D, enemies: Enemy[], bullets: EnemyBullet[], gameTime: number, colorblind = false): void {
    for (const e of enemies) {
      if (!e.active) continue
      const sprite = this.getSprite(e.type)
      if (sprite) {
        ctx.drawImage(sprite, e.x - sprite.width / 2, e.y - sprite.height / 2)
      }
      this.renderAnimatedOverlay(ctx, e, gameTime)
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
    ctx.fillRect(0, 0, 1, 1)
    this.renderBullets(ctx, bullets, '#cc44ff', '#ee88ff', true)
    this.renderBullets(ctx, bullets, '#ff4444', '#ff8888', false)
  }

  private renderBullets(ctx: CanvasRenderingContext2D, bullets: EnemyBullet[], body: string, highlight: string, fromPlane: boolean): void {
    for (const b of bullets) {
      if (!b.active || b.fromPlane !== fromPlane) continue
      ctx.fillStyle = body
      ctx.fillRect(b.x - b.width / 2, b.y, b.width, b.height)
      ctx.fillStyle = highlight
      ctx.fillRect(b.x - 1, b.y, 2, b.height * 0.5)
    }
  }

  private renderAnimatedOverlay(ctx: CanvasRenderingContext2D, e: Enemy, gameTime: number): void {
    const cx = e.x
    const cy = e.y
    const hw = e.width / 2
    const hh = e.height / 2

    if (e.type === 'helicopter') {
      const t = gameTime * 18
      ctx.save()
      ctx.globalAlpha = 0.12
      ctx.fillStyle = '#dddddd'
      ctx.beginPath()
      ctx.arc(cx, cy - 1, 13, 0, Math.PI * 2)
      ctx.fill()
      ctx.globalAlpha = 1
      ctx.strokeStyle = '#f2f2f2'
      ctx.lineWidth = 2
      for (const a of [t, t + Math.PI / 2]) {
        const bx = Math.cos(a) * 13
        const by = Math.sin(a) * 13
        ctx.beginPath()
        ctx.moveTo(cx - bx, cy - 1 - by)
        ctx.lineTo(cx + bx, cy - 1 + by)
        ctx.stroke()
      }
      ctx.restore()
      return
    }

    if (e.type === 'plane') {
      ctx.save()
      ctx.globalAlpha = 0.55 + 0.45 * Math.abs(Math.sin(gameTime * 28 + cx))
      ctx.fillStyle = '#ff9a3c'
      ctx.fillRect(cx - 2, cy - hh - 3, 4, 4)
      ctx.fillStyle = '#ffe08a'
      ctx.fillRect(cx - 1, cy - hh - 2, 2, 3)
      ctx.restore()
      return
    }

    if (e.type === 'boat') {
      const wob = Math.sin(gameTime * 6 + cx) * 1
      ctx.save()
      ctx.globalAlpha = 0.5
      ctx.fillStyle = '#dff0ff'
      ctx.fillRect(cx - hw + 3, cy - hh - 3 + wob, e.width - 6, 2)
      ctx.globalAlpha = 0.3
      ctx.fillRect(cx - 2, cy - hh - 5, 4, 3)
      ctx.restore()
      return
    }

    if (e.type === 'gunboat') {
      ctx.save()
      ctx.globalAlpha = 0.5
      ctx.fillStyle = '#dffaff'
      ctx.fillRect(cx - hw + 3, cy - hh - 3 + Math.sin(gameTime * 5 + cx), e.width - 6, 2)
      ctx.restore()
    }
  }
}
