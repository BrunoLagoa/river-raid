// ─── IntroCinematic.ts ───────────────────────────────────────────────────────
// Diretor da cinemática de abertura. Não é um vídeo nem uma cena à parte: roda
// dentro da própria engine, sobre o mesmo rio, cenário, ciclo dia/noite, clima,
// iluminação e trilha do gameplay — e termina entregando o controle ao jogador
// sem troca de cena: as faixas de cinema recolhem e viram o HUD.
//
//   0.0s  ABERTURA     o monitor liga como um CRT; o rio à noite, sob chuva
//   2.4s  AMBIENTAÇÃO  o QG narra; patrulhas inimigas são marcadas no rio
//  15.5s  CONFLITO     o rio quase para; uma silhueta imensa surge no escuro
//  22.5s  CONTEXTO     corte seco; o caça sobe do fundo com o farol e o sol
//  30.5s  CLÍMAX       enquadramento de jogo; o caça derruba a ponte; título
//  37.0s  TRANSIÇÃO    o jogador assume enquanto o HUD entra
//
// O diretor só decide *o quê* e *quando*. O Game continua dono dos subsistemas
// e lê daqui os parâmetros de cada frame (velocidade do rio, hora do dia, clima,
// escuridão, câmera); efeitos pontuais (SFX, partículas, relâmpago, autopiloto)
// passam pelo `IntroContext`, no mesmo molde do `CollisionContext`.
//
// Não pontua, não conta conquistas e não mexe em timers de gameplay. Como o rio
// segue rolando (e o mundo consome o RNG ao gerar margens), só deve ser armada
// em partidas sem seed — nunca no desafio diário.

import { BossDreadnought } from './BossDreadnought'
import { BULLET_STYLES } from './BulletStyles'
import { ENEMY_COLORS, ENEMY_CONFIGS, type Enemy, type EnemyType } from './EnemyTypes'
import { CYCLE_DURATION, PHASE_DURATION } from './Atmosphere'
import type { WeatherType } from './BiomeSystem'
import type { Fx } from './Fx'
import type { HapticsEngine } from './HapticsEngine'
import type { Player } from './Player'
import type { SoundManager } from './SoundManager'
import type { WeatherSystem } from './WeatherSystem'
import { BASE_SCROLL_SPEED, BOSS_HEIGHT, BOSS_WIDTH, PLAYER_RESPAWN_Y_OFFSET } from './constants'

export type IntroStage = 'cinematic' | 'handover' | 'done'
export type IntroContactKind = 'hostile' | 'bridge' | 'unknown'

/** Textos da cena — vêm do i18n via `Game.setLocale`; a engine não hardcoda nenhum. */
export interface IntroLabels {
  stampNight: string
  stampDawn: string
  speaker: string
  /** Transmissões do QG, na ordem do roteiro. */
  lines: readonly string[]
  contactHostile: string
  contactBridge: string
  contactUnknown: string
  /** Nome da aeronave equipada no hangar. */
  pilot: string
  callsign: string
  subtitle: string
  title: string
  tagline: string
  missionStart: string
}

/**
 * Subsistemas que o roteiro aciona diretamente. O diretor nunca alcança o Game:
 * tudo o que ele pode tocar está aqui.
 */
export interface IntroContext {
  world: {
    getBoundsAtY: (y: number) => { left: number; right: number }
    holdCourse: (pixels: number) => void
  }
  player: Player
  fx: Fx
  sound: SoundManager
  weather: WeatherSystem
  haptics: HapticsEngine
  /** Dimensões lógicas (px CSS) do canvas. */
  width: number
  height: number
  reducedMotion: boolean
}

export interface IntroLight {
  x: number
  y: number
  radius: number
  active: boolean
}

export interface IntroLock {
  active: boolean
  kind: IntroContactKind
  /** Segundos desde que a mira travou. */
  age: number
  /** Índice do adereço rastreado, ou `INTRO_BOSS_TARGET` para a silhueta do chefe. */
  target: number
}

export interface IntroCamera {
  zoom: number
  focusX: number
  focusY: number
}

export interface IntroTextView {
  index: number
  chars: number
  alpha: number
  typing: boolean
}

export interface IntroStampView {
  dawn: boolean
  chars: number
  alpha: number
}

export interface IntroBox {
  x: number
  y: number
  w: number
  h: number
}

/** Duração da parte cinematográfica (s); depois dela o jogador assume. */
export const INTRO_CINEMATIC_DURATION = 37
/** Janela em que as faixas recolhem e o HUD entra, com o jogo já rodando (s). */
export const INTRO_HANDOVER_DURATION = 2
/** Segundos de rio e cenário simulados antes do 1º frame, para as margens não nascerem vazias. */
export const INTRO_PREWARM_SECONDS = 8
/** Quanto tempo uma marcação de alvo fica na tela (s). */
export const INTRO_LOCK_LIFETIME = 3.4
/** `IntroLock.target` que aponta para a silhueta do chefe em vez de um adereço. */
export const INTRO_BOSS_TARGET = -1

/** Altura de cada faixa de cinema (px lógicos). O botão PULAR do DOM usa a mesma conta. */
export function letterboxHeight(viewH: number): number {
  return Math.round(Math.min(104, Math.max(64, viewH * 0.12)))
}

/**
 * Altura em que o caça termina a cena: logo acima da faixa inferior de cinema —
 * a posição de respawn do gameplay cairia atrás dela no clímax — e nunca abaixo
 * da de respawn. O jogador assume dali, sem salto.
 */
export function introJetHomeY(viewH: number): number {
  return Math.min(viewH - PLAYER_RESPAWN_Y_OFFSET, viewH - letterboxHeight(viewH) - 56)
}

// ─── Roteiro ─────────────────────────────────────────────────────────────────

const T = {
  openEnd: 1.6,
  threat: 15.5,
  crawl: 17.5,
  bossRise: 16.2,
  bossSettle: 19.6,
  coreOpen: 20.2,
  cut: 22.5,
  heroIn: 22.85,
  heroRise: 25.6,
  headlightOff: 29.8,
  climax: 30.5,
  fire: 31.3,
  dayBreak: 31.5,
  bridgeFallback: 33.4,
  titleOut: 35.9,
  titleGone: 36.7,
} as const

/** Janelas das transmissões do QG, na ordem de `IntroLabels.lines`. */
const TRANSMISSIONS: ReadonlyArray<{ start: number; end: number }> = [
  { start: 2.4, end: 7.9 },
  { start: 8.4, end: 14.9 },
  { start: 16.3, end: 22.2 },
  { start: 23.5, end: 28.4 },
  { start: 28.8, end: 32.4 },
]

const STAMPS: ReadonlyArray<{ start: number; end: number; dawn: boolean }> = [
  { start: 0.9, end: T.cut, dawn: false },
  { start: 23.3, end: 30.2, dawn: true },
]

const HERO_CARD = { start: 24.2, end: 29.4 } as const

/** Caracteres por segundo da "máquina de escrever" do rádio e do carimbo. */
const TYPE_CPS = 30
const STAMP_CPS = 42

type CueId = 'powerOn' | 'straighten' | 'lightning' | 'flyby' | 'threat' | 'reveal' | 'coreAlarm' | 'cut' | 'heroIn' | 'drumsIn'

/** Eventos pontuais, em ordem de tempo. Transmissões disparam o próprio estalo de rádio. */
const CUES: ReadonlyArray<{ at: number; id: CueId }> = [
  { at: 0.3, id: 'powerOn' },
  { at: 9.0, id: 'straighten' },
  { at: 10.6, id: 'lightning' },
  { at: 13.0, id: 'flyby' },
  { at: T.threat, id: 'threat' },
  { at: 18.6, id: 'reveal' },
  { at: 18.85, id: 'lightning' },
  { at: T.coreOpen, id: 'coreAlarm' },
  { at: T.cut, id: 'cut' },
  { at: T.heroIn, id: 'heroIn' },
  { at: T.climax, id: 'drumsIn' },
]

type PropMotion = 'water' | 'air' | 'bridge' | 'rider' | 'flyby'

interface PropCue {
  type: EnemyType
  motion: PropMotion
  /** Quando o adereço entra no roteiro (s). */
  spawn: number
  /** Instante (s) em que ele precisa passar por `markY` — a âncora da coreografia. */
  mark: number
  /** Fração da altura da tela em `mark`. */
  markY: number
  /** Faixa lateral como fração da meia-largura do rio (-1 esquerda … 1 direita). */
  lane: number
  /** Amplitude do balanço lateral, na mesma unidade de `lane`. */
  sway: number
  swayRate: number
  /** Velocidade própria somada à correnteza (px/s; negativa = rio acima). */
  drift: number
  lock?: 'hostile' | 'bridge'
}

/**
 * Os "atores" do roteiro. A posição inicial de cada um é calculada a partir da
 * marca (onde precisa estar e quando), então a coreografia independe da altura
 * da tela e da taxa de quadros.
 */
const PROP_SCRIPT: readonly PropCue[] = [
  { type: 'gunboat', motion: 'water', spawn: 0, mark: 5.4, markY: 0.44, lane: -0.35, sway: 0.18, swayRate: 0.55, drift: -10, lock: 'hostile' },
  { type: 'helicopter', motion: 'air', spawn: 0, mark: 7.0, markY: 0.3, lane: 0.55, sway: 0.1, swayRate: 1.1, drift: -6, lock: 'hostile' },
  { type: 'boat', motion: 'water', spawn: 0, mark: 8.6, markY: 0.62, lane: 0.2, sway: 0.22, swayRate: 0.7, drift: -14 },
  { type: 'helicopter', motion: 'air', spawn: 0, mark: 11.2, markY: 0.22, lane: -0.7, sway: 0.08, swayRate: 1.3, drift: -4 },
  { type: 'bridge', motion: 'bridge', spawn: 0, mark: 11.6, markY: 0.36, lane: 0, sway: 0, swayRate: 0, drift: 0, lock: 'bridge' },
  { type: 'tank', motion: 'rider', spawn: 0, mark: 11.6, markY: 0.36, lane: -0.42, sway: 0, swayRate: 0, drift: 0 },
  { type: 'plane', motion: 'flyby', spawn: 13.0, mark: 13.0, markY: 0, lane: 0.3, sway: 0, swayRate: 0, drift: 430 },
  // Alvo do clímax: chega à mira exatamente quando a rajada do caça sobe.
  { type: 'bridge', motion: 'bridge', spawn: T.cut, mark: 32.45, markY: 0.3, lane: 0, sway: 0, swayRate: 0, drift: 0 },
]
/** Ponte sobre a qual o tanque (`rider`) está parado. */
const RIDER_HOST = 4
const CLIMAX_BRIDGE = PROP_SCRIPT.length - 1

/** Raio da luz de posição de cada adereço na máscara noturna. */
const PROP_LIGHT_RADIUS: Record<EnemyType, number> = {
  helicopter: 42,
  plane: 48,
  boat: 32,
  gunboat: 36,
  tank: 28,
  bridge: 92,
}

/**
 * Rio reto segurado a partir do cue `straighten` (px gerados). Cobre do trecho que
 * estará sob o caça no clímax — gerado por volta dos 9 s mesmo em telas altas —
 * até a entrega do controle.
 */
const STRAIGHT_RIVER_PX = 2000
const LIGHTNING_FLASH = 0.16
const LOCK_GAP = 0.5
const LOCK_ZONE_TOP = 0.16
const LOCK_ZONE_BOTTOM = 0.74
const BLAST_OFFSETS: readonly number[] = [0, -1, 1]
/** Noite fechada: o começo da fase 2 do Atmosphere, antes da mistura para o amanhecer. */
const NIGHT_CYCLE_TIME = PHASE_DURATION * 2.1

const EMPTY_LABELS: IntroLabels = {
  stampNight: '',
  stampDawn: '',
  speaker: '',
  lines: [],
  contactHostile: '',
  contactBridge: '',
  contactUnknown: '',
  pilot: '',
  callsign: '',
  subtitle: '',
  title: '',
  tagline: '',
  missionStart: '',
}

// ─── Curvas ──────────────────────────────────────────────────────────────────

const clamp01 = (v: number): number => (v < 0 ? 0 : v > 1 ? 1 : v)
const lerp = (a: number, b: number, t: number): number => a + (b - a) * t
/** Fração 0–1 de `t` dentro de [a, b]. */
const span = (t: number, a: number, b: number): number => clamp01((t - a) / (b - a))
const smooth = (t: number): number => {
  const k = clamp01(t)
  return k * k * (3 - 2 * k)
}
const easeOut = (t: number): number => 1 - Math.pow(1 - clamp01(t), 3)
const easeIn = (t: number): number => Math.pow(clamp01(t), 3)

/** Velocidade do rio (px/s) ao longo do roteiro: deriva, quase para, dispara. */
export function introScrollSpeedAt(t: number): number {
  if (t < T.threat) return 58
  if (t < T.cut) return lerp(58, 16, smooth(span(t, T.threat, T.crawl)))
  if (t < T.climax) return lerp(34, BASE_SCROLL_SPEED + 10, easeIn(span(t, T.cut, T.climax)))
  return lerp(BASE_SCROLL_SPEED + 10, BASE_SCROLL_SPEED, span(t, T.climax, T.climax + 2))
}

/** Hora do ciclo dia/noite (s do Atmosphere): noite fechada → amanhecer → dia. */
export function introCycleTimeAt(t: number): number {
  if (t < T.cut) return NIGHT_CYCLE_TIME
  return lerp(NIGHT_CYCLE_TIME, CYCLE_DURATION, smooth(span(t, T.cut, T.dayBreak)))
}

/** Opacidade base da máscara de escuridão; o sol a apaga até o clímax. */
export function introDarknessAt(t: number): number {
  // Noite legível na abertura (margens e cenário ainda aparecem); fecha na ameaça.
  if (t < T.threat) return 0.45
  if (t < T.cut) return lerp(0.45, 0.82, smooth(span(t, T.threat, T.bossSettle)))
  return lerp(0.78, 0, smooth(span(t, T.cut, T.dayBreak)))
}

function makePropEnemy(type: EnemyType): Enemy {
  const cfg = ENEMY_CONFIGS[type]
  const base = { aiTier: 'basic' as const, x: 0, y: 0, width: cfg.width, height: cfg.height, speed: 0, active: false, points: 0 }
  switch (type) {
    case 'helicopter':
      return { ...base, type, canShoot: false, shootCooldown: 0, shootInterval: 0, phase: 0, phaseSpeed: 0, amplitude: 0, originX: 0 }
    case 'plane':
      return { ...base, type, canShoot: false, shootCooldown: 0, shootInterval: 0 }
    case 'boat':
      return { ...base, type, phase: 0, phaseSpeed: 0, amplitude: 0, originX: 0 }
    case 'bridge':
      return { ...base, type }
    case 'tank':
      return { ...base, type, canShoot: false, shootCooldown: 0, shootInterval: 0, originX: 0, phase: 0, phaseSpeed: 0, amplitude: 0 }
    case 'gunboat':
      return { ...base, type, canShoot: false, shootCooldown: 0, shootInterval: 0, hasMovement: false, originX: 0, phase: 0, phaseSpeed: 0, amplitude: 0 }
  }
}

// ─── Diretor ─────────────────────────────────────────────────────────────────

export class IntroCinematic {
  stage: IntroStage = 'cinematic'
  /** Relógio do roteiro (s). Para no fim da cena — inclusive quando pulada. */
  time = 0
  /** Tempo decorrido na transição para o gameplay (s). */
  handoverTime = 0
  skipped = false
  labels: IntroLabels = EMPTY_LABELS
  /** Atores do roteiro, no formato que o EnemyRenderer já sabe desenhar. */
  readonly props: Enemy[] = PROP_SCRIPT.map((cue) => makePropEnemy(cue.type))
  /** Uma luz por adereço + o núcleo do chefe — repassadas ao LightingSystem. */
  readonly lights: IntroLight[] = Array.from({ length: PROP_SCRIPT.length + 1 }, () => ({ x: 0, y: 0, radius: 0, active: false }))
  readonly locks: IntroLock[] = Array.from({ length: 4 }, (): IntroLock => ({ active: false, kind: 'hostile', age: 0, target: 0 }))
  /** Silhueta do Dreadnought: só um vislumbre no escuro, nunca o chefe inteiro à luz. */
  readonly boss = new BossDreadnought(0, -BOSS_HEIGHT, () => 0.5)
  bossVisible = false
  readonly camera: IntroCamera = { zoom: 1, focusX: 0, focusY: 0 }
  /** Camadas da trilha adaptativa que o roteiro liga e desliga. */
  readonly intensity = { comboMax: false, lowFuel: false, inBossFight: false }
  /** Modulação do rastro de fumaça (mesma escala do gameplay: > 1.2 = acelerando). */
  jetSpeedMod = 1
  jetX = 0
  jetY = 0

  private begun = false
  private viewW = 0
  private viewH = 0
  private reducedMotion = false
  private cueIndex = 0
  private transmission = -1
  private flashTimer = 0
  private lockCooldown = 0
  private bridgeDownAt = -1
  private blastsLeft = 0
  private blastTimer = 0
  private blastX = 0
  private blastY = 0
  private blastSpan = 0
  private readonly spawned: boolean[] = PROP_SCRIPT.map(() => false)
  private readonly locked: boolean[] = PROP_SCRIPT.map(() => false)
  private readonly propPhase: number[] = PROP_SCRIPT.map((_, i) => i * 1.7)
  private readonly point = { x: 0, y: 0 }
  /** Centro do rio suavizado que a câmera acompanha na noite e na ameaça. */
  private cameraRiverX = 0
  private cameraTracking = false
  private onStageChange: ((stage: IntroStage) => void) | null = null

  setLabels(labels: IntroLabels): void {
    this.labels = labels
  }

  setOnStageChange(cb: (stage: IntroStage) => void): void {
    this.onStageChange = cb
  }

  // ── Parâmetros de frame lidos pelo Game ─────────────────────────────────────

  get scrollSpeed(): number {
    return introScrollSpeedAt(this.time)
  }

  get cycleTime(): number {
    return introCycleTimeAt(this.time)
  }

  /** Chuva enquanto é noite; o corte para o herói deixa o céu limpo. */
  get weatherType(): WeatherType {
    return this.time < T.cut ? 'rain' : 'clear'
  }

  /** Farol aceso do herói até o dia clarear (o LightingSystem anima o warm-up). */
  get headlightOn(): boolean {
    return this.time >= T.heroIn + 0.1 && this.time < T.headlightOff
  }

  get jetVisible(): boolean {
    return this.time >= T.heroIn
  }

  /** Opacidade da máscara de escuridão, com o respiro de luz dos relâmpagos. */
  get darkness(): number {
    const dip = this.flashTimer > 0 ? this.flashTimer / LIGHTNING_FLASH : 0
    return introDarknessAt(this.time) * (1 - 0.85 * dip)
  }

  get bridgeDown(): boolean {
    return this.bridgeDownAt >= 0
  }

  // ── Camada de cinema (lida pelo IntroRenderer) ──────────────────────────────

  /** Faixas letterbox: 1 = fechadas, 0 = recolhidas. */
  get letterbox(): number {
    if (this.stage === 'cinematic') return 1
    return 1 - smooth(this.handoverTime / 0.9)
  }

  /** "Liga o monitor": 0 = tela preta, 1 = imagem aberta. */
  get powerOn(): number {
    return span(this.time, 0.3, T.openEnd)
  }

  /** Preto em tela cheia: o corte seco antes do herói e o fade depois de pular. */
  get blackout(): number {
    if (this.stage !== 'cinematic') return this.skipped ? 1 - span(this.handoverTime, 0.05, 0.5) : 0
    if (this.time < T.cut) return 0
    if (this.time < T.heroIn) return 1
    return 1 - span(this.time, T.heroIn, T.heroIn + 0.45)
  }

  /** Segundos desde que o título entrou (negativo antes da ponte cair). */
  get titleAge(): number {
    return this.bridgeDownAt < 0 ? -1 : this.time - this.bridgeDownAt - 0.1
  }

  get titleAlpha(): number {
    if (this.stage !== 'cinematic' || this.titleAge < 0) return 0
    return span(this.titleAge, 0, 0.3) * (1 - span(this.time, T.titleOut, T.titleGone))
  }

  /** O título "bate" na tela: começa maior e assenta. */
  get titleScale(): number {
    return 1 + 0.3 * (1 - easeOut(this.titleAge / 0.4))
  }

  /** Subida do título na saída (0–1). */
  get titleLift(): number {
    return span(this.time, T.titleOut, T.titleGone)
  }

  get taglineAlpha(): number {
    if (this.stage !== 'cinematic' || this.titleAge < 0) return 0
    return span(this.titleAge, 0.55, 0.95) * (1 - span(this.time, T.titleOut, T.titleGone))
  }

  get heroCardAlpha(): number {
    if (this.stage !== 'cinematic') return 0
    return span(this.time, HERO_CARD.start, HERO_CARD.start + 0.4) * (1 - span(this.time, HERO_CARD.end - 0.4, HERO_CARD.end))
  }

  /** "MISSÃO INICIADA", já com o jogo nas mãos do jogador. */
  get calloutAlpha(): number {
    if (this.stage !== 'handover') return 0
    return span(this.handoverTime, 0.15, 0.4) * (1 - span(this.handoverTime, 1.4, INTRO_HANDOVER_DURATION))
  }

  get calloutScale(): number {
    return 1 + 0.25 * (1 - easeOut(span(this.handoverTime, 0.15, 0.45)))
  }

  /** Entrada do HUD (0–1): escondido na cena, desce junto com a faixa que recolhe. */
  get hudReveal(): number {
    if (this.stage === 'cinematic') return 0
    if (this.stage === 'done') return 1
    return smooth((this.handoverTime - 0.2) / 0.9)
  }

  get vignette(): number {
    if (this.stage !== 'cinematic') return 0
    return 0.2 + 0.5 * clamp01(introDarknessAt(this.time) / 0.8)
  }

  readTransmission(out: IntroTextView): boolean {
    const i = this.transmission
    if (this.stage !== 'cinematic' || i < 0) return false
    const text = this.labels.lines[i]
    if (!text) return false
    const window = TRANSMISSIONS[i]
    out.index = i
    out.chars = Math.min(text.length, Math.floor((this.time - window.start) * TYPE_CPS))
    out.typing = out.chars < text.length
    out.alpha = 1 - span(this.time, window.end - 0.35, window.end)
    return out.chars > 0
  }

  readStamp(out: IntroStampView): boolean {
    if (this.stage !== 'cinematic') return false
    for (const stamp of STAMPS) {
      if (this.time < stamp.start || this.time >= stamp.end) continue
      const text = stamp.dawn ? this.labels.stampDawn : this.labels.stampNight
      out.dawn = stamp.dawn
      out.chars = Math.min(text.length, Math.floor((this.time - stamp.start) * STAMP_CPS))
      out.alpha = 1 - span(this.time, stamp.end - 0.4, stamp.end)
      return out.chars > 0
    }
    return false
  }

  /** Caixa em espaço de tela do alvo de uma marcação; false se o alvo saiu de cena. */
  readLockBox(lock: IntroLock, out: IntroBox): boolean {
    if (!lock.active) return false
    let x: number
    let y: number
    let w: number
    let h: number
    if (lock.target === INTRO_BOSS_TARGET) {
      if (!this.bossVisible) return false
      x = this.boss.x
      y = this.boss.y
      w = BOSS_WIDTH
      h = BOSS_HEIGHT
    } else {
      const prop = this.props[lock.target]
      if (!prop || !prop.active) return false
      x = prop.x
      y = prop.y
      w = prop.width
      h = prop.height
    }
    this.worldToScreen(x, y, this.point)
    out.x = this.point.x
    out.y = this.point.y
    out.w = w * this.camera.zoom
    out.h = h * this.camera.zoom
    return true
  }

  worldToScreen(x: number, y: number, out: { x: number; y: number }): void {
    const cam = this.camera
    out.x = (x - cam.focusX) * cam.zoom + this.viewW / 2
    out.y = (y - cam.focusY) * cam.zoom + this.viewH / 2
  }

  /** Aplica o enquadramento ao contexto (mundo e atores são desenhados dentro dele). */
  applyCamera(ctx: CanvasRenderingContext2D): void {
    const cam = this.camera
    // Com zoom 1 o clamp já centralizou o foco: a transformação seria identidade.
    if (cam.zoom === 1) return
    ctx.translate(this.viewW / 2, this.viewH / 2)
    ctx.scale(cam.zoom, cam.zoom)
    ctx.translate(-cam.focusX, -cam.focusY)
  }

  // ── Ciclo de vida ───────────────────────────────────────────────────────────

  /** Monta a primeira cena. Idempotente — o Game chama no `start()`. */
  begin(ctx: IntroContext): void {
    if (this.begun) return
    this.begun = true
    this.viewW = ctx.width
    this.viewH = ctx.height
    this.reducedMotion = ctx.reducedMotion
    // A chuva da abertura não passa pelo sorteio de ocorrência do bioma.
    ctx.weather.forceWeather('rain')
    for (let i = 0; i < PROP_SCRIPT.length; i++) {
      if (PROP_SCRIPT[i].spawn <= 0) {
        this.spawned[i] = true
        this.spawnProp(i, ctx)
      }
    }
    this.parkJet(ctx)
    this.updateCamera(ctx, 0)
    this.onStageChange?.('cinematic')
  }

  update(dt: number, ctx: IntroContext): void {
    if (this.stage !== 'cinematic' || !(dt >= 0)) return
    this.begin(ctx)
    this.viewW = ctx.width
    this.viewH = ctx.height
    this.reducedMotion = ctx.reducedMotion
    this.time = Math.min(INTRO_CINEMATIC_DURATION, this.time + dt)
    if (this.flashTimer > 0) this.flashTimer = Math.max(0, this.flashTimer - dt)

    this.fireCues(ctx)
    this.updateTransmission(ctx)
    this.updateProps(ctx, dt)
    this.updateBoss(ctx, dt)
    this.updateJet(ctx, dt)
    this.updateClimax(ctx, dt)
    this.updateLocks(ctx, dt)
    this.updateLights()
    this.updateCamera(ctx, dt)
    ctx.sound.setDynamicIntensity(this.intensity)

    if (this.time >= INTRO_CINEMATIC_DURATION) this.enterHandover(ctx, false)
  }

  /** Relógio da transição; roda com o gameplay já ativo. */
  updateHandover(dt: number): void {
    if (this.stage !== 'handover' || !(dt > 0)) return
    this.handoverTime += dt
    if (this.handoverTime >= INTRO_HANDOVER_DURATION) this.setStage('done')
  }

  /** Pula direto para a transição, deixando a cena num estado coerente com o gameplay. */
  skip(ctx: IntroContext): void {
    if (this.stage !== 'cinematic') return
    this.skipped = true
    this.time = INTRO_CINEMATIC_DURATION
    for (const prop of this.props) prop.active = false
    for (const lock of this.locks) lock.active = false
    this.blastsLeft = 0
    this.flashTimer = 0
    this.enterHandover(ctx, true)
  }

  // ── Roteiro ─────────────────────────────────────────────────────────────────

  private fireCues(ctx: IntroContext): void {
    while (this.cueIndex < CUES.length && CUES[this.cueIndex].at <= this.time) {
      this.runCue(CUES[this.cueIndex].id, ctx)
      this.cueIndex++
    }
  }

  private runCue(id: CueId, ctx: IntroContext): void {
    switch (id) {
      case 'powerOn':
        ctx.sound.radioClick()
        break
      case 'straighten':
        // Com curva entre o caça e a ponte a rajada não alcança o alvo: o trecho
        // do clímax precisa ser reto. O que o mundo gera agora é o que estará lá.
        ctx.world.holdCourse(STRAIGHT_RIVER_PX)
        break
      case 'lightning':
        this.strike(ctx)
        break
      case 'flyby':
        ctx.sound.jetFlyby(0.55)
        break
      case 'threat':
        // O rio "prende a respiração": trilha abafada e um estrondo distante.
        this.intensity.lowFuel = true
        ctx.sound.bombShockwave()
        ctx.fx.addShake(3, 1.4)
        break
      case 'reveal':
        this.strike(ctx)
        this.acquireLock('unknown', INTRO_BOSS_TARGET)
        ctx.sound.alarm()
        ctx.fx.addShake(6, 0.7)
        ctx.haptics.triggerBossAlert()
        break
      case 'coreAlarm':
        ctx.sound.alarm()
        break
      case 'cut':
        // Corte seco para o preto: silêncio antes do herói.
        ctx.sound.stopMusic()
        this.intensity.lowFuel = false
        for (let i = 0; i < CLIMAX_BRIDGE; i++) this.props[i].active = false
        for (const lock of this.locks) lock.active = false
        break
      case 'heroIn':
        // O tema recomeça junto com o caça — agora aberto, sem o filtro da ameaça.
        ctx.sound.startIntroMusic()
        ctx.sound.jetFlyby(1)
        break
      case 'drumsIn':
        this.intensity.inBossFight = true
        break
    }
  }

  private updateTransmission(ctx: IntroContext): void {
    let current = -1
    for (let i = 0; i < TRANSMISSIONS.length; i++) {
      if (this.time >= TRANSMISSIONS[i].start && this.time < TRANSMISSIONS[i].end) {
        current = i
        break
      }
    }
    if (current >= 0 && current !== this.transmission) ctx.sound.radioClick()
    this.transmission = current
  }

  private strike(ctx: IntroContext): void {
    ctx.weather.triggerLightning(LIGHTNING_FLASH)
    ctx.sound.bombShockwave()
    // Respiro de luz na máscara; com movimento reduzido fica só o trovão.
    if (!ctx.reducedMotion) this.flashTimer = LIGHTNING_FLASH
  }

  // ── Atores ──────────────────────────────────────────────────────────────────

  private spawnProp(i: number, ctx: IntroContext): void {
    const cue = PROP_SCRIPT[i]
    const prop = this.props[i]
    prop.active = true
    this.locked[i] = false
    if (cue.motion === 'rider') return
    prop.y = cue.motion === 'flyby'
      ? -prop.height * 2
      : cue.markY * ctx.height - this.travel(this.time, cue.mark, cue.drift)
    this.placeX(i, ctx)
  }

  /** Quanto o adereço desce entre `t0` e `t1` com a correnteza do roteiro. */
  private travel(t0: number, t1: number, drift: number): number {
    const step = 1 / 30
    let distance = 0
    for (let t = t0; t < t1; t += step) {
      const dt = Math.min(step, t1 - t)
      distance += (introScrollSpeedAt(t) + drift) * dt
    }
    return distance
  }

  private placeX(i: number, ctx: IntroContext): void {
    const cue = PROP_SCRIPT[i]
    const prop = this.props[i]
    const bounds = ctx.world.getBoundsAtY(prop.y)
    const half = (bounds.right - bounds.left) / 2
    prop.x = (bounds.left + bounds.right) / 2 + (cue.lane + cue.sway * Math.sin(this.propPhase[i])) * half
  }

  private riverCenter(ctx: IntroContext, y: number): number {
    const bounds = ctx.world.getBoundsAtY(y)
    return (bounds.left + bounds.right) / 2
  }

  private updateProps(ctx: IntroContext, dt: number): void {
    const speed = this.scrollSpeed
    for (let i = 0; i < PROP_SCRIPT.length; i++) {
      const cue = PROP_SCRIPT[i]
      const prop = this.props[i]
      if (!this.spawned[i]) {
        if (this.time < cue.spawn) continue
        this.spawned[i] = true
        this.spawnProp(i, ctx)
      }
      if (!prop.active) continue

      if (cue.motion === 'rider') {
        // Parado sobre a ponte hospedeira: some junto com ela.
        const host = this.props[RIDER_HOST]
        prop.active = host.active
        prop.x = host.x + cue.lane * host.width / 2
        prop.y = host.y
        continue
      }

      this.propPhase[i] += dt * cue.swayRate
      prop.y += (cue.motion === 'flyby' ? cue.drift : speed + cue.drift) * dt
      this.placeX(i, ctx)
      if (prop.y > ctx.height + 90) prop.active = false
    }
  }

  private updateBoss(ctx: IntroContext, dt: number): void {
    const t = this.time
    const wasVisible = this.bossVisible
    this.bossVisible = t >= T.bossRise && t < T.cut
    if (!this.bossVisible) return

    const boss = this.boss
    const settleY = ctx.height * 0.2
    boss.y = t < T.bossSettle
      ? lerp(-BOSS_HEIGHT * 0.62, settleY, easeOut(span(t, T.bossRise, T.bossSettle)))
      : settleY + (t - T.bossSettle) * 5
    const target = this.riverCenter(ctx, boss.y)
    boss.x = wasVisible ? boss.x + (target - boss.x) * Math.min(1, dt * 1.5) : target
    // O núcleo "abre o olho" já perto do corte: reator vermelho e propulsores em fúria.
    boss.phase = t >= T.coreOpen ? 3 : 1
    const sweep = Math.sin(t * 0.9) * 0.45
    for (const turret of boss.turrets) {
      turret.angle = Math.PI / 2 + (turret.xOffset < 0 ? sweep : -sweep)
    }
    // O relâmpago acende o casco inteiro por um instante (flash de dano do renderer).
    boss.damageFlashTimer = this.flashTimer > LIGHTNING_FLASH * 0.35 ? 1 : 0
  }

  private parkJet(ctx: IntroContext): void {
    ctx.player.x = ctx.width / 2
    ctx.player.y = ctx.height + 220
    this.jetX = ctx.player.x
    this.jetY = ctx.player.y
  }

  private updateJet(ctx: IntroContext, dt: number): void {
    const { player, height: h } = ctx
    const t = this.time
    const homeY = introJetHomeY(h)
    let y: number
    if (t < T.heroIn) y = h + 220
    else if (t < T.heroRise) y = lerp(h + 40, h * 0.62, easeOut(span(t, T.heroIn, T.heroRise)))
    else y = lerp(h * 0.62, homeY, smooth(span(t, T.heroRise, T.climax)))

    const bounds = ctx.world.getBoundsAtY(y)
    const half = (bounds.right - bounds.left) / 2
    const weaveFade = 1 - span(t, T.heroRise, T.climax)
    const weave = t >= T.heroIn ? Math.sin((t - T.heroIn) * 1.7) * 0.18 * half * weaveFade : 0
    let targetX = (bounds.left + bounds.right) / 2 + weave
    // Rio com curva: a ponte não fica no eixo do caça. Antes da rajada ele se
    // alinha com ela (dentro do que as margens deixam) e segura a linha depois.
    const bridge = this.props[CLIMAX_BRIDGE]
    if (t >= T.climax - 1.6 && (bridge.active || this.bridgeDownAt >= 0)) {
      const aimX = bridge.active ? bridge.x : this.blastX
      targetX = lerp(targetX, aimX, smooth(span(t, T.climax - 1.6, T.fire)))
    }
    const margin = player.width / 2 + 6
    const x = Math.max(bounds.left + margin, Math.min(bounds.right - margin, targetX))

    // O autopiloto inclina o caça pelo mesmo stick virtual que o jogador vai usar.
    const vx = dt > 0 && t >= T.heroIn ? (x - this.jetX) / dt : 0
    player.setAnalogVector(Math.max(-1, Math.min(1, vx / 60)), 0)
    player.update(dt, -Infinity, Infinity)
    player.x = x
    player.y = y
    this.jetX = x
    this.jetY = y
    this.jetSpeedMod = t < T.climax ? 1.4 : 1

    if (player.justShot) {
      player.justShot = false
      ctx.sound.shoot()
      ctx.fx.muzzleFlash(x, y - player.height / 2, BULLET_STYLES[player.currentBulletKind].body)
    }
  }

  private updateClimax(ctx: IntroContext, dt: number): void {
    if (this.blastsLeft > 0) {
      this.blastTimer -= dt
      if (this.blastTimer <= 0) this.blast(ctx)
    }
    if (this.bridgeDownAt >= 0) return

    const { player } = ctx
    player.setTouchShoot(this.time >= T.fire)
    const bridge = this.props[CLIMAX_BRIDGE]
    if (bridge.active) {
      const bullets = player.bullets
      for (let i = 0; i < bullets.length; i++) {
        const b = bullets[i]
        if (!b.active || Math.abs(b.x - bridge.x) > bridge.width / 2) continue
        if (b.y > bridge.y + bridge.height / 2 || b.y < bridge.y - bridge.height / 2 - 16) continue
        b.active = false
        this.destroyBridge(ctx)
        return
      }
    }
    // Rede de segurança: a ponte cai no tempo certo mesmo se nenhum tiro encostar.
    if (this.time >= T.bridgeFallback) this.destroyBridge(ctx)
  }

  private destroyBridge(ctx: IntroContext): void {
    const bridge = this.props[CLIMAX_BRIDGE]
    this.bridgeDownAt = this.time
    this.blastX = bridge.active ? bridge.x : ctx.width / 2
    this.blastY = bridge.active ? bridge.y : ctx.height * 0.3
    this.blastSpan = bridge.width * 0.34
    bridge.active = false
    ctx.player.setTouchShoot(false)
    this.blastsLeft = BLAST_OFFSETS.length
    this.blast(ctx)
    ctx.fx.deathSmoke(this.blastX, this.blastY)
    ctx.fx.triggerShockwave(this.blastX, this.blastY, 0.9)
    ctx.fx.addShake(11, 0.55)
    if (!ctx.reducedMotion) ctx.fx.flash('#ffffff', 0.35)
    ctx.sound.bombShockwave()
    ctx.haptics.triggerBridgeDestroy()
    this.intensity.comboMax = true
  }

  /** Explosões em cadeia ao longo da ponte: centro em chamas, pontas em destroços. */
  private blast(ctx: IntroContext): void {
    const i = BLAST_OFFSETS.length - this.blastsLeft
    const x = this.blastX + BLAST_OFFSETS[i] * this.blastSpan
    ctx.fx.bigExplosion(x, this.blastY, i === 0 ? '#ff8800' : ENEMY_COLORS.bridge)
    ctx.sound.explosion()
    this.blastsLeft--
    this.blastTimer = 0.11
  }

  // ── Marcações de alvo e luzes ───────────────────────────────────────────────

  private updateLocks(ctx: IntroContext, dt: number): void {
    this.lockCooldown -= dt
    for (const lock of this.locks) {
      if (!lock.active) continue
      lock.age += dt
      const onBoss = lock.target === INTRO_BOSS_TARGET
      const alive = onBoss ? this.bossVisible : this.props[lock.target].active
      if (!alive || (!onBoss && lock.age > INTRO_LOCK_LIFETIME)) lock.active = false
    }
    if (this.lockCooldown > 0) return

    // Uma trava por vez, quando o contato entra na zona de leitura da tela.
    for (let i = 0; i < PROP_SCRIPT.length; i++) {
      const kind = PROP_SCRIPT[i].lock
      const prop = this.props[i]
      if (!kind || this.locked[i] || !prop.active) continue
      this.worldToScreen(prop.x, prop.y, this.point)
      const inZone = this.point.y >= this.viewH * LOCK_ZONE_TOP && this.point.y <= this.viewH * LOCK_ZONE_BOTTOM
        && this.point.x > 0 && this.point.x < this.viewW
      if (!inZone || !this.acquireLock(kind, i)) continue
      this.locked[i] = true
      this.lockCooldown = LOCK_GAP
      ctx.sound.radarPing()
      break
    }
  }

  private acquireLock(kind: IntroContactKind, target: number): boolean {
    for (const lock of this.locks) {
      if (lock.active) continue
      lock.active = true
      lock.kind = kind
      lock.age = 0
      lock.target = target
      return true
    }
    return false
  }

  private updateLights(): void {
    const night = introDarknessAt(this.time) > 0.05
    for (let i = 0; i < PROP_SCRIPT.length; i++) {
      const prop = this.props[i]
      const light = this.lights[i]
      light.active = night && prop.active
      if (!light.active) continue
      light.x = prop.x
      light.y = prop.y
      light.radius = PROP_LIGHT_RADIUS[prop.type]
    }
    const core = this.lights[PROP_SCRIPT.length]
    core.active = this.bossVisible && this.boss.phase >= 2
    if (core.active) {
      core.x = this.boss.x
      core.y = this.boss.y + 10
      core.radius = 58 + Math.sin(this.time * 7) * 6
    }
  }

  // ── Câmera ──────────────────────────────────────────────────────────────────

  private updateCamera(ctx: IntroContext, dt: number): void {
    const t = this.time
    const w = this.viewW
    const h = this.viewH
    let zoom = 1
    let focusX = w / 2
    let focusY = h / 2
    if (t < T.threat) {
      // Abre fechado no rio e recua devagar, revelando o terreno — sem recuar
      // tanto que perca a margem para seguir o rio quando ele deriva.
      zoom = lerp(1.7, 1.35, smooth(span(t, T.openEnd, T.threat)))
      focusX = this.trackRiver(ctx, focusY, dt)
    } else if (t < T.cut) {
      // Empurra para o alto da tela, de onde vem a ameaça.
      const k = smooth(span(t, T.threat, T.bossSettle))
      zoom = lerp(1.35, 1.5, k) + span(t, T.bossSettle, T.cut) * 0.04
      focusY = lerp(h / 2, h * 0.28, k)
      focusX = this.trackRiver(ctx, focusY, dt)
    } else if (t < T.climax) {
      // Plano do herói: colado no caça, abrindo até o enquadramento de jogo.
      const k = smooth(span(t, T.heroIn, T.climax))
      zoom = lerp(2.2, 1, k)
      focusX = lerp(this.riverCenter(ctx, this.jetY), w / 2, k)
      focusY = lerp(this.jetY - h * 0.06, h / 2, k)
    }
    if (this.reducedMotion) zoom = 1 + (zoom - 1) * 0.4

    // O quadro nunca sai de [0, w] × [0, h]: o mundo (e a máscara de luz) cobre a tela toda.
    const halfW = w / (2 * zoom)
    const halfH = h / (2 * zoom)
    this.camera.zoom = zoom
    this.camera.focusX = Math.min(w - halfW, Math.max(halfW, focusX))
    this.camera.focusY = Math.min(h - halfH, Math.max(halfH, focusY))
  }

  /** Centro do rio suavizado: a câmera segue a correnteza sem tremer nos degraus das margens. */
  private trackRiver(ctx: IntroContext, y: number, dt: number): number {
    const target = this.riverCenter(ctx, y)
    this.cameraRiverX = this.cameraTracking
      ? this.cameraRiverX + (target - this.cameraRiverX) * Math.min(1, dt * 1.5)
      : target
    this.cameraTracking = true
    return this.cameraRiverX
  }

  // ── Transição ───────────────────────────────────────────────────────────────

  /** `recenter`: depois de pular o caça nasce no meio do rio; no fim natural segue de onde está. */
  private enterHandover(ctx: IntroContext, recenter: boolean): void {
    const { player } = ctx
    const y = introJetHomeY(ctx.height)
    player.setTouchShoot(false)
    player.setAnalogVector(0, 0)
    player.justShot = false
    player.y = y
    const bounds = ctx.world.getBoundsAtY(y)
    const margin = player.width / 2 + 6
    const x = recenter ? (bounds.left + bounds.right) / 2 : this.jetX
    player.x = Math.max(bounds.left + margin, Math.min(bounds.right - margin, x))
    this.jetX = player.x
    this.jetY = y
    this.intensity.comboMax = false
    this.intensity.lowFuel = false
    this.intensity.inBossFight = false
    this.bossVisible = false
    for (const light of this.lights) light.active = false
    this.handoverTime = 0
    this.setStage('handover')
  }

  private setStage(stage: IntroStage): void {
    this.stage = stage
    this.onStageChange?.(stage)
  }
}
