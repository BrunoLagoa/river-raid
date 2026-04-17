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
import { ScoringSystem } from './ScoringSystem'
import { GameState } from './GameState'
import { DebugPanel } from './DebugPanel'
import { ObjectiveSystem } from './ObjectiveSystem'
import type { RandomSource } from './random'
import {
  COMBO_SHOT_PENALTY,
  FUEL_LOW_THRESHOLD, FUEL_LOW_FLASH_INTERVAL, FUEL_RESPAWN_MIN,
  SLOW_MOTION_DURATION,
  GAME_OVER_DELAY, RESPAWN_DELAY, HIGH_SCORE_KEY,
} from './constants'
export type GameCallback = (score: number, highScore: number) => void

export class Game {
  private static readonly HIGH_SCORE_KEY_STATIC = HIGH_SCORE_KEY

  private canvas: HTMLCanvasElement
  private ctx: CanvasRenderingContext2D
  private rafId: number | null = null
  private lastTime = 0
  private running = false
  private paused = false
  private gamepadEnabled = true

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
  objectives: ObjectiveSystem
  private debugPanel = new DebugPanel()

  private onGameOver: GameCallback | null = null
  private gameOverTriggered = false
  private random: RandomSource

  private scoring = new ScoringSystem()
  private state = new GameState()
  private readonly minimapEnemies: Array<{ x: number; y: number; active: boolean }> = []
  private readonly minimapFuelTanks: Array<{ x: number; y: number; active: boolean }> = []
  private readonly minimapPowerUps: Array<{ x: number; y: number; active: boolean }> = []

  get score(): number { return this.scoring.score }
  set score(value: number) { this.scoring.score = value }
  get lives(): number { return this.state.lives }
  set lives(value: number) { this.state.lives = value }
  get gameTime(): number { return this.state.gameTime }
  set gameTime(value: number) { this.state.gameTime = value }
  get scrollSpeed(): number { return this.state.scrollSpeed }
  set scrollSpeed(value: number) { this.state.scrollSpeed = value }
  get slowMotionTimer(): number { return this.state.slowMotionTimer }
  set slowMotionTimer(value: number) { this.state.slowMotionTimer = value }
  get comboMultiplier(): number { return this.scoring.comboMultiplier }
  get consecutiveHits(): number { return this.scoring.consecutiveHits }
  get comboAnimTimer(): number { return this.scoring.comboAnimTimer }
  get comboLevelTimer(): number { return this.scoring.comboLevelTimer }

  constructor(canvas: HTMLCanvasElement, random: RandomSource = Math.random) {
    this.random = random
    this.canvas = canvas
    const ctx = canvas.getContext('2d')
    if (!ctx) throw new Error('Could not get 2D context')
    this.ctx = ctx

    this.player = new Player(canvas.width, canvas.height)
    this.world = new World(canvas.width, canvas.height, this.random)
    this.ui = new UI()
    this.enemyManager = new EnemyManager(canvas.width, canvas.height, this.random)
    this.fuelSystem = new FuelSystem(canvas.width, canvas.height, this.random)
    this.powerUpSystem = new PowerUpSystem(canvas.width, canvas.height, this.random)
    this.sound = new SoundManager()
    this.fx = new Fx()
    this.scenery = new Scenery(canvas.width, canvas.height)
    this.atmosphere = new Atmosphere(canvas.width, canvas.height)
    this.objectives = new ObjectiveSystem(this.random, (points) => {
      this.scoring.addScore(points)
    })

    this.bindGlobalInput()
  }

  private globalKeyHandler = (e: KeyboardEvent): void => {
    if (e.key === 'p' || e.key === 'P' || e.key === 'Escape') {
      this.togglePause()
    }
    if (e.key === 'm' || e.key === 'M') {
      this.sound.toggleMute()
    }
    this.debugPanel.onKeyDown(e.key)
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

  setTouchPosition(screenX: number | null): void {
    this.player.setTouchTarget(screenX)
  }

  setReducedMotion(enabled: boolean): void {
    this.fx.setReducedMotion(enabled)
  }

  setMasterVolume(volume: number): void {
    this.sound.setVolume(volume)
  }

  setGamepadEnabled(enabled: boolean): void {
    this.gamepadEnabled = enabled
  }

  destroy(): void {
    this.stop()
    window.removeEventListener('keydown', this.globalKeyHandler)
    this.sound.destroy()
  }

  restart(): void {
    this.stop()
    this.state.reset()
    this.scoring.reset()
    this.player.reset(this.canvas.width, this.canvas.height)
    this.world.reset(this.canvas.width, this.canvas.height)
    this.enemyManager.reset(this.canvas.width, this.canvas.height)
    this.fuelSystem.reset(this.canvas.width, this.canvas.height)
    this.powerUpSystem.reset(this.canvas.width, this.canvas.height)
    this.fx.reset()
    this.scenery.reset(this.canvas.width, this.canvas.height)
    this.atmosphere.reset(this.canvas.width, this.canvas.height)
    this.debugPanel.reset()
    this.objectives.reset()
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
    const previous = this.comboMultiplier
    this.scoring.registerHit()
    if (this.comboMultiplier > previous) {
      this.fx.addShake(3, 0.1)
    }
  }

  registerMiss(): void {
    this.scoring.registerMiss()
  }

  decayCombo(): void {
    this.scoring.decayCombo()
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

  private pollGamepad(): void {
    if (!this.gamepadEnabled || !navigator.getGamepads) return
    const pads = navigator.getGamepads()
    const gp = pads[0]
    if (!gp) return

    const axisX = gp.axes[0] ?? 0
    if (axisX < -0.25) {
      this.player.keys.add('ArrowLeft')
      this.player.keys.delete('ArrowRight')
    } else if (axisX > 0.25) {
      this.player.keys.add('ArrowRight')
      this.player.keys.delete('ArrowLeft')
    } else {
      this.player.keys.delete('ArrowLeft')
      this.player.keys.delete('ArrowRight')
    }

    if (gp.buttons[0]?.pressed) this.player.keys.add(' ')
    else this.player.keys.delete(' ')

    if (gp.buttons[9]?.pressed) this.togglePause()
  }

  private update(dt: number): void {
    if (this.updateNonInteractiveStates(dt)) return

    const speedMod = this.updateFrameState(dt)
    const envDt = this.state.getEnvDt(dt)

    this.updateWorldAndPlayer(dt, envDt)
    this.updateGameplaySystems(envDt)

    if (this.player.state === 'alive') {
      if (this.handleAliveState(dt, speedMod)) return
    }

    this.fx.update(dt)
    this.updateDebugMetrics()
  }

  private updateNonInteractiveStates(dt: number): boolean {
    if (this.player.state === 'exploding') {
      this.player.update(dt, 0, this.canvas.width)
      this.fx.update(dt)
      this.atmosphere.update(dt, this.scrollSpeed)
      return true
    }

    if (this.player.state === 'dead') {
      this.fx.update(dt)
      this.atmosphere.update(dt, this.scrollSpeed)
      return true
    }

    return false
  }

  private updateFrameState(dt: number): number {
    this.pollGamepad()
    this.state.updateTime(dt)
    const speedMod = this.state.updateSpeed(this.player.keys)
    this.scoring.update(dt)
    this.objectives.update(dt, this.comboMultiplier)
    this.sound.updateEngine()
    return speedMod
  }

  private updateWorldAndPlayer(dt: number, envDt: number): void {
    this.world.update(envDt, this.scrollSpeed)
    this.atmosphere.update(dt, this.scrollSpeed)

    const bounds = this.world.getBoundsAtY(this.player.y)
    this.player.update(dt, bounds.left, bounds.right, () => this.registerMiss())
  }

  private updateGameplaySystems(envDt: number): void {
    this.enemyManager.update(envDt, this.world, this.world.segments, this.scrollSpeed)
    this.fuelSystem.update(envDt, this.world, this.world.segments, this.scrollSpeed)
    this.scenery.update(envDt, this.scrollSpeed, this.world, this.canvas.width)
    this.powerUpSystem.update(envDt, this.scrollSpeed, this.world)
  }

  private handleAliveState(dt: number, speedMod: number): boolean {
    this.renderSmokeTrail(speedMod)
    this.resolveGameplayCollisions()

    if (this.player.justShot) {
      this.sound.shoot()
      this.player.justShot = false
      if (this.comboMultiplier > 1) {
        this.scoring.comboLevelTimer -= COMBO_SHOT_PENALTY
      }
    }

    if (this.fuelSystem.fuel < FUEL_LOW_THRESHOLD) {
      this.state.fuelFlashTimer += dt
      if (this.state.fuelFlashTimer > FUEL_LOW_FLASH_INTERVAL) {
        this.state.fuelFlashTimer = 0
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
      return true
    }

    return false
  }

  private renderSmokeTrail(speedMod: number): void {
    if (this.random() >= 0.5) return

    let trailColor = '#888888'
    if (speedMod > 1.2) trailColor = '#aa7744'
    else if (speedMod < 0.6) trailColor = '#555555'
    this.fx.smokeTrail(this.player.x, this.player.y + this.player.height / 2, trailColor)
  }

  private resolveGameplayCollisions(): void {
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
        this.scoring.addScore(points)
      },
      registerHit: () => {
        this.registerHit()
      },
      activateSlowMotion: () => {
        this.slowMotionTimer = SLOW_MOTION_DURATION
      },
      onEnemyDestroyed: (enemyType) => {
        this.objectives.onEnemyDestroyed(enemyType)
      },
      onFuelCollected: (count) => {
        this.objectives.onFuelCollected(count)
      }
    })
  }

  private updateDebugMetrics(): void {
    this.debugPanel.updateMetrics({
      entityCounts: {
        enemies: this.enemyManager.activeEnemyCount,
        fuelTanks: this.fuelSystem.tanks.filter(t => t.active).length,
        powerUps: this.powerUpSystem.powerUps.filter(p => p.active).length,
        bullets: this.player.bullets.length,
        particles: this.fx.activeCount,
      },
      scrollSpeed: this.scrollSpeed,
      gameTime: this.gameTime,
      playerX: this.player.x,
      playerY: this.player.y,
    })
  }

  private collectActiveEntities<T extends { x: number; y: number; active: boolean }>(
    source: T[],
    target: T[],
  ): T[] {
    target.length = 0
    for (const item of source) {
      if (!item.active) continue
      target.push(item)
    }
    return target
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
        enemies: this.collectActiveEntities(this.enemyManager.enemies, this.minimapEnemies),
        fuelTanks: this.collectActiveEntities(this.fuelSystem.tanks, this.minimapFuelTanks),
        powerUps: this.collectActiveEntities(this.powerUpSystem.powerUps, this.minimapPowerUps),
      },
      this.player.doubleShotTimer,
      this.slowMotionTimer,
      { multiplier: this.comboMultiplier, timer: this.comboAnimTimer, maxTimer: this.comboLevelTimer },
      this.objectives.getHudData(),
      this.lives
    )

    this.debugPanel.render(this.ctx, this.canvas.width)

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
        if (this.fuelSystem.fuel < FUEL_RESPAWN_MIN) {
          this.fuelSystem.fuel = FUEL_RESPAWN_MIN
        }
        this.player.respawn(this.canvas.width, this.canvas.height)
      }, RESPAWN_DELAY)
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
    }, GAME_OVER_DELAY)
  }

  getHighScore(): number {
    return readSecureNumber(Game.HIGH_SCORE_KEY_STATIC, 0)
  }

  private saveHighScore(): void {
    try {
      const current = this.getHighScore()
      if (this.score > current) {
        writeSecureNumber(Game.HIGH_SCORE_KEY_STATIC, this.score)
      }
    } catch {
      // ignore
    }
  }
}
