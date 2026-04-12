import { Player } from './Player'
import { World } from './World'
import { CollisionSystem } from './CollisionSystem'
import { UI } from './UI'
import { EnemyManager } from './EnemyManager'
import { FuelSystem } from './FuelSystem'
import { PowerUpSystem } from './PowerUpSystem'
import { SoundManager } from './SoundManager'
import { Fx } from './Fx'
import { Scenery } from './Scenery'
import { Atmosphere } from './Atmosphere'
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
  powerUpSystem: PowerUpSystem
  sound: SoundManager
  fx: Fx
  scenery: Scenery
  atmosphere: Atmosphere

  score = 0
  lives = 3
  gameTime = 0
  scrollSpeed = 120
  private onGameOver: GameCallback | null = null
  private gameOverTriggered = false

  private fuelFlashTimer = 0
  slowMotionTimer = 0
  comboMultiplier = 1
  consecutiveHits = 0
  comboAnimTimer = 0
  comboLevelTimer = 0

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
    this.powerUpSystem = new PowerUpSystem(canvas.width, canvas.height)
    this.sound = new SoundManager()
    this.fx = new Fx()
    this.scenery = new Scenery(canvas.width, canvas.height)
    this.atmosphere = new Atmosphere(canvas.width, canvas.height)

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
    this.lives = 3
    this.gameTime = 0
    this.scrollSpeed = 120
    this.player.reset(this.canvas.width, this.canvas.height)
    this.world.reset(this.canvas.width, this.canvas.height)
    this.enemyManager.reset(this.canvas.width, this.canvas.height)
    this.fuelSystem.reset(this.canvas.width, this.canvas.height)
    this.powerUpSystem.reset(this.canvas.width, this.canvas.height)
    this.slowMotionTimer = 0
    this.comboMultiplier = 1
    this.consecutiveHits = 0
    this.comboAnimTimer = 0
    this.comboLevelTimer = 0
    this.fx.reset()
    this.scenery.reset(this.canvas.width, this.canvas.height)
    this.atmosphere.reset(this.canvas.width, this.canvas.height)
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
    this.powerUpSystem.setCanvasHeight(height)
    this.scenery.setCanvasHeight(height)
    this.atmosphere.resize(width, height)
    const bounds = this.world.getBoundsAtY(this.player.y)
    this.player.resize(width, height, bounds.left, bounds.right)
    this.ui.resize(width)
  }

  registerHit(): void {
    this.consecutiveHits++
    const oldMultiplier = this.comboMultiplier

    if (this.consecutiveHits >= 25) {
      this.comboMultiplier = 4
    } else if (this.consecutiveHits >= 12) {
      this.comboMultiplier = 3
    } else if (this.consecutiveHits >= 5) {
      this.comboMultiplier = 2
    }

    // Every hit refreshes the current level timer
    this.comboLevelTimer = 6.0 // 6 seconds to find next target at any level

    if (this.comboMultiplier > oldMultiplier) {
      this.comboAnimTimer = 1.0
      this.fx.addShake(3, 0.1)
    }
  }

  registerMiss(): void {
    // Punishing miss resets everything
    this.comboMultiplier = 1
    this.comboAnimTimer = 0.5
    this.comboLevelTimer = 0
    this.consecutiveHits = 0
  }

  decayCombo(): void {
    if (this.comboMultiplier > 1) {
      this.comboMultiplier--
      this.comboAnimTimer = 0.5
      
      // Reset hits to the minimum threshold of the lower level
      if (this.comboMultiplier === 3) this.consecutiveHits = 12
      else if (this.comboMultiplier === 2) this.consecutiveHits = 5
      else this.consecutiveHits = 0

      if (this.comboMultiplier > 1) {
        this.comboLevelTimer = 6.0
      } else {
        this.comboLevelTimer = 0
      }
    }
  }

  private loop = (timestamp: number): void => {
    if (!this.running) return

    const dt = Math.max(0, Math.min((timestamp - this.lastTime) / 1000, 0.05))
    this.lastTime = timestamp

    if (!this.paused) {
      this.update(dt)
    }
    this.render()

    this.rafId = requestAnimationFrame(this.loop)
  }

  private update(dt: number): void {
    // While player is in exploding animation, keep updating fx only.
    // When the animation ends (state → 'dead'), handlePlayerDeath is called.
    if (this.player.state === 'exploding') {
      this.player.update(dt, 0, this.canvas.width)
      this.fx.update(dt)
      return
    }
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

    if (this.slowMotionTimer > 0) {
      this.slowMotionTimer -= dt
    }
    if (this.comboAnimTimer > 0) {
      this.comboAnimTimer -= dt
    }
    if (this.comboLevelTimer > 0) {
      this.comboLevelTimer -= dt
      if (this.comboLevelTimer <= 0) {
        this.decayCombo()
      }
    }

    const envDt = this.slowMotionTimer > 0 ? dt * 0.5 : dt

    this.world.update(envDt, this.scrollSpeed)
    this.atmosphere.update(envDt, this.scrollSpeed)

    const bounds = this.world.getBoundsAtY(this.player.y)
    this.player.update(dt, bounds.left, bounds.right, () => this.registerMiss())

    this.enemyManager.update(envDt, this.world, this.world.segments, this.scrollSpeed)
    this.fuelSystem.update(envDt, this.world, this.world.segments, this.scrollSpeed)
    this.scenery.update(envDt, this.scrollSpeed, this.world, this.canvas.width)
    this.powerUpSystem.update(envDt, this.scrollSpeed, this.world)

    if (this.player.state === 'alive') {
      if (Math.random() < 0.5) {
        let trailColor = '#888888'
        if (speedMod > 1.2) trailColor = '#aa7744'
        else if (speedMod < 0.6) trailColor = '#555555'
        this.fx.smokeTrail(this.player.x, this.player.y + this.player.height / 2, trailColor)
      }

      CollisionSystem.resolveCollisions({
        player: this.player,
        enemyManager: this.enemyManager,
        fuelSystem: this.fuelSystem,
        powerUpSystem: this.powerUpSystem,
        fx: this.fx,
        sound: this.sound,
        world: this.world,
        comboMultiplier: this.comboMultiplier,
        triggerGameOver: () => this.triggerGameOver(),
        handlePlayerDeath: () => this.handlePlayerDeath(),
        addScore: (points) => {
          this.score += points
        },
        registerHit: () => {
          this.registerHit()
        },
        activateSlowMotion: () => {
          this.slowMotionTimer = 5.0
        }
      })

      if (this.player.justShot) {
        this.sound.shoot()
        this.player.justShot = false
        // Trigger small penalty for firing to discourage spamming
        if (this.comboMultiplier > 1) {
          this.comboLevelTimer -= 0.3 // -0.3s per shot
        }
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
        this.handlePlayerDeath()
        return
      }
    }

    this.fx.update(dt)
  }

  private render(): void {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height)

    const palette = this.atmosphere.getPalette()

    this.ctx.save()
    if (this.fx.shakeX !== 0 || this.fx.shakeY !== 0) {
      this.ctx.translate(this.fx.shakeX, this.fx.shakeY)
    }

    // World terrain + water (palette-driven colours for day/night)
    this.world.render(this.ctx, palette)
    // Decorative scenery dims at night
    this.scenery.render(this.ctx, palette.brightness)
    // Parallax clouds — above scenery, below gameplay entities
    this.atmosphere.renderClouds(this.ctx)
    // Gameplay entities always remain bright for readability
    this.fuelSystem.render(this.ctx)
    this.powerUpSystem.render(this.ctx)
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
        powerUps: this.powerUpSystem.powerUps.filter((p) => p.active),
      },
      this.player.doubleShotTimer,
      this.slowMotionTimer,
      { multiplier: this.comboMultiplier, timer: this.comboAnimTimer, maxTimer: this.comboLevelTimer },
      this.lives
    )

    // CRT scanlines — screen-space overlay applied last, over everything including HUD
    this.atmosphere.renderScanlines(this.ctx, this.canvas.width, this.canvas.height)
  }

  handlePlayerDeath(): void {
    if (this.gameOverTriggered) return
    this.lives--
    this.registerMiss() // Reset combo on death

    if (this.lives > 0) {
      // Still has lives — respawn after the explosion animation (~1.2s)
      setTimeout(() => {
        if (!this.running || this.gameOverTriggered) return
        // Give minimum fuel on respawn so player isn't stuck in a fuel-out loop
        if (this.fuelSystem.fuel < 30) {
          this.fuelSystem.fuel = 30
        }
        this.player.respawn(this.canvas.width, this.canvas.height)
      }, 1300)
    } else {
      // No more lives — real game over
      this.triggerGameOver()
    }
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
