import { describe, it, expect, vi, type Mock } from 'vitest'
import { IntroRenderer, wrapLines } from './IntroRenderer'
import { IntroCinematic, letterboxHeight, type IntroContext, type IntroLabels } from './IntroCinematic'
import { Player } from './Player'
import { Fx } from './Fx'
import { SoundManager } from './SoundManager'
import { WeatherSystem } from './WeatherSystem'
import { HapticsEngine } from './HapticsEngine'
import { createMockContext2D } from './test-helpers/canvas'

const W = 800
const H = 600

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

function makeContext(width = W, height = H): IntroContext {
  return {
    world: { getBoundsAtY: () => ({ left: width / 2 - 150, right: width / 2 + 150 }), holdCourse: () => {} },
    player: new Player(width, height),
    fx: new Fx(() => 0.5),
    sound: new SoundManager(),
    weather: new WeatherSystem(width, height, () => 0.5),
    haptics: new HapticsEngine(),
    width,
    height,
    reducedMotion: false,
  }
}

/** Cinemática já avançada até `seconds`. */
function sceneAt(seconds: number, ctx = makeContext(), labels: IntroLabels = LABELS): IntroCinematic {
  const intro = new IntroCinematic()
  intro.setLabels(labels)
  intro.begin(ctx)
  let guard = 0
  while (intro.time < seconds && intro.stage === 'cinematic' && guard++ < 10_000) {
    intro.update(1 / 60, ctx)
  }
  return intro
}

/** Tudo o que foi escrito com fillText, concatenado (o renderer desenha letra a letra). */
function drawnText(c2d: CanvasRenderingContext2D): string {
  return (c2d.fillText as Mock).mock.calls.map((call) => String(call[0])).join('')
}

describe('IntroRenderer', () => {
  it('letterboxHeight acompanha a altura dentro dos limites', () => {
    expect(letterboxHeight(300)).toBe(64)
    expect(letterboxHeight(800)).toBe(96)
    expect(letterboxHeight(2000)).toBe(104)
  })

  it('wrapLines quebra por palavra sem passar do limite', () => {
    expect(wrapLines('one two three four', 9)).toEqual(['one two', 'three', 'four'])
    expect(wrapLines('', 10)).toEqual([])
    // Palavra maior que a linha fica sozinha em vez de ser cortada.
    expect(wrapLines('supercalifragilistic word', 5)).toEqual(['supercalifragilistic', 'word'])
  })

  it('abre com a tela preta e depois o filete do CRT abrindo a imagem', () => {
    const renderer = new IntroRenderer()
    const black = createMockContext2D()
    renderer.renderOverlay(black, sceneAt(0), W, H)
    expect(black.fillRect).toHaveBeenCalledWith(0, 0, W, H)

    const opening = createMockContext2D()
    renderer.renderOverlay(opening, sceneAt(0.9), W, H)
    // Barras de cinema + máscara acima/abaixo da faixa + filetes do fósforo.
    expect((opening.fillRect as Mock).mock.calls.length).toBeGreaterThan(6)
  })

  it('faixas, carimbo de local e rádio do QG em máquina de escrever', () => {
    const renderer = new IntroRenderer()
    const c2d = createMockContext2D()
    renderer.renderOverlay(c2d, sceneAt(4), W, H)

    const bar = letterboxHeight(H)
    expect(c2d.fillRect).toHaveBeenCalledWith(0, 0, W, bar)
    expect(c2d.fillRect).toHaveBeenCalledWith(0, H - bar, W, bar)
    const text = drawnText(c2d)
    expect(text).toContain('HQ')
    expect(text).toContain('Line one.')
    expect(text).toContain('SECTOR 07')
  })

  it('cursor da máquina de escrever pisca enquanto a linha é digitada', () => {
    const renderer = new IntroRenderer()
    // 0,3 s depois do início da 2ª transmissão (30 cps) e na fase acesa do pisca.
    const intro = sceneAt(8.7)
    const c2d = createMockContext2D()
    renderer.renderOverlay(c2d, intro, W, H)
    expect(drawnText(c2d)).toContain('Line two')
    expect(drawnText(c2d)).not.toContain('Line two is a bit longer.')
    // Bloco do cursor: 90% da altura da fonte (15 px na largura desktop).
    expect(c2d.fillRect).toHaveBeenCalledWith(expect.any(Number), expect.any(Number), expect.any(Number), 15 * 0.9)
  })

  it('marca os contatos inimigos com cantos e rótulo', () => {
    const renderer = new IntroRenderer()
    const c2d = createMockContext2D()
    renderer.renderOverlay(c2d, sceneAt(6.5), W, H)
    expect(c2d.stroke).toHaveBeenCalled()
    expect(drawnText(c2d)).toContain('HOSTILE')
  })

  it('marca a silhueta do chefe como contato desconhecido', () => {
    const renderer = new IntroRenderer()
    const c2d = createMockContext2D()
    renderer.renderOverlay(c2d, sceneAt(19.5), W, H)
    expect(drawnText(c2d)).toContain('UNKNOWN')
  })

  it('apresenta o piloto com a ficha e a linha-guia até o caça', () => {
    const renderer = new IntroRenderer()
    const c2d = createMockContext2D()
    renderer.renderOverlay(c2d, sceneAt(25), W, H)
    const text = drawnText(c2d)
    expect(text).toContain('CLASSIC 2600')
    expect(text).toContain('CALLSIGN · ACE')
    expect(c2d.lineTo).toHaveBeenCalled()
  })

  it('título com o subtítulo e o lema do menu', () => {
    const renderer = new IntroRenderer()
    const c2d = createMockContext2D()
    renderer.renderOverlay(c2d, sceneAt(34.5), W, H)
    const text = drawnText(c2d)
    // Sombra + letra principal, como o h1 do menu.
    expect(text.split('RIVER RAID').length - 1).toBe(2)
    expect(text).toContain('— ARCADE —')
    expect(text).toContain('FLY. SHOOT. SURVIVE.')
  })

  it('na transição mostra "missão iniciada" e sai do preto depois de pular', () => {
    const renderer = new IntroRenderer()
    const ctx = makeContext()
    const intro = sceneAt(5, ctx)
    intro.skip(ctx)
    intro.updateHandover(0.3)

    const c2d = createMockContext2D()
    renderer.renderOverlay(c2d, intro, W, H)
    expect(drawnText(c2d)).toContain('MISSION START')
    expect(c2d.fillRect).toHaveBeenCalledWith(0, 0, W, H)
  })

  it('vinheta usa gradiente radial em cache enquanto o tamanho não muda', () => {
    const renderer = new IntroRenderer()
    const c2d = createMockContext2D()
    const createRadialGradient = vi.fn(() => ({ addColorStop: vi.fn() }))
    Object.assign(c2d, { createRadialGradient })
    const intro = sceneAt(3)

    renderer.renderOverlay(c2d, intro, W, H)
    renderer.renderOverlay(c2d, intro, W, H)
    expect(createRadialGradient).toHaveBeenCalledTimes(1)

    renderer.renderOverlay(c2d, intro, W + 10, H)
    expect(createRadialGradient).toHaveBeenCalledTimes(2)
  })

  it('mede a fonte quando pode e usa o layout estreito no celular', () => {
    const renderer = new IntroRenderer()
    const narrow = makeContext(390, 844)
    const c2d = createMockContext2D()
    const measureText = vi.fn(() => ({ width: 8 }))
    Object.assign(c2d, { measureText })

    renderer.renderOverlay(c2d, sceneAt(4, narrow), 390, 844)
    expect(measureText).toHaveBeenCalled()
    expect(drawnText(c2d)).toContain('Line one.')

    const title = createMockContext2D()
    Object.assign(title, { measureText: vi.fn(() => ({ width: 0 })) })
    renderer.renderOverlay(title, sceneAt(34.5, makeContext(390, 844)), 390, 844)
    expect(drawnText(title)).toContain('RIVER RAID')
  })

  it('sem rótulos não escreve nada', () => {
    const renderer = new IntroRenderer()
    const empty: IntroLabels = { ...LABELS, stampNight: '', stampDawn: '', speaker: '', lines: [], contactHostile: '', contactBridge: '', contactUnknown: '', pilot: '', callsign: '', subtitle: '', title: '', tagline: '', missionStart: '' }
    for (const t of [4, 6.5, 25, 34.5]) {
      const c2d = createMockContext2D()
      renderer.renderOverlay(c2d, sceneAt(t, makeContext(), empty), W, H)
      expect(c2d.fillText).not.toHaveBeenCalled()
    }
  })

  it('renderProps desenha os atores e a silhueta do chefe com os renderers do jogo', () => {
    const renderer = new IntroRenderer()
    const patrol = createMockContext2D()
    renderer.renderProps(patrol, sceneAt(6.5))
    // Rotores dos helicópteros vêm do overlay animado do EnemyRenderer.
    expect(patrol.arc).toHaveBeenCalled()

    const threat = createMockContext2D()
    const intro = sceneAt(19.5)
    renderer.renderProps(threat, intro, true)
    expect(threat.translate).toHaveBeenCalledWith(intro.boss.x, intro.boss.y)
  })
})
