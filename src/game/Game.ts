import { Player } from './Player'
import { World } from './World'
import { CollisionSystem } from './CollisionSystem'
import type { CollisionContext } from './CollisionSystem'
import { UI } from './UI'
import { EnemyManager } from './EnemyManager'
import { FuelSystem } from './FuelSystem'
import { PowerUpSystem } from './PowerUpSystem'
import { SoundManager } from './SoundManager'
import { Fx } from './Fx'
import { Scenery } from './Scenery'
import { Atmosphere } from './Atmosphere'
import { BiomeSystem } from './BiomeSystem'
import { readSecureNumber, writeSecureNumber } from './StorageService'
import { ScoringSystem } from './ScoringSystem'
import { GameState } from './GameState'
import { DebugPanel } from './DebugPanel'
import { ObjectiveSystem } from './ObjectiveSystem'
import type { ObjectiveBalanceProfile } from './ObjectiveSystem'
import type { RandomSource } from './random'
import {
  COMBO_SHOT_PENALTY,
  FUEL_LOW_THRESHOLD, FUEL_LOW_FLASH_INTERVAL, FUEL_RESPAWN_MIN,
  SLOW_MOTION_DURATION,
  GAME_OVER_DELAY, RESPAWN_DELAY, HIGH_SCORE_KEY,
  POWERUP_MAGNET_FUEL_SPEED,
  DT_CLAMP_MAX,
  SMOKE_TRAIL_SPAWN_CHANCE, SMOKE_TRAIL_FAST_SPEED_MOD, SMOKE_TRAIL_SLOW_SPEED_MOD,
  SHOCKWAVE_MAX_RADIUS_RATIO, SHOCKWAVE_BASE_ALPHA,
  DISTANCE_PX_PER_METER,
  DIFFICULTY_PRESETS, type Difficulty, type DifficultyPreset,
} from './constants'
import {
  unlockAchievement,
  isAchievementUnlocked,
  type AchievementId,
} from './AchievementService'
import { AchievementTracker } from './AchievementTracker'
import type { Strings } from '../i18n'
export type GameCallback = (score: number, highScore: number) => void
export type AchievementCallback = (id: AchievementId, title: string, description: string) => void

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
  private onAchievementUnlocked: AchievementCallback | null = null
  private gameOverTriggered = false
  private reducedMotion = false
  private colorblind = false
  private random: RandomSource

  private achievements = new AchievementTracker((id) => this.tryUnlockAchievement(id))
  private difficulty: DifficultyPreset = DIFFICULTY_PRESETS.normal
  private locale: Strings | null = null

  // Tracked so stop()/destroy() can cancel them — prevents respawn or the
  // game-over callback from firing after the game has been torn down.
  private respawnTimeoutId: ReturnType<typeof setTimeout> | null = null
  private gameOverTimeoutId: ReturnType<typeof setTimeout> | null = null

  private scoring = new ScoringSystem()
  private state = new GameState()
  private biomeSystem = new BiomeSystem()
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

  constructor(
    canvas: HTMLCanvasElement,
    random: RandomSource = Math.random,
    objectiveProfile: ObjectiveBalanceProfile = 'conservative'
  ) {
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
    }, objectiveProfile)

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

  setOnAchievementUnlocked(cb: AchievementCallback): void {
    this.onAchievementUnlocked = cb
  }

  private tryUnlockAchievement(id: AchievementId): void {
    if (isAchievementUnlocked(id)) return
    const updated = unlockAchievement(id)
    const achievement = updated.find((a) => a.id === id)
    if (!achievement) return
    const localized = this.locale?.achievementCatalog[id]
    const title = localized?.title ?? achievement.title
    const description = localized?.description ?? achievement.description
    this.ui.pushToast(title, description)
    this.onAchievementUnlocked?.(id, title, description)
  }

  start(): void {
    if (this.running) return
    this.running = true
    this.gameOverTriggered = false
    this.paused = false
    this.sound.init()
    this.sound.resume()
    this.sound.startMusic(this.biomeSystem.getCurrentBiomeId())
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
    this.clearPendingTimers()
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId)
      this.rafId = null
    }
  }

  private clearPendingTimers(): void {
    if (this.respawnTimeoutId !== null) {
      clearTimeout(this.respawnTimeoutId)
      this.respawnTimeoutId = null
    }
    if (this.gameOverTimeoutId !== null) {
      clearTimeout(this.gameOverTimeoutId)
      this.gameOverTimeoutId = null
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

  setTouchPosition(screenX: number | null, screenY: number | null = null): void {
    this.player.setTouchTarget(screenX, screenY)
  }

  setReducedMotion(enabled: boolean): void {
    this.reducedMotion = enabled
    this.fx.setReducedMotion(enabled)
  }

  // Light haptic feedback on mobile; suppressed when reduced motion is on.
  private vibrate(ms: number): void {
    if (this.reducedMotion) return
    if (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') {
      navigator.vibrate(ms)
    }
  }

  setMasterVolume(volume: number): void {
    this.sound.setVolume(volume)
  }

  setGamepadEnabled(enabled: boolean): void {
    this.gamepadEnabled = enabled
  }

  setColorblind(enabled: boolean): void {
    this.colorblind = enabled
  }

  setObjectiveBalanceProfile(profile: ObjectiveBalanceProfile): void {
    this.objectives.setProfile(profile)
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
    this.biomeSystem.reset()
    this.debugPanel.reset()
    this.objectives.reset()
    this.achievements.reset()
    this.clearPendingTimers()
    this.start()
  }

  setDifficulty(difficulty: Difficulty): void {
    this.difficulty = DIFFICULTY_PRESETS[difficulty]
    this.fuelSystem.drainMultiplier = this.difficulty.fuelDrainMult
  }

  /** Provide localized strings for in-game text (pause overlay, toasts). */
  setLocale(strings: Strings): void {
    this.locale = strings
    this.ui.setPauseLabels(strings.hudPaused, strings.hudPauseHint)
    this.ui.setDistanceLabel(strings.hudDistance)
  }

  resize(width: number, height: number): void {
    this.canvas.width = width
    this.canvas.height = height
    this.world.resize(width, height)
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

    const dt = Math.max(0, Math.min((timestamp - this.lastTime) / 1000, DT_CLAMP_MAX))
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

    const axisY = gp.axes[1] ?? 0
    if (axisY < -0.25) {
      this.player.keys.add('ArrowUp')
      this.player.keys.delete('ArrowDown')
    } else if (axisY > 0.25) {
      this.player.keys.add('ArrowDown')
      this.player.keys.delete('ArrowUp')
    } else {
      this.player.keys.delete('ArrowUp')
      this.player.keys.delete('ArrowDown')
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
    this.ui.updateToasts(dt)
    this.updateDebugMetrics()
  }

  private updateNonInteractiveStates(dt: number): boolean {
    if (this.player.state === 'exploding') {
      this.player.update(dt, 0, this.canvas.width)
      this.fx.update(dt)
      this.atmosphere.update(dt, this.scrollSpeed, this.biomeSystem.getConfig().basePalette)
      return true
    }

    if (this.player.state === 'dead') {
      this.fx.update(dt)
      this.atmosphere.update(dt, this.scrollSpeed, this.biomeSystem.getConfig().basePalette)
      return true
    }

    return false
  }

  private updateFrameState(dt: number): number {
    this.pollGamepad()
    this.state.updateTime(dt)
    const speedMod = this.state.updateSpeed(this.player.keys)
    this.state.addDistance(this.scrollSpeed * dt)
    this.scoring.update(dt)
    this.objectives.update(dt, this.comboMultiplier)
    this.sound.updateEngine()
    return speedMod
  }

  private updateWorldAndPlayer(dt: number, envDt: number): void {
    // Update biome and distribute config to downstream systems
    this.biomeSystem.update(dt)
    const biomeCfg = this.biomeSystem.getConfig()
    // Troca a trilha quando o rio entra em um novo bioma (no-op se igual).
    this.sound.setBiomeMusic(this.biomeSystem.getCurrentBiomeId())
    // Modula a trilha conforme a fase do dia (modo noturno).
    this.sound.setMusicPhase(this.atmosphere.getPhaseIndex())

    this.world.setBiomeWidths(biomeCfg.riverMinWidth, biomeCfg.riverMaxWidthRatio)
    this.scenery.setSceneryWeights(biomeCfg.sceneryWeights)
    this.enemyManager.setEnemyBiomeConfig(
      biomeCfg.enemyWeights,
      biomeCfg.enemySpawnRateMult * this.difficulty.enemySpawnRateMult,
      biomeCfg.enemyTierBias,
    )

    this.world.update(envDt, this.scrollSpeed)
    // Nevasca: intensidade segue o bioma de neve, com fade durante a transição.
    const snow = (biomeCfg.fromBiomeId === 'snow' ? 1 - biomeCfg.blend : 0)
      + (biomeCfg.toBiomeId === 'snow' ? biomeCfg.blend : 0)
    this.atmosphere.setSnow(snow)
    this.atmosphere.update(dt, this.scrollSpeed, biomeCfg.basePalette)

    const bounds = this.world.getBoundsAtY(this.player.y)
    this.player.update(dt, bounds.left, bounds.right, () => this.registerMiss())
    const halfWidth = this.player.width / 2
    const isInsideRiver = (this.player.x - halfWidth) >= bounds.left + 4 && (this.player.x + halfWidth) <= bounds.right - 4
    this.objectives.onRiverFrame(dt, isInsideRiver)
  }

  private updateGameplaySystems(envDt: number): void {
    // Smart/elite enemies aim at the live ship; don't feed them a dying target.
    const aimTarget = this.player.state === 'alive'
      ? { x: this.player.x, y: this.player.y }
      : undefined
    this.enemyManager.update(envDt, this.world, this.world.segments, this.scrollSpeed, aimTarget)
    this.fuelSystem.update(envDt, this.world, this.world.segments, this.scrollSpeed)
    this.scenery.update(envDt, this.scrollSpeed, this.world, this.canvas.width)
    this.powerUpSystem.update(envDt, this.scrollSpeed, this.world)
    if (this.player.magnetFuelTimer > 0) {
      for (const tank of this.fuelSystem.tanks) {
        const dx = this.player.x - tank.x
        const dy = this.player.y - tank.y
        const dist = Math.sqrt(dx * dx + dy * dy) || 1
        const step = POWERUP_MAGNET_FUEL_SPEED * envDt
        tank.x += (dx / dist) * Math.min(step, dist)
        tank.y += (dy / dist) * Math.min(step, dist)
      }
    }
  }

  private handleAliveState(dt: number, speedMod: number): boolean {
    this.renderSmokeTrail(speedMod)
    this.resolveGameplayCollisions()

    this.achievements.updateFuel(dt, this.fuelSystem.fuel)

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
    if (this.random() >= SMOKE_TRAIL_SPAWN_CHANCE) return

    let trailColor = '#888888'
    if (speedMod > SMOKE_TRAIL_FAST_SPEED_MOD) trailColor = '#aa7744'
    else if (speedMod < SMOKE_TRAIL_SLOW_SPEED_MOD) trailColor = '#555555'
    this.fx.smokeTrail(this.player.x, this.player.y + this.player.height / 2, trailColor)
  }

  private renderShockwave(ctx: CanvasRenderingContext2D): void {
    const sw = this.fx.getShockwave()
    if (sw.timer <= 0) return
    const progress = 1 - sw.timer / sw.duration
    const maxRadius = Math.max(this.canvas.width, this.canvas.height) * SHOCKWAVE_MAX_RADIUS_RATIO
    const radius = progress * maxRadius
    const alpha = (1 - progress) * SHOCKWAVE_BASE_ALPHA
    ctx.save()
    ctx.strokeStyle = `rgba(255, 255, 255, ${alpha})`
    ctx.lineWidth = 4 + (1 - progress) * 8
    ctx.beginPath()
    ctx.arc(sw.origin.x, sw.origin.y, radius, 0, Math.PI * 2)
    ctx.stroke()
    ctx.restore()
  }

  // Built once and reused — only comboMultiplier changes per frame, so we avoid
  // re-allocating the context object plus ~10 closures every frame.
  private collisionCtx: CollisionContext | null = null

  private getCollisionContext(): CollisionContext {
    if (!this.collisionCtx) {
      this.collisionCtx = {
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
          this.objectives.onScoreGained(points)
        },
        registerHit: () => this.registerHit(),
        activateSlowMotion: () => {
          this.slowMotionTimer = SLOW_MOTION_DURATION
        },
        onEnemyDestroyed: (enemyType) => {
          this.objectives.onEnemyDestroyed(enemyType)
          this.achievements.onEnemyDestroyed(enemyType)
        },
        onFuelCollected: (count) => this.objectives.onFuelCollected(count),
        onPowerUpCollected: (type) => {
          this.achievements.onPowerUpCollected()
          const name = this.locale?.powerupNames[type]
          const desc = this.locale?.powerupDescs[type]
          if (name) this.ui.pushToast(name, desc ?? '')
        },
        random: this.random,
      }
    }
    return this.collisionCtx
  }

  private resolveGameplayCollisions(): void {
    const ctx = this.getCollisionContext()
    ctx.comboMultiplier = this.comboMultiplier
    CollisionSystem.resolveCollisions(ctx)
  }

  private updateDebugMetrics(): void {
    this.debugPanel.updateMetrics({
      entityCounts: {
        enemies: this.enemyManager.activeEnemyCount,
        fuelTanks: this.countActive(this.fuelSystem.tanks),
        powerUps: this.countActive(this.powerUpSystem.powerUps),
        bullets: this.player.bullets.length,
        particles: this.fx.activeCount,
      },
      scrollSpeed: this.scrollSpeed,
      gameTime: this.gameTime,
      playerX: this.player.x,
      playerY: this.player.y,
    })
  }

  private countActive(items: ReadonlyArray<{ active: boolean }>): number {
    let n = 0
    for (const item of items) if (item.active) n++
    return n
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
    this.ui.setDistanceMeters(Math.floor(this.state.distance / DISTANCE_PX_PER_METER))
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
    this.enemyManager.render(this.ctx, this.colorblind)
    this.player.render(this.ctx)
    this.fx.render(this.ctx)
    this.renderShockwave(this.ctx)

    this.ctx.restore()

    // Falling snow — screen-space foreground, above the world but below the HUD.
    this.atmosphere.renderWeather(this.ctx)

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
      this.lives,
      this.player.rapidFireTimer,
      this.player.magnetFuelTimer,
    )

    this.debugPanel.render(this.ctx, this.canvas.width)

    // CRT scanlines — screen-space overlay applied last, over everything including HUD
    this.atmosphere.renderScanlines(this.ctx, this.canvas.width, this.canvas.height)
  }

  handlePlayerDeath(): void {
    if (this.gameOverTriggered) return
    this.achievements.onPlayerDeath()
    this.vibrate(60)
    this.lives--
    this.registerMiss() // Reset combo on death

    if (this.lives > 0) {
      // Still has lives — respawn after the explosion animation (~1.2s)
      this.respawnTimeoutId = setTimeout(() => {
        this.respawnTimeoutId = null
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

    this.achievements.onGameOver(this.score, this.comboMultiplier)

    this.fx.addShake(15, 0.6)
    this.sound.gameOver()
    const isNewBest = this.score > this.getHighScore()
    if (isNewBest) {
      this.saveHighScore()
    }
    this.gameOverTimeoutId = setTimeout(() => {
      this.gameOverTimeoutId = null
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
