import { Player } from './Player'
import { BULLET_STYLES } from './BulletStyles'
import { World } from './World'
import { CollisionSystem, type CollisionContext } from './CollisionSystem'
import { UI, type BossHudData, type OverdriveHudData } from './UI'
import { EnemyManager } from './EnemyManager'
import { FuelSystem } from './FuelSystem'
import { PowerUpSystem } from './PowerUpSystem'
import { SoundManager } from './SoundManager'
import { Fx } from './Fx'
import { Scenery } from './Scenery'
import { Atmosphere } from './Atmosphere'
import { BiomeSystem } from './BiomeSystem'
import { WeatherSystem } from './WeatherSystem'
import { LightingSystem } from './LightingSystem'
import { OverdriveSystem } from './OverdriveSystem'
import { BossDreadnought } from './BossDreadnought'
import { BossRenderer } from './BossRenderer'
import { HazardManager, type BunkerBulletSpawn, type SeaMine } from './HazardManager'
import { HazardRenderer } from './HazardRenderer'
import { readSecureNumber, writeSecureNumber } from './StorageService'
import { ScoringSystem } from './ScoringSystem'
import { GameState } from './GameState'
import { DebugPanel } from './DebugPanel'
import { ObjectiveSystem, type ObjectiveBalanceProfile } from './ObjectiveSystem'
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
  EXTRA_LIFE_SCORE_INTERVAL, NEAR_MISS_DISTANCE, NEAR_MISS_POINTS, NEAR_MISS_COOLDOWN,
  BOSS_SPAWN_INTERVAL,
  MINE_CHAIN_RADIUS, BOSS_HEIGHT,
  BOSS_FIGHT_SCROLL_FACTOR, BOSS_FIGHT_MIN_SCROLL_SPEED,
  DIFFICULTY_PRESETS, type Difficulty, type DifficultyPreset,
} from './constants'
import {
  unlockAchievement,
  isAchievementUnlocked,
  type AchievementId,
} from './AchievementService'
import { AchievementTracker } from './AchievementTracker'
import type { Strings } from '../i18n'
import { KeybindingService, type Keybindings } from './KeybindingService'
import { HapticsEngine } from './HapticsEngine'
import { CareerStatsService, type EnemyKillCounts } from './CareerStatsService'
import { SkinService, type SkinId } from './SkinService'
import { type GameModeId, type GameModeConfig, getGameModeConfig } from './GameMode'
import { GhostReplaySystem } from './GhostReplaySystem'
import { GhostRenderer } from './GhostRenderer'

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
  weather: WeatherSystem
  lighting: LightingSystem
  hazards: HazardManager
  keybindings = new KeybindingService()
  haptics = new HapticsEngine()
  careerStats = new CareerStatsService()
  skinService = new SkinService()
  private hazardRenderer = new HazardRenderer()
  overdrive = new OverdriveSystem()
  boss: BossDreadnought | null = null
  private bossRenderer = new BossRenderer()
  private bossSpawnTimer = BOSS_SPAWN_INTERVAL

  private gameModeId: GameModeId = 'classic'
  private gameModeConfig: GameModeConfig = getGameModeConfig('classic')
  private ghostReplay = new GhostReplaySystem('classic')
  private ghostRenderer = new GhostRenderer()
  private ghostReplayEnabled = true

  private sessionShotsFired = 0
  private sessionShotsHit = 0
  private sessionFuelCount = 0
  private sessionEnemiesKilled: Partial<EnemyKillCounts> = {}
  private sessionHighestCombo = 1
  /** Bound once — the boss update runs every frame and must not allocate. */
  private spawnBossBullet = (b: { x: number; y: number; vx: number; speed: number; fromPlane: boolean }): void => {
    this.enemyManager.spawnEnemyBullet(b)
  }
  /** Bound once — hazards update every frame and must not allocate. */
  private spawnHazardBullet = (b: BunkerBulletSpawn): void => {
    this.enemyManager.spawnEnemyBullet(b)
  }
  /** Bound once — chained mine detonation callback. */
  private detonateChainedMine = (mine: SeaMine): void => {
    this.handleDetonateChainedMine(mine)
  }
  // Reused HUD payloads: render() runs 60x/s and must not allocate.
  private bossHud: BossHudData = { healthRatio: 1, phase: 1, isAlive: false }
  private overdriveHud: OverdriveHudData = { energyRatio: 0, isActive: false, isReady: false, remainingTimer: 0, activeRatio: 0 }
  objectives: ObjectiveSystem
  private debugPanel = new DebugPanel()
  private extraLifeThreshold = EXTRA_LIFE_SCORE_INTERVAL
  private nearMissCooldown = 0

  private onGameOver: GameCallback | null = null
  private onAchievementUnlocked: AchievementCallback | null = null
  private gameOverTriggered = false
  private reducedMotion = false
  private weatherEnabled = true
  private lightingEnabled = true
  private colorblind = false
  private dpr = 1
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
  // Reaproveitado a cada frame pelo loop (não alocar objetos em hot path).
  private readonly dynamicIntensity = { comboMax: false, lowFuel: false, inBossFight: false }
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
    this.player.setKeybindingService(this.keybindings)
    this.player.setSkin(this.skinService.getEquippedSkinId())
    this.world = new World(canvas.width, canvas.height, this.random)
    this.ui = new UI()
    this.enemyManager = new EnemyManager(canvas.width, canvas.height, this.random)
    this.fuelSystem = new FuelSystem(canvas.width, canvas.height, this.random)
    this.powerUpSystem = new PowerUpSystem(canvas.width, canvas.height, this.random)
    this.sound = new SoundManager()
    this.fx = new Fx(this.random)
    this.scenery = new Scenery(canvas.width, canvas.height)
    this.atmosphere = new Atmosphere(canvas.width, canvas.height)
    this.weather = new WeatherSystem(canvas.width, canvas.height, this.random)
    this.lighting = new LightingSystem(canvas.width, canvas.height)
    this.hazards = new HazardManager(canvas.width, canvas.height, this.random)
    this.objectives = new ObjectiveSystem(this.random, (points) => {
      this.scoring.addScore(points)
    }, objectiveProfile)

    this.bindGlobalInput()
  }

  private globalKeyHandler = (e: KeyboardEvent): void => {
    const action = this.keybindings.getActionForKey(e.code) ?? this.keybindings.getActionForKey(e.key)
    if (action === 'pause' || e.key === 'p' || e.key === 'P' || e.key === 'Escape') {
      this.togglePause()
    }
    if (e.key === 'm' || e.key === 'M') {
      this.sound.toggleMute()
    }
    // Shift is a modifier — binding it here fired Overdrive on Shift+P, capitals
    // and key auto-repeat, so the beam is on X only or custom overdrive key.
    if (!e.repeat && (action === 'overdrive' || e.key === 'x' || e.key === 'X')) {
      this.activateOverdrive()
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

  public activateOverdrive(): boolean {
    if (!this.running || this.paused || this.player.state !== 'alive') return false
    const activated = this.overdrive.activate()
    if (activated) {
      this.player.overdriveActive = true
      // Clear active enemy bullets on screen (EMP blast)
      for (const b of this.enemyManager.bullets) b.active = false
      this.fx.triggerShockwave(this.player.x, this.player.y, 1.2)
      this.fx.flash('#00ffff', 0.25)
      this.sound.bombShockwave()
      this.haptics.triggerOverdriveActive()
    }
    return activated
  }

  setTouchPosition(screenX: number | null, screenY: number | null = null): void {
    this.player.setTouchTarget(screenX, screenY)
  }

  setAnalogVector(x: number, y: number): void {
    this.player.setAnalogVector(x, y)
  }

  setTouchShoot(shooting: boolean): void {
    this.player.setTouchShoot(shooting)
  }

  setKeybindings(bindings?: Partial<Keybindings>): void {
    this.keybindings.setBindings(bindings)
  }

  setHapticsEnabled(enabled: boolean): void {
    this.haptics.setEnabled(enabled)
  }

  setReducedMotion(enabled: boolean): void {
    this.reducedMotion = enabled
    this.fx.setReducedMotion(enabled)
    this.player.setReducedMotion(enabled)
    this.haptics.setReducedMotion(enabled)
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

  setMusicVolume(volume: number): void {
    this.sound.setMusicVolume(volume)
  }

  setSfxVolume(volume: number): void {
    this.sound.setSfxVolume(volume)
  }

  setVoiceVolume(volume: number): void {
    this.sound.setVoiceVolume(volume)
  }

  setVoiceEnabled(enabled: boolean): void {
    this.sound.setVoiceEnabled(enabled)
  }

  setGamepadEnabled(enabled: boolean): void {
    this.gamepadEnabled = enabled
  }

  setWeatherEnabled(enabled: boolean): void {
    this.weatherEnabled = enabled
  }

  setLightingEnabled(enabled: boolean): void {
    this.lightingEnabled = enabled
  }

  /** Em touch os atalhos de teclado somem do HUD (não há teclado para usá-los). */
  setTouchMode(enabled: boolean): void {
    this.ui.setKeyboardHintsVisible(!enabled)
  }

  setColorblind(enabled: boolean): void {
    this.colorblind = enabled
    this.player.setColorblind(enabled)
  }

  setSkin(skinId: SkinId): void {
    this.player.setSkin(skinId)
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
    this.weather.reset()
    this.lighting.reset()
    this.hazards.reset(this.canvas.width, this.canvas.height)
    this.sound.speech.reset()
    this.overdrive.reset()
    this.boss = null
    this.bossSpawnTimer = this.gameModeConfig.firstBossSpawnTime
    this.player.overdriveActive = false
    this.player.setSkin(this.skinService.getEquippedSkinId())
    this.biomeSystem.reset()
    this.debugPanel.reset()
    this.objectives.reset()
    this.achievements.reset()
    this.ghostReplay.setMode(this.gameModeId)
    this.sessionShotsFired = 0
    this.sessionShotsHit = 0
    this.sessionFuelCount = 0
    this.sessionEnemiesKilled = {}
    this.sessionHighestCombo = 1
    this.extraLifeThreshold = EXTRA_LIFE_SCORE_INTERVAL
    this.nearMissCooldown = 0
    this.clearPendingTimers()
    this.start()
  }

  setGameMode(mode: GameModeId): void {
    this.gameModeId = mode
    this.gameModeConfig = getGameModeConfig(mode)
    this.lives = this.gameModeConfig.initialLives
    this.bossSpawnTimer = this.gameModeConfig.firstBossSpawnTime
    this.fuelSystem.drainMultiplier = this.gameModeConfig.infiniteFuel
      ? 0
      : this.difficulty.fuelDrainMult * this.gameModeConfig.fuelDrainMultiplier
    this.ghostReplay.setMode(mode)
  }

  getGameMode(): GameModeId {
    return this.gameModeId
  }

  setGhostReplayEnabled(enabled: boolean): void {
    this.ghostReplayEnabled = enabled
  }

  isGhostReplayEnabled(): boolean {
    return this.ghostReplayEnabled
  }

  setDifficulty(difficulty: Difficulty): void {
    this.difficulty = DIFFICULTY_PRESETS[difficulty]
    this.fuelSystem.drainMultiplier = this.gameModeConfig.infiniteFuel
      ? 0
      : this.difficulty.fuelDrainMult * this.gameModeConfig.fuelDrainMultiplier
  }

  /** Provide localized strings for in-game text (pause overlay, toasts). */
  setLocale(strings: Strings): void {
    this.locale = strings
    this.ui.setPauseLabels(strings.hudPaused, strings.hudPauseHint)
    this.ui.setDistanceLabel(strings.hudDistance)
    this.ui.setShortcutLabels(strings.hudPauseLabel, strings.hudMuteLabel)
    this.ui.setBossLabels(strings.hudBossName, strings.hudBossPhase)
    this.ui.setOverdriveLabels(strings.hudOverdriveActive, strings.hudOverdriveReady)
  }

  setLanguage(language: 'en' | 'pt-BR'): void {
    this.sound.setLanguage(language)
  }

  resize(width: number, height: number, dpr = 1): void {
    this.dpr = Math.max(1, Math.min(dpr, 2))
    this.canvas.width = Math.floor(width * this.dpr)
    this.canvas.height = Math.floor(height * this.dpr)
    this.world.resize(width, height)
    this.enemyManager.setCanvasHeight(height)
    this.fuelSystem.setCanvasHeight(height)
    this.powerUpSystem.setCanvasHeight(height)
    this.scenery.setCanvasHeight(height)
    this.atmosphere.resize(width, height)
    this.weather.setCanvasSize(width, height)
    this.lighting.setCanvasSize(width, height)
    const bounds = this.world.getBoundsAtY(this.player.y)
    this.player.resize(width, height, bounds.left, bounds.right)
    this.ui.resize(width)
  }

  registerHit(): void {
    this.sessionShotsHit++
    const previous = this.comboMultiplier
    this.scoring.registerHit()
    if (this.comboMultiplier > this.sessionHighestCombo) {
      this.sessionHighestCombo = this.comboMultiplier
    }
    this.checkExtraLife()
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

    if (gp.buttons[1]?.pressed) this.activateOverdrive()

    if (gp.buttons[9]?.pressed) this.togglePause()
  }

  private update(dt: number): void {
    if (this.updateNonInteractiveStates(dt)) return

    const speedMod = this.updateFrameState(dt)
    const envDt = this.state.getEnvDt(dt)

    this.updateWorldAndPlayer(dt, envDt)
    this.updateGameplaySystems(envDt)

    if (this.player.state === 'alive') {
      if (this.handleAliveState(dt, envDt, speedMod)) return
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
    // A boss fight drags the current back. Applied here, before distance, the
    // world and every entity riding on it read the same scroll speed this frame.
    if (this.boss?.isFighting) {
      this.scrollSpeed = Math.max(BOSS_FIGHT_MIN_SCROLL_SPEED, this.scrollSpeed * BOSS_FIGHT_SCROLL_FACTOR)
    }
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
    const biomeId = this.biomeSystem.getCurrentBiomeId()
    // Troca a trilha quando o rio entra em um novo bioma (no-op se igual).
    this.sound.setBiomeMusic(biomeId)
    // Modula a trilha conforme a fase do dia (modo noturno).
    this.sound.setMusicPhase(this.atmosphere.getPhaseIndex())
    // Ajusta acústica ambiental do bioma (eco de cânion / amortecimento de neve).
    this.sound.setBiomeAcoustics(biomeId)

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
    this.weather.update(dt, this.scrollSpeed, biomeCfg.weatherType, this.reducedMotion)
    // Farol só de noite — e a troca é animada (warm-up piscante / fade ao apagar).
    this.lighting.update(dt, this.atmosphere.isNight(), this.reducedMotion)

    const bounds = this.world.getBoundsAtY(this.player.y)
    this.player.update(dt, bounds.left, bounds.right, () => this.registerMiss())

    // Apply whirlpool physical suction if player flies above a vortex. The vortex
    // is environmental, so it scales with `envDt`, and the displacement is
    // re-clamped: `Player.update` already clamped, so an unclamped shove here
    // could drop the ship into the bank (instant death) or off the travel range.
    const wpForce = this.hazards.applyWhirlpoolForces(this.player.x, this.player.y)
    if (wpForce.fx !== 0 || wpForce.fy !== 0) {
      this.player.x = this.world.clampToRiver(
        this.player.x + wpForce.fx * envDt,
        this.player.y,
        this.player.width / 2,
      )
      this.player.y = this.player.clampY(this.player.y + wpForce.fy * envDt)
    }

    const halfWidth = this.player.width / 2
    const isInsideRiver = (this.player.x - halfWidth) >= bounds.left + 4 && (this.player.x + halfWidth) <= bounds.right - 4
    this.objectives.onRiverFrame(dt, isInsideRiver)
  }

  private updateGameplaySystems(envDt: number): void {
    // Overdrive system update — isActive is already false on the expiring frame.
    this.overdrive.update(envDt)
    this.player.overdriveActive = this.overdrive.isActive

    // Update speech synthesizer cooldowns
    this.sound.speech.update(envDt)

    // Dynamic music layering based on tension & combo
    const isLowFuel = this.fuelSystem.fuel <= FUEL_LOW_THRESHOLD
    const isComboMax = this.comboMultiplier >= 4
    const isBossActive = !!(this.boss && this.boss.active)

    const intensity = this.dynamicIntensity
    intensity.comboMax = isComboMax
    intensity.lowFuel = isLowFuel
    intensity.inBossFight = isBossActive
    this.sound.setDynamicIntensity(intensity)

    // Tactical vocal alerts
    if (this.player.state === 'alive') {
      if (isLowFuel) this.sound.speech.playWarningLowFuel()
      if (isComboMax) this.sound.speech.playComboMax()
      if (this.overdrive.isReady) this.sound.speech.playOverdriveReady()
    }

    // Environmental Hazards update (Sea Mines, Whirlpools, Shore Bunkers)
    this.hazards.update(
      envDt,
      this.scrollSpeed,
      this.world,
      this.player.x,
      this.player.y,
      this.spawnHazardBullet,
      this.detonateChainedMine,
    )

    // Boss spawn & update cycle
    if (!this.boss) {
      this.bossSpawnTimer -= envDt
      if (this.bossSpawnTimer <= 0) {
        this.boss = new BossDreadnought(this.canvas.width, -BOSS_HEIGHT, this.random)
        this.bossSpawnTimer = this.gameModeConfig.bossSpawnInterval
        this.fx.flash('#ff0044', 0.2)
        this.sound.speech.playBossAlert()
        this.haptics.triggerBossAlert()
      }
    } else {
      if (this.boss.active) {
        const riverBounds = this.world.getBoundsAtY(this.boss.y)
        this.boss.update(envDt, this.player.x, this.player.y, riverBounds, this.spawnBossBullet)
      } else if (this.boss.state === 'defeated') {
        this.sound.speech.playMissionComplete()
        this.boss = null
        this.bossSpawnTimer = this.gameModeConfig.bossSpawnInterval
      }
    }

    // Smart/elite enemies aim at the live ship; don't feed them a dying target.
    const aimTarget = this.player.state === 'alive'
      ? { x: this.player.x, y: this.player.y }
      : undefined
    // Elite enemies read live player bullets to juke out of the line of fire.
    const incomingBullets = this.player.state === 'alive' ? this.player.bullets : undefined
    this.enemyManager.update(envDt, this.world, this.world.segments, this.scrollSpeed, aimTarget, incomingBullets)
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

  private handleAliveState(dt: number, envDt: number, speedMod: number): boolean {
    if (this.gameModeConfig.recordGhost) {
      this.ghostReplay.recordSample(
        this.gameTime,
        this.player.x,
        this.player.y,
        this.player.bankDir,
        this.player.isShooting
      )
    }

    this.renderSmokeTrail(speedMod)
    this.resolveGameplayCollisions(envDt)
    this.checkNearMisses()

    this.achievements.updateFuel(dt, this.fuelSystem.fuel)

    if (this.player.justShot) {
      this.sessionShotsFired++
      this.sound.shoot()
      this.haptics.triggerShoot()
      this.fx.muzzleFlash(
        this.player.x,
        this.player.y - this.player.height / 2,
        BULLET_STYLES[this.player.currentBulletKind].body,
      )
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

    const skinDef = this.skinService.getSkinDef(this.player.skinId)
    let trailColor = skinDef.smokeColorNormal
    if (speedMod > SMOKE_TRAIL_FAST_SPEED_MOD) trailColor = skinDef.smokeColorAccelerate
    else if (speedMod < SMOKE_TRAIL_SLOW_SPEED_MOD) trailColor = skinDef.smokeColorBrake
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
          this.overdrive.onEnemyKilled()
          const eType = enemyType as keyof EnemyKillCounts
          this.sessionEnemiesKilled[eType] = (this.sessionEnemiesKilled[eType] ?? 0) + 1
          if (enemyType === 'bridge') {
            this.haptics.triggerBridgeDestroy()
          } else {
            this.haptics.triggerEnemyKill()
          }
        },
        onFuelCollected: (count) => {
          this.sessionFuelCount += count
          this.objectives.onFuelCollected(count)
        },
        onPowerUpCollected: (type) => {
          this.achievements.onPowerUpCollected()
          const name = this.locale?.powerupNames[type]
          const desc = this.locale?.powerupDescs[type]
          if (name) this.ui.pushToast(name, desc ?? '')
        },
        hazards: this.hazards,
        // `boss` and `dt` are refreshed per frame in resolveGameplayCollisions.
        random: this.random,
      }
    }
    return this.collisionCtx
  }

  private resolveGameplayCollisions(envDt: number): void {
    const ctx = this.getCollisionContext()
    ctx.comboMultiplier = this.comboMultiplier
    ctx.boss = this.boss
    ctx.hazards = this.hazards
    ctx.dt = envDt
    CollisionSystem.resolveCollisions(ctx)
  }

  /**
   * Every chained mine detonation passes through here — the one place a cascade
   * pays out, so bullet, laser and cascade all award score once and destroy the
   * enemies caught in the blast through the same path a direct hit uses.
   */
  private handleDetonateChainedMine(mine: SeaMine): void {
    this.fx.bigExplosion(mine.x, mine.y, '#ff4400')
    this.sound.explosion()
    const points = mine.points * this.comboMultiplier
    this.scoring.addScore(points)
    this.objectives.onScoreGained(points)
    this.fx.scorePopup(mine.x, mine.y - 10, `+${points}`)

    const ctx = this.getCollisionContext()
    ctx.comboMultiplier = this.comboMultiplier
    CollisionSystem.destroyEnemiesInRadius(ctx, mine.x, mine.y, MINE_CHAIN_RADIUS, '#ffaa00')
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
    const width = this.canvas.width / this.dpr
    const height = this.canvas.height / this.dpr

    if (typeof this.ctx.setTransform === 'function') {
      this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0)
    }
    this.ui.setDistanceMeters(Math.floor(this.state.distance / DISTANCE_PX_PER_METER))
    this.ctx.clearRect(0, 0, width, height)

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
    // Environmental hazards (Whirlpools, Sea Mines, Shore Bunkers)
    this.hazardRenderer.render(this.ctx, this.hazards, this.reducedMotion)
    // Gameplay entities always remain bright for readability
    this.fuelSystem.render(this.ctx)
    this.powerUpSystem.render(this.ctx)
    this.enemyManager.render(this.ctx, this.colorblind)
    if (this.boss && this.boss.active) {
      this.bossRenderer.render(this.ctx, this.boss)
    }
    if (this.ghostReplayEnabled) {
      const ghost = this.ghostReplay.getGhostStateAtTime(this.gameTime)
      if (ghost) {
        this.ghostRenderer.render(this.ctx, ghost, this.player.animFrame)
      }
    }
    this.player.render(this.ctx)
    this.fx.render(this.ctx)
    this.renderShockwave(this.ctx)

    this.ctx.restore()

    // Dynamic 2D Lighting mask (carves headlight & point lights during sunset, night & dawn)
    const darknessAlpha = this.lighting.getDarknessAlpha(
      this.atmosphere.getPhaseIndex(),
      this.atmosphere.getPhaseProgress(),
      this.atmosphere.isNight()
    )
    this.lighting.render(
      this.ctx,
      this.player,
      this.player.bullets,
      this.fx.getActiveExplosionCenters(),
      darknessAlpha,
      this.lightingEnabled
    )

    // Procedural Weather particles (Rain with lightning, Sandstorm, Smog, Snow)
    this.weather.render(
      this.ctx,
      width,
      height,
      this.weatherEnabled,
      this.reducedMotion
    )

    let bossData: BossHudData | null = null
    if (this.boss && this.boss.isAlive) {
      this.bossHud.healthRatio = this.boss.healthRatio
      this.bossHud.phase = this.boss.phase
      this.bossHud.isAlive = true
      bossData = this.bossHud
    }

    const overdriveData = this.overdriveHud
    overdriveData.energyRatio = this.overdrive.energyRatio
    overdriveData.isActive = this.overdrive.isActive
    overdriveData.isReady = this.overdrive.isReady
    overdriveData.remainingTimer = this.overdrive.remainingTimer
    overdriveData.activeRatio = this.overdrive.activeRatio

    const minimapData = this.gameModeConfig.minimapEnabled
      ? {
          player: { x: this.player.x, y: this.player.y },
          segments: this.world.segments,
          enemies: this.collectActiveEntities(this.enemyManager.enemies, this.minimapEnemies),
          fuelTanks: this.collectActiveEntities(this.fuelSystem.tanks, this.minimapFuelTanks),
          powerUps: this.collectActiveEntities(this.powerUpSystem.powerUps, this.minimapPowerUps),
        }
      : undefined

    this.ui.render(
      this.ctx, this.score, this.fuelSystem.fuel, width,
      this.sound.isMuted(), this.paused,
      minimapData,
      this.player.doubleShotTimer,
      this.slowMotionTimer,
      { multiplier: this.comboMultiplier, timer: this.comboAnimTimer, maxTimer: this.comboLevelTimer },
      this.objectives.getHudData(),
      this.lives,
      this.player.rapidFireTimer,
      this.player.magnetFuelTimer,
      bossData,
      overdriveData,
    )

    this.debugPanel.render(this.ctx, width)

    // CRT scanlines — screen-space overlay applied last, over everything including HUD
    this.atmosphere.renderScanlines(this.ctx, width, height)
  }

  private checkExtraLife(): void {
    while (this.score >= this.extraLifeThreshold) {
      this.extraLifeThreshold += EXTRA_LIFE_SCORE_INTERVAL
      this.lives++
      this.ui.pushToast(this.locale?.hudExtraLife || 'EXTRA LIFE!', '+1')
      this.sound.powerUpBomb()
    }
  }

  private checkNearMisses(): void {
    this.nearMissCooldown = Math.max(0, this.nearMissCooldown - 1 / 60)
    if (this.nearMissCooldown > 0) return

    for (const bullet of this.enemyManager.bullets) {
      if (!bullet.active) continue
      if (bullet.nearMissRewarded) continue
      const dx = this.player.x - bullet.x
      const dy = this.player.y - bullet.y
      const dist = Math.sqrt(dx * dx + dy * dy)
      const minDist = this.player.width / 2 + bullet.width / 2
      if (dist < NEAR_MISS_DISTANCE && dist >= minDist) {
        bullet.nearMissRewarded = true
        this.scoring.addScore(NEAR_MISS_POINTS)
        this.overdrive.onNearMiss()
        this.fx.scorePopup(bullet.x, bullet.y - 10, `+${NEAR_MISS_POINTS}`)
        this.fx.flash('#00ffcc', 0.1)
        this.nearMissCooldown = NEAR_MISS_COOLDOWN
        break
      }
    }
  }

  handlePlayerDeath(): void {
    if (this.gameOverTriggered) return
    this.achievements.onPlayerDeath()
    this.haptics.triggerPlayerDamage()
    this.vibrate(60)

    if (this.gameModeConfig.infiniteLives) {
      this.registerMiss()
      this.respawnTimeoutId = setTimeout(() => {
        this.respawnTimeoutId = null
        if (!this.running || this.gameOverTriggered) return
        this.fuelSystem.fuel = 100
        this.player.respawn(this.canvas.width, this.canvas.height)
      }, RESPAWN_DELAY)
      return
    }

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

    if (this.gameModeConfig.trackAchievements) {
      this.achievements.onGameOver(this.score, this.comboMultiplier)
    }

    this.careerStats.recordRun({
      flightTimeSeconds: this.gameTime,
      score: this.score,
      fuelPickedUp: this.sessionFuelCount,
      enemiesKilled: this.sessionEnemiesKilled,
      shotsFired: this.sessionShotsFired,
      shotsHit: this.sessionShotsHit,
      highestCombo: this.sessionHighestCombo,
    })

    if (this.gameModeConfig.recordGhost) {
      this.ghostReplay.saveIfBest(this.gameModeId, this.score, this.gameTime)
    }

    this.fx.addShake(15, 0.6)
    this.sound.gameOver()
    const isNewBest = this.score > this.getHighScore()
    if (isNewBest && this.gameModeConfig.trackLeaderboard) {
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
