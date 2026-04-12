import { Player } from './Player'
import { World } from './World'
import { CollisionSystem } from './CollisionSystem'
import { UI } from './UI'
import { EnemyManager } from './EnemyManager'
import { FuelSystem } from './FuelSystem'
import { SoundManager } from './SoundManager'
import { Fx } from './Fx'
import { Scenery } from './Scenery'
import type { Rect } from './CollisionSystem'

export type GameCallback = (score: number, highScore: number) => void
export interface RankingEntry {
  name: string
  score: number
  date: string
}

const RANKING_KEY = 'river-raid-ranking'

export function getStoredRanking(): RankingEntry[] {
  try {
    const parsed = JSON.parse(localStorage.getItem(RANKING_KEY) || '[]') as RankingEntry[]
    return parsed
      .filter((entry) => entry && typeof entry.name === 'string' && typeof entry.score === 'number')
      .sort((a, b) => b.score - a.score)
      .slice(0, 10)
  } catch {
    return []
  }
}

export function qualifiesForRanking(score: number): boolean {
  const ranking = getStoredRanking()
  return ranking.length < 10 || score > ranking[ranking.length - 1].score
}

export function saveStoredRankingEntry(entry: RankingEntry): RankingEntry[] {
  const ranking = [...getStoredRanking(), entry]
    .sort((a, b) => b.score - a.score)
    .slice(0, 10)
  localStorage.setItem(RANKING_KEY, JSON.stringify(ranking))
  return ranking
}

const ENEMY_COLORS: Record<string, string> = {
  helicopter: '#ff4444',
  plane: '#aa66ee',
  boat: '#5588bb',
  bridge: '#aa7744',
}

export class Game {
  private canvas: HTMLCanvasElement
  private ctx: CanvasRenderingContext2D
  private rafId: number | null = null
  private lastTime = 0
  private running = false
  private paused = false

  player: Player
  world: World
  ui: UI
  enemyManager: EnemyManager
  fuelSystem: FuelSystem
  sound: SoundManager
  fx: Fx
  scenery: Scenery

  score = 0
  gameTime = 0
  scrollSpeed = 120
  private onGameOver: GameCallback | null = null
  private gameOverTriggered = false

  private fuelFlashTimer = 0

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas
    const ctx = canvas.getContext('2d')
    if (!ctx) throw new Error('Could not get 2D context')
    this.ctx = ctx

    this.player = new Player(canvas.width, canvas.height)
    this.world = new World(canvas.width, canvas.height)
    this.ui = new UI()
    this.enemyManager = new EnemyManager(canvas.width, canvas.height)
    this.fuelSystem = new FuelSystem(canvas.width, canvas.height)
    this.sound = new SoundManager()
    this.fx = new Fx()
    this.scenery = new Scenery(canvas.width, canvas.height)

    this.bindGlobalInput()
  }

  private globalKeyHandler = (e: KeyboardEvent): void => {
    if (e.key === 'p' || e.key === 'P' || e.key === 'Escape') {
      if (this.running && !this.gameOverTriggered) {
        this.paused = !this.paused
        if (this.paused) {
          this.sound.stopMusic()
        } else {
          this.sound.startMusic()
        }
      }
    }
    if (e.key === 'm' || e.key === 'M') {
      this.sound.toggleMute()
    }
  }

  private bindGlobalInput(): void {
    window.addEventListener('keydown', this.globalKeyHandler)
  }

  setOnGameOver(cb: GameCallback): void {
    this.onGameOver = cb
  }

  start(): void {
    if (this.running) return
    this.running = true
    this.gameOverTriggered = false
    this.paused = false
    this.sound.init()
    this.sound.resume()
    this.sound.startMusic()
    this.player.attachInput()
    this.lastTime = performance.now()
    this.loop(this.lastTime)
  }

  stop(): void {
    this.running = false
    this.sound.stopMusic()
    this.player.detachInput()
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId)
      this.rafId = null
    }
  }

  destroy(): void {
    this.stop()
    window.removeEventListener('keydown', this.globalKeyHandler)
    this.sound.destroy()
  }

  restart(): void {
    this.stop()
    this.score = 0
    this.gameTime = 0
    this.scrollSpeed = 120
    this.player.reset(this.canvas.width, this.canvas.height)
    this.world.reset(this.canvas.width, this.canvas.height)
    this.enemyManager.reset(this.canvas.width, this.canvas.height)
    this.fuelSystem.reset(this.canvas.width, this.canvas.height)
    this.fx.reset()
    this.scenery.reset(this.canvas.width, this.canvas.height)
    this.fuelFlashTimer = 0
    this.start()
  }

  resize(width: number, height: number): void {
    this.canvas.width = width
    this.canvas.height = height
    this.world.canvasWidth = width
    this.world.canvasHeight = height
    this.enemyManager.setCanvasHeight(height)
    this.fuelSystem.setCanvasHeight(height)
    this.scenery.setCanvasHeight(height)
  }

  private loop = (timestamp: number): void => {
    if (!this.running) return

    const dt = Math.min((timestamp - this.lastTime) / 1000, 0.05)
    this.lastTime = timestamp

    if (!this.paused) {
      this.update(dt)
    }
    this.render()

    this.rafId = requestAnimationFrame(this.loop)
  }

  private update(dt: number): void {
    if (this.player.state === 'dead') {
      this.fx.update(dt)
      return
    }

    this.gameTime += dt
    const baseSpeed = Math.min(200, 120 + this.gameTime * 0.4)

    // Vertical input modulates scroll speed (up = faster, down = slower)
    let speedMod = 1.0
    if (this.player.keys.has('ArrowUp')) speedMod = 1.4
    if (this.player.keys.has('ArrowDown')) speedMod = 0.4
    this.scrollSpeed = baseSpeed * speedMod

    this.world.update(dt, this.scrollSpeed)

    const bounds = this.world.getBoundsAtY(this.player.y)
    this.player.update(dt, bounds.left, bounds.right)

    this.enemyManager.update(dt, this.world, this.world.segments, this.scrollSpeed)
    this.fuelSystem.update(dt, this.world, this.world.segments, this.scrollSpeed)
    this.scenery.update(dt, this.scrollSpeed, this.world, this.canvas.width)

    if (this.player.state === 'alive') {
      const playerRect: Rect = {
        x: this.player.x,
        y: this.player.y,
        width: this.player.width,
        height: this.player.height,
      }

      if (this.world.isOutOfBounds(this.player.x, this.player.y, this.player.width / 2)) {
        this.player.explode()
        this.fx.explosion(this.player.x, this.player.y, '#ff4400')
        this.fx.flash('#ff0000', 0.4)
        this.sound.explosion()
        this.triggerGameOver()
        return
      }

      for (const enemy of this.enemyManager.enemies) {
        if (!enemy.active) continue
        const enemyRect: Rect = { x: enemy.x, y: enemy.y, width: enemy.width, height: enemy.height }
        if (CollisionSystem.checkAABB(playerRect, enemyRect)) {
          this.fx.explosion(enemy.x, enemy.y, ENEMY_COLORS[enemy.type] || '#ffffff')
          this.player.explode()
          this.fx.flash('#ff0000', 0.4)
          enemy.active = false
          this.sound.explosion()
          this.triggerGameOver()
          return
        }
      }

      for (const bullet of this.enemyManager.bullets) {
        if (!bullet.active) continue
        const bulletRect: Rect = { x: bullet.x, y: bullet.y, width: bullet.width, height: bullet.height }
        if (CollisionSystem.checkAABB(playerRect, bulletRect)) {
          this.player.explode()
          this.fx.explosion(this.player.x, this.player.y, '#ff4400')
          this.fx.flash('#ff0000', 0.4)
          bullet.active = false
          this.sound.explosion()
          this.triggerGameOver()
          return
        }
      }

      for (const bullet of this.player.bullets) {
        if (!bullet.active) continue
        const bulletRect: Rect = {
          x: bullet.x,
          y: bullet.y,
          width: bullet.width,
          height: bullet.height,
        }
        for (const enemy of this.enemyManager.enemies) {
          if (!enemy.active) continue
          const enemyRect: Rect = {
            x: enemy.x,
            y: enemy.y,
            width: enemy.width,
            height: enemy.height,
          }
          if (CollisionSystem.checkAABB(bulletRect, enemyRect)) {
            bullet.active = false
            const color = ENEMY_COLORS[enemy.type] || '#ffffff'
            this.fx.explosion(enemy.x, enemy.y, color)
            this.fx.scorePopup(enemy.x, enemy.y - 15, `+${enemy.points}`)
            if (enemy.type === 'bridge' && Math.random() < 0.5) {
              this.fuelSystem.spawnAt(enemy.x, enemy.y)
            }
            enemy.active = false
            this.score += enemy.points
            this.sound.enemyHit()
            break
          }
        }
      }
      if (this.player.justShot) {
        this.sound.shoot()
        this.player.justShot = false
      }

      if (this.fuelSystem.checkPickup(playerRect)) {
        this.sound.fuelCollect()
      }

      if (this.fuelSystem.fuel < 20) {
        this.fuelFlashTimer += dt
        if (this.fuelFlashTimer > 0.8) {
          this.fuelFlashTimer = 0
          this.fx.flash('#ff2200', 0.15)
        }
      }

      if (this.fuelSystem.isOutOfFuel()) {
        this.player.explode()
        this.fx.explosion(this.player.x, this.player.y, '#ff4400')
        this.fx.flash('#ff0000', 0.4)
        this.sound.explosion()
        this.triggerGameOver()
        return
      }
    }

    this.fx.update(dt)
  }

  private render(): void {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height)
    this.world.render(this.ctx)
    this.scenery.render(this.ctx)
    this.fuelSystem.render(this.ctx)
    this.enemyManager.render(this.ctx)
    this.player.render(this.ctx)
    this.fx.render(this.ctx)
    this.ui.render(
      this.ctx, this.score, this.fuelSystem.fuel, this.canvas.width,
      this.sound.isMuted(), this.paused,
      {
        player: { x: this.player.x, y: this.player.y },
        segments: this.world.segments,
        enemies: this.enemyManager.enemies.filter((enemy) => enemy.active),
        fuelTanks: this.fuelSystem.tanks.filter((tank) => tank.active),
      },
    )
  }

  private triggerGameOver(): void {
    if (this.gameOverTriggered) return
    this.gameOverTriggered = true
    this.sound.gameOver()
    const isNewBest = this.score > this.getHighScore()
    if (isNewBest) {
      this.saveHighScore()
    }
    setTimeout(() => {
      this.onGameOver?.(this.score, this.getHighScore())
    }, 1200)
  }

  getHighScore(): number {
    try {
      return parseInt(localStorage.getItem('river-raid-highscore') || '0', 10)
    } catch {
      return 0
    }
  }

  private saveHighScore(): void {
    try {
      const current = this.getHighScore()
      if (this.score > current) {
        localStorage.setItem('river-raid-highscore', this.score.toString())
      }
    } catch {
      // ignore
    }
  }
}
