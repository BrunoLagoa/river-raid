// ─── IntroRenderer.ts ────────────────────────────────────────────────────────
// Desenha a cinemática de abertura em duas camadas:
//   • renderProps   — dentro da câmera: os atores do roteiro, com os mesmos
//                     renderers do gameplay (EnemyRenderer, BossRenderer).
//   • renderOverlay — em espaço de tela: faixas letterbox, carimbo de local,
//                     rádio do QG em máquina de escrever, marcações de alvo,
//                     cartão do piloto, título, "MISSÃO INICIADA", o CRT ligando
//                     e os cortes para o preto.
// Tipografia e cores repetem o menu: título em Courier Prime azul (#44aaff) com
// sombra #1a5588, rótulos em Share Tech Mono, âmbar (#ffcc44) para destaques.

import { BossRenderer } from './BossRenderer'
import { EnemyRenderer } from './EnemyRenderer'
import type { EnemyBullet } from './EnemyTypes'
import {
  INTRO_LOCK_LIFETIME,
  letterboxHeight,
  type IntroBox,
  type IntroCinematic,
  type IntroContactKind,
  type IntroLabels,
  type IntroStampView,
  type IntroTextView,
} from './IntroCinematic'

const FONT_MONO = '"Share Tech Mono", "Courier New", monospace'
const FONT_TITLE = '"Courier Prime", "Courier New", monospace'
const COLOR_PRIMARY = '#44aaff'
const COLOR_PRIMARY_SHADOW = '#1a5588'
const COLOR_WARNING = '#ffcc44'
const COLOR_TEXT = '#cfe4ff'
const COLOR_MUTED = '#88aacc'
const COLOR_DIM = '#6688aa'
const CONTACT_COLORS: Record<IntroContactKind, string> = {
  hostile: '#ff4444',
  bridge: '#ffcc44',
  unknown: '#ff2255',
}
const NO_BULLETS: EnemyBullet[] = []

/**
 * Fonte que cresce com a altura da tela (referência ~790 px) sem passar de `max`:
 * em monitores grandes os 11–15 px do HUD somem numa cena de cinema.
 */
function fontSize(viewH: number, base: number, max: number): number {
  return Math.round(Math.min(max, Math.max(base, (viewH * base) / 790)))
}

/** Quebra um texto em linhas de até `maxChars` caracteres (fonte monoespaçada), por palavra. */
export function wrapLines(text: string, maxChars: number): string[] {
  const lines: string[] = []
  let line = ''
  for (const word of text.split(' ')) {
    if (!line) {
      line = word
    } else if (line.length + 1 + word.length <= maxChars) {
      line += ` ${word}`
    } else {
      lines.push(line)
      line = word
    }
  }
  if (line) lines.push(line)
  return lines
}

const clamp01 = (v: number): number => (v < 0 ? 0 : v > 1 ? 1 : v)
const easeOut = (t: number): number => 1 - Math.pow(1 - clamp01(t), 3)

/** Avanço de um caractere na fonte atual (monoespaçada); estima sem `measureText`. */
function charAdvance(ctx: CanvasRenderingContext2D, size: number): number {
  if (typeof ctx.measureText === 'function') {
    const width = ctx.measureText('M').width
    if (width > 0) return width
  }
  return size * 0.6
}

/**
 * Desenha os `count` primeiros caracteres com avanço fixo. Serve à máquina de
 * escrever e ao espaçamento de letra do título sem depender de `letterSpacing`.
 */
function drawChars(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  count: number,
  advance: number,
): void {
  const n = Math.min(count, text.length)
  for (let i = 0; i < n; i++) ctx.fillText(text.charAt(i), x + i * advance, y)
}

function drawCorners(ctx: CanvasRenderingContext2D, cx: number, cy: number, hw: number, hh: number, len: number): void {
  const left = cx - hw
  const right = cx + hw
  const top = cy - hh
  const bottom = cy + hh
  ctx.beginPath()
  ctx.moveTo(left, top + len)
  ctx.lineTo(left, top)
  ctx.lineTo(left + len, top)
  ctx.moveTo(right - len, top)
  ctx.lineTo(right, top)
  ctx.lineTo(right, top + len)
  ctx.moveTo(right, bottom - len)
  ctx.lineTo(right, bottom)
  ctx.lineTo(right - len, bottom)
  ctx.moveTo(left + len, bottom)
  ctx.lineTo(left, bottom)
  ctx.lineTo(left, bottom - len)
  ctx.stroke()
}

function contactLabel(labels: IntroLabels, kind: IntroContactKind): string {
  if (kind === 'bridge') return labels.contactBridge
  if (kind === 'unknown') return labels.contactUnknown
  return labels.contactHostile
}

export class IntroRenderer {
  private readonly enemies = new EnemyRenderer()
  private readonly bossRenderer = new BossRenderer()
  private readonly textView: IntroTextView = { index: -1, chars: 0, alpha: 0, typing: false }
  private readonly stampView: IntroStampView = { dawn: false, chars: 0, alpha: 0 }
  private readonly box: IntroBox = { x: 0, y: 0, w: 0, h: 0 }
  private readonly point = { x: 0, y: 0 }
  private vignette: CanvasGradient | null = null
  private vignetteW = 0
  private vignetteH = 0
  /** Quebra de linha das transmissões, refeita só quando o texto ou a largura mudam. */
  private readonly wrapCache: Array<{ text: string; maxChars: number; lines: string[] } | undefined> = []

  /** Atores do roteiro — chamado dentro da câmera, no lugar das entidades de gameplay. */
  renderProps(ctx: CanvasRenderingContext2D, intro: IntroCinematic, colorblind = false): void {
    this.enemies.render(ctx, intro.props, NO_BULLETS, intro.time, colorblind)
    if (intro.bossVisible) this.bossRenderer.render(ctx, intro.boss)
  }

  /** Camada de cinema em espaço de tela, depois do mundo, do clima e do HUD. */
  renderOverlay(ctx: CanvasRenderingContext2D, intro: IntroCinematic, w: number, h: number): void {
    const cinematic = intro.stage === 'cinematic'
    const bar = letterboxHeight(h) * intro.letterbox
    ctx.save()
    ctx.textAlign = 'left'
    ctx.textBaseline = 'middle'
    if (cinematic) {
      this.renderVignette(ctx, w, h, intro.vignette)
      this.renderLocks(ctx, intro, w, h, bar)
      this.renderHeroCard(ctx, intro, w, h)
      this.renderTitle(ctx, intro, w, h)
    }
    if (bar > 0.5) this.renderBars(ctx, w, h, bar)
    if (cinematic) {
      this.renderStamp(ctx, intro, w, h, bar)
      this.renderTransmission(ctx, intro, w, h, bar)
      this.renderPowerOn(ctx, intro, w, h)
    }
    this.renderCallout(ctx, intro, w, h)
    const black = intro.blackout
    if (black > 0) {
      ctx.globalAlpha = black
      ctx.fillStyle = '#000000'
      ctx.fillRect(0, 0, w, h)
    }
    ctx.restore()
  }

  private renderVignette(ctx: CanvasRenderingContext2D, w: number, h: number, strength: number): void {
    if (strength <= 0.01 || typeof ctx.createRadialGradient !== 'function') return
    if (!this.vignette || this.vignetteW !== w || this.vignetteH !== h) {
      const radius = Math.hypot(w, h) / 2
      const gradient = ctx.createRadialGradient(w / 2, h / 2, radius * 0.42, w / 2, h / 2, radius)
      gradient.addColorStop(0, 'rgba(0, 0, 0, 0)')
      gradient.addColorStop(1, 'rgba(0, 0, 0, 0.9)')
      this.vignette = gradient
      this.vignetteW = w
      this.vignetteH = h
    }
    ctx.globalAlpha = strength
    ctx.fillStyle = this.vignette
    ctx.fillRect(0, 0, w, h)
    ctx.globalAlpha = 1
  }

  private renderBars(ctx: CanvasRenderingContext2D, w: number, h: number, bar: number): void {
    ctx.fillStyle = '#000000'
    ctx.fillRect(0, 0, w, bar)
    ctx.fillRect(0, h - bar, w, bar)
    // Mesmo filete de acento da faixa do HUD: na transição as barras "viram" o HUD.
    ctx.fillStyle = 'rgba(130, 175, 215, 0.22)'
    ctx.fillRect(0, bar - 1, w, 1)
    ctx.fillRect(0, h - bar, w, 1)
  }

  private renderStamp(ctx: CanvasRenderingContext2D, intro: IntroCinematic, w: number, h: number, bar: number): void {
    const view = this.stampView
    if (!intro.readStamp(view)) return
    const text = view.dawn ? intro.labels.stampDawn : intro.labels.stampNight
    const narrow = w < 520
    const size = narrow ? 10 : fontSize(h, 11, 15)
    ctx.font = `${size}px ${FONT_MONO}`
    const advance = charAdvance(ctx, size) + (narrow ? 0.5 : (1.5 * size) / 11)
    const y = bar / 2
    ctx.globalAlpha = view.alpha
    // Ponto de "gravação" piscando: transmissão ao vivo do setor.
    if (Math.floor(intro.time * 2) % 2 === 0) {
      ctx.fillStyle = '#ff4444'
      ctx.beginPath()
      ctx.arc(22, y, 3.5, 0, Math.PI * 2)
      ctx.fill()
    }
    ctx.fillStyle = COLOR_MUTED
    drawChars(ctx, text, 34, y, view.chars, advance)
    ctx.globalAlpha = 1
  }

  private renderTransmission(ctx: CanvasRenderingContext2D, intro: IntroCinematic, w: number, h: number, bar: number): void {
    const view = this.textView
    if (!intro.readTransmission(view)) return
    const text = intro.labels.lines[view.index]
    const speaker = intro.labels.speaker
    const size = w < 520 ? 13 : fontSize(h, 15, 22)
    ctx.font = `${size}px ${FONT_MONO}`
    const advance = charAdvance(ctx, size)
    const padX = Math.max(16, Math.round(w * 0.06))
    const speakerW = (speaker.length + 2) * advance
    const maxChars = Math.max(12, Math.floor((w - padX * 2 - speakerW) / advance))
    const lines = this.wrap(view.index, text, maxChars)
    const lineH = Math.round(size * 1.5)
    const firstY = h - bar + (bar - lines.length * lineH) / 2 + lineH / 2

    ctx.globalAlpha = view.alpha
    ctx.fillStyle = COLOR_WARNING
    drawChars(ctx, speaker, padX, firstY, speaker.length, advance)
    ctx.fillText('▸', padX + speaker.length * advance + advance * 0.4, firstY)

    ctx.fillStyle = COLOR_TEXT
    const textX = padX + speakerW
    let remaining = view.chars
    let cursorX = textX
    let cursorY = firstY
    for (let i = 0; i < lines.length && remaining > 0; i++) {
      const line = lines[i]
      const count = Math.min(line.length, remaining)
      cursorY = firstY + i * lineH
      drawChars(ctx, line, textX, cursorY, count, advance)
      cursorX = textX + count * advance
      remaining -= line.length + 1
    }
    if (view.typing && Math.floor(intro.time * 6) % 2 === 0) {
      ctx.fillStyle = COLOR_WARNING
      ctx.fillRect(cursorX + 1, cursorY - size * 0.45, Math.max(2, advance * 0.55), size * 0.9)
    }
    ctx.globalAlpha = 1
  }

  private wrap(index: number, text: string, maxChars: number): string[] {
    const cached = this.wrapCache[index]
    if (cached && cached.text === text && cached.maxChars === maxChars) return cached.lines
    const lines = wrapLines(text, maxChars)
    this.wrapCache[index] = { text, maxChars, lines }
    return lines
  }

  private renderLocks(ctx: CanvasRenderingContext2D, intro: IntroCinematic, w: number, h: number, bar: number): void {
    const box = this.box
    const labelSize = fontSize(h, 10, 14)
    const labelH = labelSize + 4
    for (const lock of intro.locks) {
      if (!intro.readLockBox(lock, box)) continue
      const age = lock.age
      // Pisca ao travar, como a mira de radar adquirindo o alvo.
      if (age < 0.45 && Math.floor(age * 14) % 2 === 1) continue
      const fade = lock.kind === 'unknown'
        ? 0.7 + 0.3 * Math.sin(intro.time * 9)
        : 1 - clamp01((age - (INTRO_LOCK_LIFETIME - 0.5)) / 0.5)
      if (fade <= 0) continue
      const grow = 1 + 1.4 * (1 - easeOut(age / 0.3))
      const hw = (box.w / 2 + 6) * grow
      const hh = (box.h / 2 + 6) * grow
      const color = CONTACT_COLORS[lock.kind]
      ctx.globalAlpha = fade
      ctx.strokeStyle = color
      ctx.lineWidth = 1.5
      drawCorners(ctx, box.x, box.y, hw, hh, Math.max(5, Math.min(hw, hh) * 0.45))

      const label = contactLabel(intro.labels, lock.kind)
      if (!label) continue
      ctx.font = `${labelSize}px ${FONT_MONO}`
      const advance = charAdvance(ctx, labelSize) + 1
      const labelW = label.length * advance + 12
      const labelX = Math.max(8, Math.min(w - labelW - 8, box.x - hw))
      // Nunca sob a faixa superior: a silhueta do chefe sai do quadro por cima.
      const labelY = Math.max(bar + labelH, box.y - hh - labelH * 0.7)
      ctx.fillStyle = 'rgba(4, 8, 16, 0.72)'
      ctx.fillRect(labelX, labelY - labelH / 2, labelW, labelH)
      ctx.fillStyle = color
      ctx.fillRect(labelX, labelY - labelH / 2, 2, labelH)
      drawChars(ctx, label, labelX + 7, labelY, label.length, advance)
    }
    ctx.globalAlpha = 1
  }

  private renderHeroCard(ctx: CanvasRenderingContext2D, intro: IntroCinematic, w: number, h: number): void {
    const alpha = intro.heroCardAlpha
    const { pilot, callsign } = intro.labels
    if (alpha <= 0 || (!pilot && !callsign)) return
    const narrow = w < 520
    const pilotSize = narrow ? 13 : fontSize(h, 15, 22)
    const callSize = narrow ? 11 : fontSize(h, 11, 15)
    ctx.font = `bold ${pilotSize}px ${FONT_MONO}`
    const pilotAdvance = charAdvance(ctx, pilotSize) + 1.5
    ctx.font = `${callSize}px ${FONT_MONO}`
    const callAdvance = charAdvance(ctx, callSize) + 1
    const cardW = Math.max(pilot.length * pilotAdvance, callsign.length * callAdvance) + 26
    const cardH = pilotSize + callSize + 20
    // Entra deslizando da esquerda, como a ficha do piloto num briefing.
    const x = (narrow ? 16 : Math.round(w * 0.08)) - (1 - alpha) * 18
    const y = Math.round(h * 0.42)

    ctx.globalAlpha = alpha
    ctx.fillStyle = 'rgba(10, 15, 30, 0.8)'
    ctx.fillRect(x, y, cardW, cardH)
    ctx.strokeStyle = '#334466'
    ctx.lineWidth = 1
    ctx.strokeRect(x + 0.5, y + 0.5, cardW - 1, cardH - 1)
    ctx.fillStyle = COLOR_PRIMARY
    ctx.fillRect(x, y, 3, cardH)

    ctx.fillStyle = COLOR_WARNING
    ctx.font = `bold ${pilotSize}px ${FONT_MONO}`
    drawChars(ctx, pilot, x + 13, y + cardH * 0.35, pilot.length, pilotAdvance)
    ctx.fillStyle = COLOR_MUTED
    ctx.font = `${callSize}px ${FONT_MONO}`
    drawChars(ctx, callsign, x + 13, y + cardH * 0.72, callsign.length, callAdvance)

    // Linha-guia da ficha até o caça.
    intro.worldToScreen(intro.jetX, intro.jetY, this.point)
    const fromX = x + cardW
    const toX = this.point.x - 20
    if (toX > fromX + 12) {
      ctx.strokeStyle = 'rgba(68, 170, 255, 0.55)'
      ctx.beginPath()
      ctx.moveTo(fromX, y + cardH / 2)
      ctx.lineTo(toX, this.point.y)
      ctx.stroke()
      ctx.fillStyle = COLOR_PRIMARY
      ctx.beginPath()
      ctx.arc(toX, this.point.y, 2.5, 0, Math.PI * 2)
      ctx.fill()
    }
    ctx.globalAlpha = 1
  }

  private renderTitle(ctx: CanvasRenderingContext2D, intro: IntroCinematic, w: number, h: number): void {
    const alpha = intro.titleAlpha
    const { title, subtitle, tagline } = intro.labels
    if (alpha <= 0 || !title) return
    // Cresce com a tela (o h1 do menu tem 52 px), sem estourar a largura no celular.
    const size = Math.round(Math.max(28, Math.min(96, h * 0.09, (w * 0.84) / (title.length * 0.76))))
    const cy = h * 0.42 - intro.titleLift * 28

    // Faixa escura para ler o título sobre a explosão, como o painel do menu.
    ctx.globalAlpha = alpha * 0.6
    ctx.fillStyle = '#0a0f1e'
    ctx.fillRect(0, cy - size * 1.35, w, size * 2.75)
    ctx.globalAlpha = alpha

    if (subtitle) {
      const subSize = fontSize(h, 11, 16)
      const spacing = (4 * subSize) / 11
      ctx.font = `${subSize}px ${FONT_MONO}`
      const advance = charAdvance(ctx, subSize) + spacing
      ctx.fillStyle = COLOR_DIM
      drawChars(ctx, subtitle, w / 2 - (subtitle.length * advance - spacing) / 2, cy - size * 0.95, subtitle.length, advance)
    }

    ctx.save()
    ctx.translate(w / 2, cy)
    const scale = intro.titleScale
    ctx.scale(scale, scale)
    ctx.font = `bold ${size}px ${FONT_TITLE}`
    const spacing = size * 0.15
    const advance = charAdvance(ctx, size) + spacing
    const x0 = -(title.length * advance - spacing) / 2
    ctx.fillStyle = COLOR_PRIMARY_SHADOW
    drawChars(ctx, title, x0, 3, title.length, advance)
    ctx.fillStyle = COLOR_PRIMARY
    ctx.shadowColor = 'rgba(68, 170, 255, 0.55)'
    ctx.shadowBlur = 22
    drawChars(ctx, title, x0, 0, title.length, advance)
    ctx.shadowBlur = 0
    ctx.restore()

    const taglineAlpha = intro.taglineAlpha
    if (tagline && taglineAlpha > 0) {
      ctx.globalAlpha = taglineAlpha
      const tagSize = fontSize(h, 13, 19)
      const spacing = (5 * tagSize) / 13
      ctx.font = `${tagSize}px ${FONT_MONO}`
      const advance = charAdvance(ctx, tagSize) + spacing
      ctx.fillStyle = COLOR_MUTED
      drawChars(ctx, tagline, w / 2 - (tagline.length * advance - spacing) / 2, cy + size * 0.95, tagline.length, advance)
    }
    ctx.globalAlpha = 1
  }

  private renderCallout(ctx: CanvasRenderingContext2D, intro: IntroCinematic, w: number, h: number): void {
    const alpha = intro.calloutAlpha
    const text = intro.labels.missionStart
    if (alpha <= 0 || !text) return
    const size = w < 520 ? 20 : fontSize(h, 26, 36)
    ctx.save()
    ctx.globalAlpha = alpha
    ctx.translate(w / 2, h * 0.4)
    const scale = intro.calloutScale
    ctx.scale(scale, scale)
    ctx.font = `bold ${size}px ${FONT_MONO}`
    const spacing = 3
    const advance = charAdvance(ctx, size) + spacing
    const half = (text.length * advance - spacing) / 2
    const rule = Math.min(90, w * 0.12)
    ctx.fillStyle = 'rgba(255, 204, 68, 0.6)'
    ctx.fillRect(-half - 18 - rule, -1, rule, 2)
    ctx.fillRect(half + 18, -1, rule, 2)
    ctx.fillStyle = COLOR_WARNING
    ctx.shadowColor = 'rgba(255, 204, 68, 0.6)'
    ctx.shadowBlur = 16
    drawChars(ctx, text, -half, 0, text.length, advance)
    ctx.shadowBlur = 0
    ctx.restore()
  }

  /** O monitor ligando: filete de fósforo que acende e se abre em imagem. */
  private renderPowerOn(ctx: CanvasRenderingContext2D, intro: IntroCinematic, w: number, h: number): void {
    const p = intro.powerOn
    if (p >= 1) return
    ctx.globalAlpha = 1
    ctx.fillStyle = '#000000'
    if (p <= 0) {
      ctx.fillRect(0, 0, w, h)
      return
    }
    const grow = clamp01(p / 0.2)
    const open = easeOut((p - 0.2) / 0.8)
    const band = Math.max(2, open * h)
    const top = (h - band) / 2
    ctx.fillRect(0, 0, w, top)
    ctx.fillRect(0, top + band, w, h - top - band)
    ctx.globalAlpha = 1 - open
    ctx.fillStyle = '#bfe6ff'
    const lineW = w * grow
    ctx.fillRect((w - lineW) / 2, top - 1, lineW, 2)
    ctx.fillRect((w - lineW) / 2, top + band - 1, lineW, 2)
    ctx.globalAlpha = 1
  }
}
