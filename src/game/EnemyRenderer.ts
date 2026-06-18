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
        case 'plane': this.renderPlane(ctx, e, gameTime); break
        case 'boat': this.renderBoat(ctx, e, gameTime); break
        case 'bridge': this.renderBridge(ctx, e); break
        case 'tank': this.renderTank(ctx, e); break
        case 'gunboat': this.renderGunboat(ctx, e, gameTime); break
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

  // Top-down attack helicopter — fuselage facing the player, spinning rotor disc.
  private renderHelicopter(ctx: CanvasRenderingContext2D, e: Enemy, gameTime: number): void {
    const cx = e.x
    const cy = e.y

    // Landing skids
    ctx.fillStyle = '#444444'
    ctx.fillRect(cx - 8, cy - 2, 1, 11)
    ctx.fillRect(cx + 7, cy - 2, 1, 11)

    // Tail boom (rear = up) + fin
    ctx.fillStyle = '#7a1414'
    ctx.fillRect(cx - 2, cy - 13, 4, 9)
    ctx.fillStyle = '#cc2222'
    ctx.fillRect(cx - 5, cy - 14, 10, 3)
    ctx.fillStyle = '#e8e8e8'                // tail rotor
    ctx.fillRect(cx + 4, cy - 14, 2, 5)

    // Fuselage body with top highlight / bottom shade
    ctx.fillStyle = '#cc2222'
    ctx.fillRect(cx - 6, cy - 6, 12, 13)
    ctx.fillStyle = '#ef4444'
    ctx.fillRect(cx - 6, cy - 6, 12, 3)
    ctx.fillStyle = '#8a1717'
    ctx.fillRect(cx - 6, cy + 4, 12, 3)
    // Nose taper (front = down)
    ctx.fillStyle = '#cc2222'
    ctx.fillRect(cx - 4, cy + 7, 8, 2)
    ctx.fillRect(cx - 2, cy + 9, 4, 2)

    // Cockpit canopy
    ctx.fillStyle = '#bfe3ff'
    ctx.fillRect(cx - 3, cy + 1, 6, 4)
    ctx.fillStyle = '#7fb8e0'
    ctx.fillRect(cx - 3, cy + 1, 6, 1)

    // Muzzle flash when armed
    if ('canShoot' in e && e.canShoot) {
      ctx.fillStyle = '#ffcc33'
      ctx.fillRect(cx - 1, cy + 10, 2, 3)
    }

    // Spinning main rotor — motion-blur disc + two blades
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
    ctx.fillStyle = '#333333'
    ctx.fillRect(cx - 1, cy - 2, 2, 2)
    ctx.restore()
  }

  // Top-down fighter jet — swept delta wings, afterburner, twin tail.
  private renderPlane(ctx: CanvasRenderingContext2D, e: Enemy, gameTime: number): void {
    const cx = e.x
    const cy = e.y
    const hh = e.height / 2
    const hw = e.width / 2

    // Afterburner glow (rear = up), flickering
    ctx.save()
    ctx.globalAlpha = 0.55 + 0.45 * Math.abs(Math.sin(gameTime * 28 + cx))
    ctx.fillStyle = '#ff9a3c'
    ctx.fillRect(cx - 2, cy - hh - 3, 4, 4)
    ctx.fillStyle = '#ffe08a'
    ctx.fillRect(cx - 1, cy - hh - 2, 2, 3)
    ctx.restore()

    // Swept delta wings (root near nose, tips swept back)
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

    // Fuselage dart (nose = down)
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
    // Spine highlight
    ctx.fillStyle = '#b18ce0'
    ctx.fillRect(cx - 1, cy - hh + 4, 2, e.height - 9)

    // Twin tail fins (rear)
    ctx.fillStyle = '#5e3a86'
    ctx.fillRect(cx - 4, cy - hh + 1, 2, 5)
    ctx.fillRect(cx + 2, cy - hh + 1, 2, 5)

    // Cockpit canopy
    ctx.fillStyle = '#cfe8ff'
    ctx.fillRect(cx - 2, cy - 1, 4, 6)
    ctx.fillStyle = '#8fc0ee'
    ctx.fillRect(cx - 2, cy + 4, 4, 1)

    if ('canShoot' in e && e.canShoot) {
      ctx.fillStyle = '#ffcc33'
      ctx.fillRect(cx - 1, cy + hh - 1, 2, 3)
    }
  }

  // Top-down patrol boat — pointed bow, cabin, animated foam wake.
  private renderBoat(ctx: CanvasRenderingContext2D, e: Enemy, gameTime: number): void {
    const cx = e.x
    const cy = e.y
    const hw = e.width / 2
    const hh = e.height / 2

    // Foam wake behind the stern (top)
    ctx.save()
    const wob = Math.sin(gameTime * 6 + cx) * 1
    ctx.globalAlpha = 0.5
    ctx.fillStyle = '#dff0ff'
    ctx.fillRect(cx - hw + 3, cy - hh - 3 + wob, e.width - 6, 2)
    ctx.globalAlpha = 0.3
    ctx.fillRect(cx - 2, cy - hh - 5, 4, 3)
    ctx.restore()

    // Hull (bow = down)
    ctx.fillStyle = '#4f7fc0'
    ctx.beginPath()
    ctx.moveTo(cx, cy + hh)
    ctx.lineTo(cx - hw + 2, cy)
    ctx.lineTo(cx - hw + 3, cy - hh)
    ctx.lineTo(cx + hw - 3, cy - hh)
    ctx.lineTo(cx + hw - 2, cy)
    ctx.closePath()
    ctx.fill()
    // Port-side shade
    ctx.fillStyle = '#34568f'
    ctx.beginPath()
    ctx.moveTo(cx, cy + hh)
    ctx.lineTo(cx - hw + 2, cy)
    ctx.lineTo(cx - 1, cy)
    ctx.closePath()
    ctx.fill()
    // Deck rail highlight
    ctx.fillStyle = '#7fa6d8'
    ctx.fillRect(cx - hw + 4, cy - hh + 1, e.width - 8, 2)

    // Cabin + red mast light
    ctx.fillStyle = '#e8eef7'
    ctx.fillRect(cx - 3, cy - 3, 6, 6)
    ctx.fillStyle = '#9bb1cf'
    ctx.fillRect(cx - 3, cy + 1, 6, 2)
    ctx.fillStyle = '#cc3333'
    ctx.fillRect(cx - 1, cy - 5, 2, 2)
  }

  // Steel truss bridge — planks, diagonal trusses, riveted rails.
  private renderBridge(ctx: CanvasRenderingContext2D, e: Enemy): void {
    const left = e.x - e.width / 2
    const top = e.y - e.height / 2
    const w = e.width
    const h = e.height

    // Deck + plank shading
    ctx.fillStyle = '#6e4a2c'
    ctx.fillRect(left, top, w, h)
    ctx.fillStyle = '#5a3a1f'
    for (let px = left; px < left + w; px += 8) {
      ctx.fillRect(px, top, 1, h)
    }

    // Diagonal truss work (X pattern)
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

    // Steel rails + rivets
    ctx.fillStyle = '#9a7a5a'
    ctx.fillRect(left, top, w, 3)
    ctx.fillRect(left, top + h - 3, w, 3)
    ctx.fillStyle = '#caa884'
    for (let px = left + 4; px < left + w; px += 16) {
      ctx.fillRect(px, top + 1, 1, 1)
      ctx.fillRect(px, top + h - 2, 1, 1)
    }
  }

  // Top-down tank — segmented treads, rotating turret, barrel toward player.
  private renderTank(ctx: CanvasRenderingContext2D, e: Enemy): void {
    const cx = e.x
    const cy = e.y
    const hw = e.width / 2
    const hh = e.height / 2

    // Treads (left/right) with segment highlights
    ctx.fillStyle = '#1f3a1a'
    ctx.fillRect(cx - hw, cy - hh, 4, e.height)
    ctx.fillRect(cx + hw - 4, cy - hh, 4, e.height)
    ctx.fillStyle = '#346b2a'
    for (let ty = cy - hh + 1; ty < cy + hh - 1; ty += 3) {
      ctx.fillRect(cx - hw, ty, 4, 1)
      ctx.fillRect(cx + hw - 4, ty, 4, 1)
    }

    // Hull with top highlight / bottom shade
    ctx.fillStyle = '#3f8f3f'
    ctx.fillRect(cx - hw + 4, cy - hh + 1, e.width - 8, e.height - 2)
    ctx.fillStyle = '#57b357'
    ctx.fillRect(cx - hw + 4, cy - hh + 1, e.width - 8, 2)
    ctx.fillStyle = '#2a5f24'
    ctx.fillRect(cx - hw + 4, cy + hh - 3, e.width - 8, 2)

    // Barrel (toward player = down) + turret dome
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
  }

  // Top-down armoured gunboat — heavier hull, deck turret, foam wake.
  private renderGunboat(ctx: CanvasRenderingContext2D, e: Enemy, gameTime: number): void {
    const cx = e.x
    const cy = e.y
    const hw = e.width / 2
    const hh = e.height / 2

    // Foam wake
    ctx.save()
    ctx.globalAlpha = 0.5
    ctx.fillStyle = '#dffaff'
    ctx.fillRect(cx - hw + 3, cy - hh - 3 + Math.sin(gameTime * 5 + cx), e.width - 6, 2)
    ctx.restore()

    // Hull (bow = down)
    ctx.fillStyle = '#2f8fa8'
    ctx.beginPath()
    ctx.moveTo(cx, cy + hh)
    ctx.lineTo(cx - hw + 2, cy - 2)
    ctx.lineTo(cx - hw + 4, cy - hh)
    ctx.lineTo(cx + hw - 4, cy - hh)
    ctx.lineTo(cx + hw - 2, cy - 2)
    ctx.closePath()
    ctx.fill()
    // Deck highlight + waterline shade
    ctx.fillStyle = '#5fc3da'
    ctx.fillRect(cx - hw + 5, cy - hh + 1, e.width - 10, 2)
    ctx.fillStyle = '#1f6072'
    ctx.fillRect(cx - hw + 4, cy + hh - 4, e.width - 8, 2)

    // Barrel + turret
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
