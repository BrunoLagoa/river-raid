import { describe, it, expect, vi } from 'vitest'
import {
  IntroCinematic,
  INTRO_BOSS_TARGET,
  INTRO_CINEMATIC_DURATION,
  INTRO_HANDOVER_DURATION,
  introCycleTimeAt,
  introDarknessAt,
  introJetHomeY,
  introScrollSpeedAt,
  letterboxHeight,
  type IntroContext,
  type IntroLabels,
  type IntroStage,
} from './IntroCinematic'
import { Player } from './Player'
import { Fx } from './Fx'
import { SoundManager } from './SoundManager'
import { WeatherSystem } from './WeatherSystem'
import { HapticsEngine } from './HapticsEngine'
import { BASE_SCROLL_SPEED, BOSS_WIDTH, PLAYER_RESPAWN_Y_OFFSET } from './constants'
import { createMockContext2D } from './test-helpers/canvas'

const W = 800
const H = 600
const HOME_Y = introJetHomeY(H)

const LABELS: IntroLabels = {
  stampNight: 'SECTOR 07 · NIGHT',
  stampDawn: 'SECTOR 07 · DAWN',
  speaker: 'HQ',
  lines: ['Line one.', 'Line two is a bit longer.', 'Line three.', 'Line four.', 'Line five.'],
  contactHostile: 'HOSTILE',
  contactBridge: 'BRIDGE',
  contactUnknown: 'UNKNOWN',
  pilot: 'CLASSIC 2600',
  callsign: 'CALLSIGN · ACE',
  subtitle: '— ARCADE —',
  title: 'RIVER RAID',
  tagline: 'FLY. SHOOT. SURVIVE.',
  missionStart: 'MISSION START',
}

// jsdom não tem Web Audio: os SFX do SoundManager viram no-op, mas as chamadas
// continuam observáveis por spy.
function makeContext(overrides: Partial<IntroContext> = {}): IntroContext {
  return {
    world: { getBoundsAtY: () => ({ left: 250, right: 550 }), holdCourse: () => {} },
    player: new Player(W, H),
    fx: new Fx(() => 0.5),
    sound: new SoundManager(),
    weather: new WeatherSystem(W, H, () => 0.5),
    haptics: new HapticsEngine(),
    width: W,
    height: H,
    reducedMotion: false,
    ...overrides,
  }
}

/** Avança o roteiro em passos de 1/60 s até `seconds` (ou até sair da cinemática). */
function runUntil(intro: IntroCinematic, ctx: IntroContext, seconds: number): void {
  let guard = 0
  // Sem folga: o frame que cruza o fim da cena é justamente o que entrega o controle.
  while (intro.time < seconds && intro.stage === 'cinematic' && guard++ < 10_000) {
    intro.update(1 / 60, ctx)
  }
}

function started(ctx: IntroContext, labels: IntroLabels = LABELS): IntroCinematic {
  const intro = new IntroCinematic()
  intro.setLabels(labels)
  intro.begin(ctx)
  return intro
}

describe('IntroCinematic', () => {
  describe('curvas do roteiro', () => {
    it('o rio deriva, quase para na ameaça e termina na velocidade base do jogo', () => {
      expect(introScrollSpeedAt(0)).toBe(58)
      expect(introScrollSpeedAt(20)).toBeLessThan(20)
      expect(introScrollSpeedAt(INTRO_CINEMATIC_DURATION)).toBe(BASE_SCROLL_SPEED)
    })

    it('a noite vira dia exatamente no começo do ciclo do gameplay', () => {
      expect(introCycleTimeAt(0)).toBeCloseTo(63)
      expect(introCycleTimeAt(INTRO_CINEMATIC_DURATION)).toBe(120)
    })

    it('o caça termina acima da faixa inferior de cinema, nunca abaixo do respawn', () => {
      expect(introJetHomeY(600)).toBe(600 - letterboxHeight(600) - 56)
      expect(introJetHomeY(600)).toBeLessThanOrEqual(600 - PLAYER_RESPAWN_Y_OFFSET)
      expect(introJetHomeY(2000)).toBe(2000 - 104 - 56)
    })

    it('a escuridão aperta na ameaça e some com o sol', () => {
      expect(introDarknessAt(5)).toBeCloseTo(0.45)
      expect(introDarknessAt(20)).toBeGreaterThan(0.75)
      expect(introDarknessAt(INTRO_CINEMATIC_DURATION)).toBe(0)
    })
  })

  it('begin monta a cena uma vez: chuva forçada e caça fora de quadro', () => {
    const ctx = makeContext()
    const intro = new IntroCinematic()
    const stages: IntroStage[] = []
    intro.setOnStageChange((s) => stages.push(s))
    const force = vi.spyOn(ctx.weather, 'forceWeather')

    intro.begin(ctx)
    intro.begin(ctx)

    expect(stages).toEqual(['cinematic'])
    expect(force).toHaveBeenCalledTimes(1)
    expect(force).toHaveBeenCalledWith('rain')
    expect(intro.weatherType).toBe('rain')
    expect(ctx.player.y).toBeGreaterThan(H)
    expect(intro.jetVisible).toBe(false)
    expect(intro.hudReveal).toBe(0)
    expect(intro.letterbox).toBe(1)
  })

  it('roda o roteiro inteiro: cues de áudio, ameaça, herói, ponte e transição', () => {
    const ctx = makeContext()
    const stages: IntroStage[] = []
    const radio = vi.spyOn(ctx.sound, 'radioClick')
    const ping = vi.spyOn(ctx.sound, 'radarPing')
    const alarm = vi.spyOn(ctx.sound, 'alarm')
    const flyby = vi.spyOn(ctx.sound, 'jetFlyby')
    const stopMusic = vi.spyOn(ctx.sound, 'stopMusic')
    const introMusic = vi.spyOn(ctx.sound, 'startIntroMusic')
    const intensity = vi.spyOn(ctx.sound, 'setDynamicIntensity')
    const lightning = vi.spyOn(ctx.weather, 'triggerLightning')
    const bigExplosion = vi.spyOn(ctx.fx, 'bigExplosion')
    const bossHaptic = vi.spyOn(ctx.haptics, 'triggerBossAlert')
    const bridgeHaptic = vi.spyOn(ctx.haptics, 'triggerBridgeDestroy')
    const holdCourse = vi.spyOn(ctx.world, 'holdCourse')
    const intro = new IntroCinematic()
    intro.setLabels(LABELS)
    intro.setOnStageChange((s) => stages.push(s))
    intro.begin(ctx)

    runUntil(intro, ctx, 19)
    expect(intro.bossVisible).toBe(true)
    // Ameaça: trilha abafada e a silhueta marcada como contato desconhecido.
    expect(intro.intensity.lowFuel).toBe(true)
    expect(intro.locks.some((l) => l.active && l.target === INTRO_BOSS_TARGET)).toBe(true)

    runUntil(intro, ctx, 23.5)
    expect(intro.bossVisible).toBe(false)
    expect(intro.intensity.lowFuel).toBe(false)
    expect(intro.jetVisible).toBe(true)
    expect(intro.weatherType).toBe('clear')

    runUntil(intro, ctx, 25)
    expect(intro.headlightOn).toBe(true)
    expect(intro.jetSpeedMod).toBeGreaterThan(1.2)

    runUntil(intro, ctx, 31)
    expect(intro.headlightOn).toBe(false)
    expect(intro.intensity.inBossFight).toBe(true)

    runUntil(intro, ctx, INTRO_CINEMATIC_DURATION)
    expect(stages).toEqual(['cinematic', 'handover'])
    expect(intro.stage).toBe('handover')
    expect(intro.bridgeDown).toBe(true)
    // Estalo do "liga o monitor" + um por transmissão do QG.
    expect(radio).toHaveBeenCalledTimes(1 + LABELS.lines.length)
    expect(ping).toHaveBeenCalledTimes(3)
    expect(alarm).toHaveBeenCalledTimes(2)
    expect(flyby).toHaveBeenCalledTimes(2)
    // Corte seco antes do herói e o tema recomeçando com ele.
    expect(stopMusic).toHaveBeenCalledTimes(1)
    expect(introMusic).toHaveBeenCalledTimes(1)
    expect(lightning).toHaveBeenCalledTimes(3)
    // A ponte cai em cadeia: três explosões ao longo do vão.
    expect(bigExplosion).toHaveBeenCalledTimes(3)
    expect(bossHaptic).toHaveBeenCalledTimes(1)
    expect(bridgeHaptic).toHaveBeenCalledTimes(1)
    // O trecho do clímax é pedido reto ao mundo uma única vez.
    expect(holdCourse).toHaveBeenCalledTimes(1)
    expect(intensity).toHaveBeenCalledWith(intro.intensity)
    // Na entrega, as camadas adaptativas voltam ao neutro.
    expect(intro.intensity).toEqual({ comboMax: false, lowFuel: false, inBossFight: false })
  })

  it('o caça termina na posição de gameplay, no centro do rio, sem tiro nem inclinação', () => {
    const ctx = makeContext()
    const intro = started(ctx)
    runUntil(intro, ctx, INTRO_CINEMATIC_DURATION)

    expect(ctx.player.y).toBe(HOME_Y)
    expect(ctx.player.x).toBe(400)
    expect(ctx.player.bankDir).toBe(0)
    expect(ctx.player.isShooting).toBe(false)
  })

  it('a rajada do clímax derruba a ponte antes da rede de segurança', () => {
    const ctx = makeContext()
    const shoot = vi.spyOn(ctx.sound, 'shoot')
    const intro = started(ctx)

    runUntil(intro, ctx, 31)
    expect(intro.bridgeDown).toBe(false)
    runUntil(intro, ctx, 33.3)

    expect(shoot).toHaveBeenCalled()
    expect(intro.bridgeDown).toBe(true)
    expect(intro.intensity.comboMax).toBe(true)
  })

  it('em rio com curva o caça se alinha com a ponte antes da rajada', () => {
    // Rio desloca 100 px entre a altura do caça e a da ponte, mas ainda alcançável.
    const ctx = makeContext({
      world: {
        getBoundsAtY: (y: number) => (y > 400 ? { left: 200, right: 520 } : { left: 300, right: 620 }),
        holdCourse: () => {},
      },
    })
    const intro = started(ctx)

    runUntil(intro, ctx, 33.3)
    expect(intro.bridgeDown).toBe(true)
    expect(intro.jetX).toBeCloseTo(460, 0)
  })

  it('a ponte cai pela rede de segurança se nenhum tiro encostar', () => {
    // Rio desalinhado: o caça voa numa faixa e a ponte está em outra.
    const ctx = makeContext({
      world: {
        getBoundsAtY: (y: number) => (y > 400 ? { left: 100, right: 300 } : { left: 500, right: 700 }),
        holdCourse: () => {},
      },
    })
    const intro = started(ctx)

    runUntil(intro, ctx, 33.3)
    expect(intro.bridgeDown).toBe(false)
    runUntil(intro, ctx, 33.5)
    expect(intro.bridgeDown).toBe(true)
  })

  it('pular leva à transição num estado coerente com o gameplay', () => {
    const ctx = makeContext()
    const intro = started(ctx)
    runUntil(intro, ctx, 19)
    const stages: IntroStage[] = []
    intro.setOnStageChange((s) => stages.push(s))

    intro.skip(ctx)
    intro.skip(ctx)

    expect(stages).toEqual(['handover'])
    expect(intro.skipped).toBe(true)
    expect(intro.time).toBe(INTRO_CINEMATIC_DURATION)
    expect(intro.props.every((p) => !p.active)).toBe(true)
    expect(intro.locks.every((l) => !l.active)).toBe(true)
    expect(intro.lights.every((l) => !l.active)).toBe(true)
    expect(intro.bossVisible).toBe(false)
    expect(intro.intensity).toEqual({ comboMax: false, lowFuel: false, inBossFight: false })
    expect(ctx.player.y).toBe(HOME_Y)
    expect(ctx.player.x).toBe(400)
    // Sai do preto: o salto no tempo não aparece como corte.
    expect(intro.blackout).toBe(1)
    expect(intro.vignette).toBe(0)
    // Fora da cinemática o update não mexe em nada.
    intro.update(1, ctx)
    expect(intro.time).toBe(INTRO_CINEMATIC_DURATION)
  })

  it('a transição revela o HUD, recolhe as faixas e termina em done', () => {
    const ctx = makeContext()
    const intro = started(ctx)
    const stages: IntroStage[] = []
    intro.setOnStageChange((s) => stages.push(s))
    intro.skip(ctx)

    expect(intro.hudReveal).toBe(0)
    expect(intro.calloutAlpha).toBe(0)
    intro.updateHandover(1)
    expect(intro.hudReveal).toBeGreaterThan(0.5)
    expect(intro.letterbox).toBe(0)
    expect(intro.calloutAlpha).toBeGreaterThan(0)
    expect(intro.calloutScale).toBe(1)
    expect(intro.blackout).toBe(0)

    intro.updateHandover(0)
    intro.updateHandover(INTRO_HANDOVER_DURATION)
    expect(stages).toEqual(['handover', 'done'])
    expect(intro.hudReveal).toBe(1)
    expect(intro.calloutAlpha).toBe(0)
    intro.updateHandover(1)
    expect(stages).toEqual(['handover', 'done'])
  })

  it('ignora dt inválido', () => {
    const ctx = makeContext()
    const intro = started(ctx)
    intro.update(Number.NaN, ctx)
    intro.update(-1, ctx)
    expect(intro.time).toBe(0)
  })

  it('câmera abre fechada, respeita o quadro e volta ao enquadramento de jogo', () => {
    const ctx = makeContext()
    const intro = started(ctx)
    const c2d = createMockContext2D()

    expect(intro.camera.zoom).toBeCloseTo(1.7)
    expect(intro.camera.focusX).toBeGreaterThanOrEqual(W / (2 * intro.camera.zoom))
    intro.applyCamera(c2d)
    expect(c2d.scale).toHaveBeenCalledWith(intro.camera.zoom, intro.camera.zoom)

    // Na ameaça a câmera sobe até onde o quadro deixa.
    runUntil(intro, ctx, 20)
    expect(intro.camera.focusY).toBeCloseTo(H / (2 * intro.camera.zoom))

    runUntil(intro, ctx, 31)
    expect(intro.camera).toEqual({ zoom: 1, focusX: W / 2, focusY: H / 2 })
    const identity = createMockContext2D()
    intro.applyCamera(identity)
    expect(identity.scale).not.toHaveBeenCalled()

    const out = { x: 0, y: 0 }
    intro.worldToScreen(120, 80, out)
    expect(out).toEqual({ x: 120, y: 80 })
  })

  it('movimento reduzido contém o zoom e tira o respiro de luz do relâmpago', () => {
    const calm = makeContext({ reducedMotion: true })
    const reduced = started(calm)
    expect(reduced.camera.zoom).toBeCloseTo(1 + 0.7 * 0.4)
    runUntil(reduced, calm, 10.62)
    expect(reduced.darkness).toBeCloseTo(introDarknessAt(reduced.time))

    const ctx = makeContext()
    const full = started(ctx)
    runUntil(full, ctx, 10.62)
    expect(full.darkness).toBeLessThan(introDarknessAt(full.time) * 0.5)
  })

  it('marcações seguem a câmera e somem com o alvo', () => {
    const ctx = makeContext()
    const intro = started(ctx)
    runUntil(intro, ctx, 19)
    const box = { x: 0, y: 0, w: 0, h: 0 }

    const bossLock = intro.locks.find((l) => l.active && l.target === INTRO_BOSS_TARGET)
    expect(bossLock).toBeDefined()
    expect(intro.readLockBox(bossLock!, box)).toBe(true)
    expect(box.w).toBeCloseTo(BOSS_WIDTH * intro.camera.zoom)

    expect(intro.readLockBox({ active: false, kind: 'hostile', age: 0, target: 0 }, box)).toBe(false)
    const gone = intro.props.findIndex((p) => !p.active)
    expect(intro.readLockBox({ active: true, kind: 'hostile', age: 0, target: gone }, box)).toBe(false)

    // No corte, a silhueta sai de cena e leva a marcação junto.
    runUntil(intro, ctx, 22.6)
    expect(intro.readLockBox(bossLock!, box)).toBe(false)
  })

  it('transmissões e carimbos datilografam só quando há rótulos', () => {
    const ctx = makeContext()
    const intro = new IntroCinematic()
    intro.begin(ctx)
    const view = { index: -1, chars: 0, alpha: 0, typing: false }
    const stamp = { dawn: false, chars: 0, alpha: 0 }

    runUntil(intro, ctx, 3)
    expect(intro.readTransmission(view)).toBe(false)
    expect(intro.readStamp(stamp)).toBe(false)

    intro.setLabels(LABELS)
    expect(intro.readTransmission(view)).toBe(true)
    expect(view.index).toBe(0)
    expect(view.chars).toBe(LABELS.lines[0].length)
    expect(view.typing).toBe(false)
    expect(intro.readStamp(stamp)).toBe(true)
    expect(stamp.dawn).toBe(false)

    runUntil(intro, ctx, 7.8)
    expect(intro.readTransmission(view)).toBe(true)
    expect(view.alpha).toBeLessThan(1)

    runUntil(intro, ctx, 8.45)
    expect(intro.readTransmission(view)).toBe(true)
    expect(view.index).toBe(1)
    expect(view.typing).toBe(true)

    runUntil(intro, ctx, 24)
    expect(intro.readStamp(stamp)).toBe(true)
    expect(stamp.dawn).toBe(true)

    runUntil(intro, ctx, 33)
    expect(intro.readTransmission(view)).toBe(false)
    expect(intro.readStamp(stamp)).toBe(false)
  })

  it('janelas do "liga o monitor", do corte seco, do cartão do piloto e do título', () => {
    const ctx = makeContext()
    const intro = started(ctx)
    expect(intro.powerOn).toBe(0)
    expect(intro.titleAlpha).toBe(0)
    expect(intro.taglineAlpha).toBe(0)

    runUntil(intro, ctx, 1)
    expect(intro.powerOn).toBeGreaterThan(0)
    expect(intro.powerOn).toBeLessThan(1)

    runUntil(intro, ctx, 22.6)
    expect(intro.blackout).toBe(1)
    runUntil(intro, ctx, 23.5)
    expect(intro.blackout).toBe(0)

    runUntil(intro, ctx, 25)
    expect(intro.heroCardAlpha).toBe(1)
    expect(intro.titleAlpha).toBe(0)

    runUntil(intro, ctx, 34.5)
    expect(intro.heroCardAlpha).toBe(0)
    expect(intro.titleAlpha).toBe(1)
    expect(intro.taglineAlpha).toBe(1)
    expect(intro.titleScale).toBeCloseTo(1)
    expect(intro.titleLift).toBe(0)

    runUntil(intro, ctx, 36.3)
    expect(intro.titleAlpha).toBeLessThan(1)
    expect(intro.titleLift).toBeGreaterThan(0)
  })

  it('luzes: uma por adereço à noite e o núcleo do chefe quando abre', () => {
    const ctx = makeContext()
    const intro = started(ctx)
    const core = intro.lights[intro.lights.length - 1]

    runUntil(intro, ctx, 6)
    const lit = intro.props.filter((p, i) => p.active && intro.lights[i].active)
    expect(lit.length).toBeGreaterThan(0)
    expect(intro.lights.some((l) => l.active && l.radius > 0)).toBe(true)
    expect(core.active).toBe(false)

    runUntil(intro, ctx, 20.5)
    expect(core.active).toBe(true)
    expect(core.x).toBe(intro.boss.x)

    runUntil(intro, ctx, 32)
    expect(intro.lights.every((l) => !l.active)).toBe(true)
  })
})
