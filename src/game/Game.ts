import { Player } from './Player'
import { World } from './World'
import { CollisionSystem } from './CollisionSystem'
import { UI } from './UI'
import { EnemyManager } from './EnemyManager'
import { FuelSystem } from './FuelSystem'
import { SoundManager } from './SoundManager'
import { Fx } from './Fx'
import { Scenery } from './Scenery'
import { readSecureNumber, writeSecureNumber } from './StorageService'
export type GameCallback = (score: number, highScore: number) => void

export class Game {
  private static readonly HIGH_SCORE_KEY = 'river-raid-highscore'

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
      this.togglePause()
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
    this.sound.startEngine()
    this.player.attachInput()
    this.lastTime = performance.now()
    this.loop(this.lastTime)
  }

  stop(): void {
    this.running = false
    this.sound.stopMusic()
    this.sound.stopEngine()
    this.player.detachInput()
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId)
      this.rafId = null
    }
  }

  public togglePause(): void {
    if (!this.running || this.gameOverTriggered) return
    this.paused = !this.paused
    if (this.paused) {
      this.sound.stopMusic()
    } else {
      this.lastTime = performance.now()
      this.sound.startMusic()
    }
  }

  public simulateKey(key: string, isDown: boolean): void {
    if (isDown) {
      this.player.keys.add(key)
    } else {
      this.player.keys.delete(key)
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
    const bounds = this.world.getBoundsAtY(this.player.y)
    this.player.resize(width, height, bounds.left, bounds.right)
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

    this.sound.updateEngine(speedMod)

    this.world.update(dt, this.scrollSpeed)

    const bounds = this.world.getBoundsAtY(this.player.y)
    this.player.update(dt, bounds.left, bounds.right)

    this.enemyManager.update(dt, this.world, this.world.segments, this.scrollSpeed)
    this.fuelSystem.update(dt, this.world, this.world.segments, this.scrollSpeed)
    this.scenery.update(dt, this.scrollSpeed, this.world, this.canvas.width)

    if (this.player.state === 'alive') {
      if (Math.random() < 0.3) {
        this.fx.smokeTrail(this.player.x, this.player.y + this.player.height / 2)
      }

      CollisionSystem.resolveCollisions({
        player: this.player,
        enemyManager: this.enemyManager,
        fuelSystem: this.fuelSystem,
        fx: this.fx,
        sound: this.sound,
        world: this.world,
        triggerGameOver: () => this.triggerGameOver(),
        addScore: (points) => {
          this.score += points
        },
      })

      if (this.player.justShot) {
        this.sound.shoot()
        this.player.justShot = false
      }

      if (this.fuelSystem.fuel < 20) {
        this.fuelFlashTimer += dt
        if (this.fuelFlashTimer > 0.8) {
          this.fuelFlashTimer = 0
          this.fx.flash('#ff2200', 0.15)
          this.sound.lowFuelBeep()
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

    this.ctx.save()
    if (this.fx.shakeX !== 0 || this.fx.shakeY !== 0) {
      this.ctx.translate(this.fx.shakeX, this.fx.shakeY)
    }

    this.world.render(this.ctx)
    this.scenery.render(this.ctx)
    this.fuelSystem.render(this.ctx)
    this.enemyManager.render(this.ctx)
    this.player.render(this.ctx)
    this.fx.render(this.ctx)

    this.ctx.restore()

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
    this.fx.addShake(15, 0.6)
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
    return readSecureNumber(Game.HIGH_SCORE_KEY, 0)
  }

  private saveHighScore(): void {
    try {
      const current = this.getHighScore()
      if (this.score > current) {
        writeSecureNumber(Game.HIGH_SCORE_KEY, this.score)
      }
    } catch {
      // ignore
    }
  }
}
