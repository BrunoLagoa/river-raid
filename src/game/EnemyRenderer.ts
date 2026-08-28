import type { BaseEnemy, Enemy, EnemyBullet, EnemyType } from './EnemyManager'
import { ENEMY_CONFIGS } from './EnemyManager'

const TYPE_INITIAL: Record<EnemyType, string> = {
  helicopter: 'H',
  plane: 'P',
  boat: 'B',
  bridge: 'X',
  tank: 'T',
  gunboat: 'G',
}

type CanvasLike = OffscreenCanvas | HTMLCanvasElement

export class EnemyRenderer {
  private spriteCache: Record<EnemyType, CanvasLike | null> = {
    helicopter: null, plane: null, boat: null, bridge: null, tank: null, gunboat: null,
  }

  private getSprite(type: EnemyType): CanvasLike | null {
    const cached = this.spriteCache[type]
    if (cached) return cached
    const cfg = ENEMY_CONFIGS[type]
    if (!cfg) return null
    let canvas: CanvasLike
    if (typeof OffscreenCanvas !== 'undefined') {
      canvas = new OffscreenCanvas(cfg.width + 4, cfg.height + 4)
    } else {
      canvas = document.createElement('canvas')
      canvas.width = cfg.width + 4
      canvas.height = cfg.height + 4
    }
    const ctx = canvas.getContext('2d')
    if (!ctx) return null
    ctx.translate(cfg.width / 2 + 2, cfg.height / 2 + 2)
    const dummyEnemy: BaseEnemy = { type, aiTier: 'basic', x: 0, y: 0, width: cfg.width, height: cfg.height, speed: 0, active: true, points: cfg.points }
    this.renderStaticBody(ctx as CanvasRenderingContext2D, dummyEnemy as Enemy, type)
    this.spriteCache[type] = canvas
    return canvas
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

  private renderStaticBody(ctx: CanvasRenderingContext2D, e: Enemy, type: EnemyType): void {
    const cx = e.x
    const cy = e.y
    const hw = e.width / 2
    const hh = e.height / 2

    if (type === 'helicopter') {
      ctx.fillStyle = '#444444'
      ctx.fillRect(cx - 8, cy - 2, 1, 11)
      ctx.fillRect(cx + 7, cy - 2, 1, 11)
      ctx.fillStyle = '#7a1414'
      ctx.fillRect(cx - 2, cy - 13, 4, 9)
      ctx.fillStyle = '#cc2222'
      ctx.fillRect(cx - 5, cy - 14, 10, 3)
      ctx.fillStyle = '#e8e8e8'
      ctx.fillRect(cx + 4, cy - 14, 2, 5)
      ctx.fillStyle = '#cc2222'
      ctx.fillRect(cx - 6, cy - 6, 12, 13)
      ctx.fillStyle = '#ef4444'
      ctx.fillRect(cx - 6, cy - 6, 12, 3)
      ctx.fillStyle = '#8a1717'
      ctx.fillRect(cx - 6, cy + 4, 12, 3)
      ctx.fillStyle = '#cc2222'
      ctx.fillRect(cx - 4, cy + 7, 8, 2)
      ctx.fillRect(cx - 2, cy + 9, 4, 2)
      ctx.fillStyle = '#bfe3ff'
      ctx.fillRect(cx - 3, cy + 1, 6, 4)
      ctx.fillStyle = '#7fb8e0'
      ctx.fillRect(cx - 3, cy + 1, 6, 1)
      if ('canShoot' in e && e.canShoot) {
        ctx.fillStyle = '#ffcc33'
        ctx.fillRect(cx - 1, cy + 10, 2, 3)
      }
      ctx.fillStyle = '#333333'
      ctx.fillRect(cx - 1, cy - 2, 2, 2)
      return
    }

    if (type === 'plane') {
      ctx.fillStyle = '#6633aa'
      for (const s of [-1, 1]) {
        ctx.beginPath()
        ctx.moveTo(cx + s * 1, cy - hh + 7)
        ctx.lineTo(cx + s * hw, cy + hh - 7)
        ctx.lineTo(cx + s * (hw - 3), cy + hh - 4)
        ctx.lineTo(cx + s * 2, cy - hh + 9)
        ctx.closePath()
        ctx.fill()
      }
      ctx.fillStyle = '#8855bb'
      ctx.beginPath()
      ctx.moveTo(cx, cy + hh)
      ctx.lineTo(cx - 4, cy + hh - 8)
      ctx.lineTo(cx - 4, cy - hh + 4)
      ctx.lineTo(cx, cy - hh)
      ctx.lineTo(cx + 4, cy - hh + 4)
      ctx.lineTo(cx + 4, cy + hh - 8)
      ctx.closePath()
      ctx.fill()
      ctx.fillStyle = '#b18ce0'
      ctx.fillRect(cx - 1, cy - hh + 4, 2, e.height - 9)
      ctx.fillStyle = '#5e3a86'
      ctx.fillRect(cx - 4, cy - hh + 1, 2, 5)
      ctx.fillRect(cx + 2, cy - hh + 1, 2, 5)
      ctx.fillStyle = '#cfe8ff'
      ctx.fillRect(cx - 2, cy - 1, 4, 6)
      ctx.fillStyle = '#8fc0ee'
      ctx.fillRect(cx - 2, cy + 4, 4, 1)
      if ('canShoot' in e && e.canShoot) {
        ctx.fillStyle = '#ffcc33'
        ctx.fillRect(cx - 1, cy + hh - 1, 2, 3)
      }
      return
    }

    if (type === 'boat') {
      ctx.fillStyle = '#4f7fc0'
      ctx.beginPath()
      ctx.moveTo(cx, cy + hh)
      ctx.lineTo(cx - hw + 2, cy)
      ctx.lineTo(cx - hw + 3, cy - hh)
      ctx.lineTo(cx + hw - 3, cy - hh)
      ctx.lineTo(cx + hw - 2, cy)
      ctx.closePath()
      ctx.fill()
      ctx.fillStyle = '#34568f'
      ctx.beginPath()
      ctx.moveTo(cx, cy + hh)
      ctx.lineTo(cx - hw + 2, cy)
      ctx.lineTo(cx - 1, cy)
      ctx.closePath()
      ctx.fill()
      ctx.fillStyle = '#7fa6d8'
      ctx.fillRect(cx - hw + 4, cy - hh + 1, e.width - 8, 2)
      ctx.fillStyle = '#e8eef7'
      ctx.fillRect(cx - 3, cy - 3, 6, 6)
      ctx.fillStyle = '#9bb1cf'
      ctx.fillRect(cx - 3, cy + 1, 6, 2)
      ctx.fillStyle = '#cc3333'
      ctx.fillRect(cx - 1, cy - 5, 2, 2)
      return
    }

    if (type === 'bridge') {
      const left = e.x - e.width / 2
      const top = e.y - e.height / 2
      const w = e.width
      const h = e.height
      ctx.fillStyle = '#6e4a2c'
      ctx.fillRect(left, top, w, h)
      ctx.fillStyle = '#5a3a1f'
      for (let px = left; px < left + w; px += 8) {
        ctx.fillRect(px, top, 1, h)
      }
      ctx.strokeStyle = '#8a6440'
      ctx.lineWidth = 1
      for (let px = left; px < left + w - 16; px += 16) {
        ctx.beginPath()
        ctx.moveTo(px + 1, top + 1)
        ctx.lineTo(px + 15, top + h - 1)
        ctx.moveTo(px + 15, top + 1)
        ctx.lineTo(px + 1, top + h - 1)
        ctx.stroke()
      }
      ctx.fillStyle = '#9a7a5a'
      ctx.fillRect(left, top, w, 3)
      ctx.fillRect(left, top + h - 3, w, 3)
      ctx.fillStyle = '#caa884'
      for (let px = left + 4; px < left + w; px += 16) {
        ctx.fillRect(px, top + 1, 1, 1)
        ctx.fillRect(px, top + h - 2, 1, 1)
      }
      return
    }

    if (type === 'tank') {
      ctx.fillStyle = '#1f3a1a'
      ctx.fillRect(cx - hw, cy - hh, 4, e.height)
      ctx.fillRect(cx + hw - 4, cy - hh, 4, e.height)
      ctx.fillStyle = '#346b2a'
      for (let ty = cy - hh + 1; ty < cy + hh - 1; ty += 3) {
        ctx.fillRect(cx - hw, ty, 4, 1)
        ctx.fillRect(cx + hw - 4, ty, 4, 1)
      }
      ctx.fillStyle = '#3f8f3f'
      ctx.fillRect(cx - hw + 4, cy - hh + 1, e.width - 8, e.height - 2)
      ctx.fillStyle = '#57b357'
      ctx.fillRect(cx - hw + 4, cy - hh + 1, e.width - 8, 2)
      ctx.fillStyle = '#2a5f24'
      ctx.fillRect(cx - hw + 4, cy + hh - 3, e.width - 8, 2)
      ctx.fillStyle = '#9aa89a'
      ctx.fillRect(cx - 1, cy + 2, 2, hh + 5)
      ctx.fillStyle = '#4fa84f'
      ctx.beginPath()
      ctx.arc(cx, cy, 4, 0, Math.PI * 2)
      ctx.fill()
      ctx.fillStyle = '#6fce6f'
      ctx.beginPath()
      ctx.arc(cx - 1, cy - 1, 1.5, 0, Math.PI * 2)
      ctx.fill()
      return
    }

    if (type === 'gunboat') {
      ctx.fillStyle = '#2f8fa8'
      ctx.beginPath()
      ctx.moveTo(cx, cy + hh)
      ctx.lineTo(cx - hw + 2, cy - 2)
      ctx.lineTo(cx - hw + 4, cy - hh)
      ctx.lineTo(cx + hw - 4, cy - hh)
      ctx.lineTo(cx + hw - 2, cy - 2)
      ctx.closePath()
      ctx.fill()
      ctx.fillStyle = '#5fc3da'
      ctx.fillRect(cx - hw + 5, cy - hh + 1, e.width - 10, 2)
      ctx.fillStyle = '#1f6072'
      ctx.fillRect(cx - hw + 4, cy + hh - 4, e.width - 8, 2)
      ctx.fillStyle = '#2a343a'
      ctx.fillRect(cx - 1, cy, 2, hh + 3)
      ctx.fillStyle = '#3a4a52'
      ctx.beginPath()
      ctx.arc(cx, cy, 4, 0, Math.PI * 2)
      ctx.fill()
      ctx.fillStyle = '#5a6a72'
      ctx.beginPath()
      ctx.arc(cx, cy - 1, 2, 0, Math.PI * 2)
      ctx.fill()
      if ('canShoot' in e && e.canShoot) {
        ctx.fillStyle = '#ffcc33'
        ctx.fillRect(cx - 1, cy + hh, 2, 3)
      }
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
