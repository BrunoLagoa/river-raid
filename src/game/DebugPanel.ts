import { BASE_SCROLL_SPEED } from './constants'

export class DebugPanel {
  private enabled = false
  private fps = 0
  private frameCount = 0
  private lastFpsUpdate = 0
  private lastFrameTime = 0
  private frameTimeHistory: number[] = []
  private maxFrameTimeHistory = 60

  private lastUpdateTime = 0
  private updateCount = 0

  private renderTime = 0
  private renderTimeHistory: number[] = []
  private maxRenderTimeHistory = 60

  private entityCounts: Record<string, number> = {}
  private scrollSpeed = BASE_SCROLL_SPEED
  private gameTime = 0
  private playerX = 0
  private playerY = 0

  toggle(): void {
    this.enabled = !this.enabled
  }

  isEnabled(): boolean {
    return this.enabled
  }

  onKeyDown(key: string): void {
    if (key === 'd' || key === 'D') {
      this.toggle()
    }
  }

  startFrame(): void {
    this.lastFrameTime = performance.now()
  }

  endFrame(): void {
    const now = performance.now()
    const frameTime = now - this.lastFrameTime

    this.frameTimeHistory.push(frameTime)
    if (this.frameTimeHistory.length > this.maxFrameTimeHistory) {
      this.frameTimeHistory.shift()
    }

    this.frameCount++
    if (now - this.lastFpsUpdate >= 1000) {
      this.fps = this.frameCount
      this.frameCount = 0
      this.lastFpsUpdate = now
    }
  }

  startUpdate(): number {
    this.lastUpdateTime = performance.now()
    this.updateCount++
    return this.lastUpdateTime
  }

  endUpdate(): void {
    this.updateCount = 0
  }

  startRender(): number {
    return performance.now()
  }

  endRender(startTime: number): void {
    this.renderTime = performance.now() - startTime
    this.renderTimeHistory.push(this.renderTime)
    if (this.renderTimeHistory.length > this.maxRenderTimeHistory) {
      this.renderTimeHistory.shift()
    }
  }

  updateMetrics(data: {
    entityCounts: Record<string, number>
    scrollSpeed: number
    gameTime: number
    playerX: number
    playerY: number
  }): void {
    this.entityCounts = { ...data.entityCounts }
    this.scrollSpeed = data.scrollSpeed
    this.gameTime = data.gameTime
    this.playerX = data.playerX
    this.playerY = data.playerY
  }

  render(ctx: CanvasRenderingContext2D, canvasWidth: number): void {
    if (!this.enabled) return

    const panelWidth = 150
    const panelHeight = 220
    const x = canvasWidth - panelWidth - 10
    const y = 60

    ctx.save()

    ctx.fillStyle = 'rgba(0, 0, 0, 0.75)'
    ctx.fillRect(x, y, panelWidth, panelHeight)

    ctx.strokeStyle = '#44ff44'
    ctx.lineWidth = 1
    ctx.strokeRect(x, y, panelWidth, panelHeight)

    ctx.font = 'bold 11px "Courier New", monospace'
    ctx.fillStyle = '#44ff44'
    ctx.textAlign = 'left'
    ctx.fillText('DEBUG PANEL', x + 8, y + 14)

    ctx.fillStyle = '#888888'
    ctx.fillText('Press D to toggle', x + 8, y + 26)

    let lineY = y + 42
    const lineHeight = 14

    const avgFrameTime = this.getAverage(this.frameTimeHistory)
    const avgRenderTime = this.getAverage(this.renderTimeHistory)
    const minFrameTime = this.getMin(this.frameTimeHistory)
    const maxFrameTime = this.getMax(this.frameTimeHistory)

    ctx.fillStyle = '#ffffff'
    ctx.fillText(`FPS: ${this.fps}`, x + 8, lineY)
    lineY += lineHeight

    ctx.fillStyle = '#aaaaaa'
    ctx.font = '10px "Courier New", monospace'
    ctx.fillText(`Frame: ${avgFrameTime.toFixed(1)}ms (${minFrameTime.toFixed(1)}-${maxFrameTime.toFixed(1)})`, x + 8, lineY)
    lineY += lineHeight

    ctx.fillText(`Render: ${avgRenderTime.toFixed(1)}ms`, x + 8, lineY)
    lineY += lineHeight + 4

    ctx.fillStyle = '#ffcc00'
    ctx.font = '11px "Courier New", monospace'
    ctx.fillText('Entities:', x + 8, lineY)
    lineY += lineHeight

    ctx.fillStyle = '#cccccc'
    ctx.font = '10px "Courier New", monospace'
    for (const [key, value] of Object.entries(this.entityCounts)) {
      ctx.fillText(`  ${key}: ${value}`, x + 8, lineY)
      lineY += lineHeight - 2
    }

    lineY += 4
    ctx.fillStyle = '#00ccff'
    ctx.font = '11px "Courier New", monospace'
    ctx.fillText('Game:', x + 8, lineY)
    lineY += lineHeight

    ctx.fillStyle = '#aaaaaa'
    ctx.font = '10px "Courier New", monospace'
    ctx.fillText(`  Time: ${this.gameTime.toFixed(1)}s`, x + 8, lineY)
    lineY += lineHeight - 2

    ctx.fillText(`  Speed: ${this.scrollSpeed.toFixed(0)} px/s`, x + 8, lineY)
    lineY += lineHeight - 2

    ctx.fillText(`  Player: (${this.playerX.toFixed(0)}, ${this.playerY.toFixed(0)})`, x + 8, lineY)

    ctx.restore()
  }

  private getAverage(arr: number[]): number {
    if (arr.length === 0) return 0
    return arr.reduce((a, b) => a + b, 0) / arr.length
  }

  private getMin(arr: number[]): number {
    if (arr.length === 0) return 0
    return Math.min(...arr)
  }

  private getMax(arr: number[]): number {
    if (arr.length === 0) return 0
    return Math.max(...arr)
  }

  reset(): void {
    this.fps = 0
    this.frameCount = 0
    this.frameTimeHistory = []
    this.renderTimeHistory = []
    this.entityCounts = {}
    this.updateCount = 0
    this.lastFpsUpdate = performance.now()
  }
}