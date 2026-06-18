// ---------------------------------------------------------------------------
// Trilha ambiente "MIDI-style" — composta e tocada pelo motor de osciladores.
// Tema heroico de aventura em Ré menor. Progressão épica:
//   Dm | Bb | F | C | Dm | Gm | A | A   (i - VI - III - VII / i - iv - V - V)
// Apenas o som de fundo usa estes dados; os demais SFX permanecem como antes.
// ---------------------------------------------------------------------------

const NOTE: Record<string, number> = {
  G1: 49.0, A1: 55.0, Bb1: 58.27,
  C2: 65.41, D2: 73.42, E2: 82.41, F2: 87.31, G2: 98.0,
  C3: 130.81, D3: 146.83, E3: 164.81, F3: 174.61, G3: 196.0, Ab3: 207.65, A3: 220.0, Bb3: 233.08, B3: 246.94,
  C4: 261.63, Db4: 277.18, D4: 293.66, E4: 329.63, F4: 349.23, G4: 392.0, Ab4: 415.3, A4: 440.0, Bb4: 466.16, B4: 493.88,
  C5: 523.25, Db5: 554.37, D5: 587.33, E5: 659.25, F5: 698.46, G5: 783.99, A5: 880.0,
}

interface NoteEvent {
  freq: number
  steps: number
}

interface CompiledSong {
  lead: Map<number, NoteEvent>
  bass: Map<number, NoteEvent>
  pad: Map<number, number[]>
}

// Uma trilha = melodia ('.' sustenta, '-' pausa), raízes de baixo e acordes de
// pad por compasso (16 semicolcheias cada), além de timbre e estilo de bateria.
interface MusicTrack {
  stepMs: number
  leadType: OscillatorType
  drums: 'full' | 'soft' | 'none'
  lead: string[]
  bassRoots: string[]
  padChords: string[][]
}

// --- Trilha de jogo: tema heroico de aventura em Ré menor (132 BPM) ----------
// Progressão: Dm | Bb | F | C | Dm | Gm | A | A
const GAME_TRACK: MusicTrack = {
  stepMs: 114,
  leadType: 'square',
  drums: 'full',
  lead: [
    // 1 · Dm — chamado heroico
    'A4', '.', '.', '.', 'D5', '.', '.', '.', 'F5', '.', 'E5', '.', 'D5', '.', '.', '.',
    // 2 · Bb — resposta descendente
    '-', '.', 'F5', '.', 'D5', '.', 'Bb4', '.', 'D5', '.', '.', '.', '.', '.', '.', '.',
    // 3 · F — abertura luminosa
    'C5', '.', '.', '.', 'A4', '.', '.', '.', 'F4', '.', 'A4', '.', 'C5', '.', '.', '.',
    // 4 · C — clímax e suspiro
    'E5', '.', 'D5', '.', 'C5', '.', '.', '.', 'G4', '.', '.', '.', '.', '.', '.', '.',
    // 5 · Dm — retomada do tema
    'A4', '.', '.', '.', 'D5', '.', '.', '.', 'F5', '.', 'E5', '.', 'D5', '.', '.', '.',
    // 6 · Gm — tensão crescente
    'Bb4', '.', '.', '.', 'G4', '.', '.', '.', 'D5', '.', '.', '.', 'Bb4', '.', '.', '.',
    // 7 · A — voo épico (dominante maior, C#)
    'Db5', '.', '.', '.', 'E5', '.', '.', '.', 'A5', '.', 'G5', '.', 'E5', '.', 'Db5', '.',
    // 8 · A — resolução suspensa, prepara o loop
    'D5', '.', '.', '.', 'Db5', '.', '.', '.', 'A4', '.', '.', '.', '-', '.', '-', '.',
  ],
  bassRoots: ['D2', 'Bb1', 'F2', 'C2', 'D2', 'G1', 'A1', 'A1'],
  padChords: [
    ['D3', 'F3', 'A3'],   // Dm
    ['Bb1', 'D3', 'F3'],  // Bb
    ['F3', 'A3', 'C4'],   // F
    ['C3', 'E3', 'G3'],   // C
    ['D3', 'F3', 'A3'],   // Dm
    ['G3', 'Bb3', 'D4'],  // Gm
    ['A3', 'Db4', 'E4'],  // A
    ['A3', 'Db4', 'E4'],  // A
  ],
}

// --- Trilha do menu: synthwave neon, sonhador e nostálgico (100 BPM) ---------
// Tom Lá menor, progressão "épica" Am | F | C | G (vi-IV-I-V), com virada
// Am | F | G | E para um suspiro de expectativa antes do loop. Timbre suave
// (triangle), sem kick/snare — só um chimbal arejado segurando o pulso.
const MENU_TRACK: MusicTrack = {
  stepMs: 150,
  leadType: 'triangle',
  drums: 'soft',
  lead: [
    // 1 · Am — abertura serena
    'E4', '.', '.', '.', 'A4', '.', '.', '.', 'C5', '.', 'B4', '.', 'A4', '.', '.', '.',
    // 2 · F — respira
    '-', '.', 'C5', '.', 'A4', '.', 'F4', '.', 'A4', '.', '.', '.', '.', '.', '.', '.',
    // 3 · C — luz crescente
    'G4', '.', '.', '.', 'C5', '.', '.', '.', 'E5', '.', 'D5', '.', 'C5', '.', '.', '.',
    // 4 · G — frase suspensa
    'D5', '.', 'B4', '.', 'G4', '.', '.', '.', '-', '.', '.', '.', '.', '.', '.', '.',
    // 5 · Am — retomada do tema
    'E4', '.', '.', '.', 'A4', '.', '.', '.', 'C5', '.', 'B4', '.', 'A4', '.', '.', '.',
    // 6 · F — voo emotivo
    'F5', '.', '.', '.', 'E5', '.', '.', '.', 'C5', '.', 'A4', '.', 'F4', '.', '.', '.',
    // 7 · G — antecipação
    'G4', '.', '.', '.', 'B4', '.', '.', '.', 'D5', '.', '.', '.', 'G4', '.', '.', '.',
    // 8 · E — tensão doce (dominante maior, G#) que pede o recomeço
    'Ab4', '.', '.', '.', 'B4', '.', '.', '.', 'E5', '.', '.', '.', '-', '.', '-', '.',
  ],
  bassRoots: ['A1', 'F2', 'C2', 'G2', 'A1', 'F2', 'G2', 'E2'],
  padChords: [
    ['A3', 'C4', 'E4'],   // Am
    ['F3', 'A3', 'C4'],   // F
    ['C3', 'E3', 'G3'],   // C
    ['G3', 'B3', 'D4'],   // G
    ['A3', 'C4', 'E4'],   // Am
    ['F3', 'A3', 'C4'],   // F
    ['G3', 'B3', 'D4'],   // G
    ['E3', 'Ab3', 'B3'],  // E
  ],
}

export class SoundManager {
  private ctx: AudioContext | null = null
  private masterGain: GainNode | null = null
  private muted = false
  private volume = 0.3
  private musicTimer: number | null = null
  private musicStep = 0
  private active: { track: MusicTrack; compiled: CompiledSong; totalSteps: number } | null = null

  private static readonly STEPS_PER_BAR = 16


  init(): void {
    if (this.ctx) return
    this.ctx = new AudioContext()
    this.masterGain = this.ctx.createGain()
    this.masterGain.gain.value = this.muted ? 0 : this.volume
    this.masterGain.connect(this.ctx.destination)
  }

  resume(): void {
    if (this.ctx?.state === 'suspended') {
      void this.ctx.resume()
    }
  }

  toggleMute(): boolean {
    this.muted = !this.muted
    if (this.masterGain) {
      this.masterGain.gain.value = this.muted ? 0 : this.volume
    }
    return this.muted
  }

  isMuted(): boolean {
    return this.muted
  }

  setVolume(volume: number): void {
    this.volume = Math.max(0, Math.min(1, volume))
    if (this.masterGain && !this.muted) {
      this.masterGain.gain.value = this.volume
    }
  }

  private ensureCtx(): AudioContext | null {
    if (!this.ctx) this.init()
    this.resume()
    return this.ctx
  }

  // Trilha de jogo — tema heroico de aventura.
  startMusic(): void {
    this.playTrack(GAME_TRACK)
  }

  // Trilha de menu — synthwave neon, sonhador.
  startMenuMusic(): void {
    this.playTrack(MENU_TRACK)
  }

  private playTrack(track: MusicTrack): void {
    const ctx = this.ensureCtx()
    if (!ctx || !this.masterGain || this.musicTimer !== null) return
    this.active = {
      track,
      compiled: SoundManager.compileSong(track),
      totalSteps: track.lead.length,
    }
    this.musicStep = 0
    this.playMusicStep()
  }

  stopMusic(): void {
    if (this.musicTimer !== null) {
      window.clearTimeout(this.musicTimer)
      this.musicTimer = null
    }
    this.active = null
  }

  // Converte os tokens de uma trilha em eventos prontos para o sequenciador.
  private static compileSong(track: MusicTrack): CompiledSong {
    const { lead: tokens } = track
    const lead = new Map<number, NoteEvent>()
    for (let i = 0; i < tokens.length; i++) {
      const tok = tokens[i]
      if (tok === '.' || tok === '-') continue
      const freq = NOTE[tok]
      if (freq === undefined) continue
      let steps = 1
      while (tokens[i + steps] === '.') steps++
      lead.set(i, { freq, steps })
    }

    const bass = new Map<number, NoteEvent>()
    const pad = new Map<number, number[]>()
    const bars = tokens.length / SoundManager.STEPS_PER_BAR
    for (let b = 0; b < bars; b++) {
      const base = b * SoundManager.STEPS_PER_BAR
      const root = NOTE[track.bassRoots[b]]
      // Pulso de baixo a cada semínima.
      for (const q of [0, 4, 8, 12]) bass.set(base + q, { freq: root, steps: 3 })
      // Pad sustentado pelo compasso inteiro.
      pad.set(base, track.padChords[b].map((n) => NOTE[n]))
    }

    return { lead, bass, pad }
  }

  startEngine(): void {
    // Engine sound removed as per user request
  }

  stopEngine(): void {
    // Engine sound removed
  }

  updateEngine(): void {
  }

  private playMusicStep(): void {
    const ctx = this.ensureCtx()
    if (!ctx || !this.masterGain || !this.active) return

    const { track, compiled, totalSteps } = this.active
    const start = ctx.currentTime + 0.02
    const stepSec = track.stepMs / 1000
    const step = this.musicStep % totalSteps

    // Pad emocional — acordes sustentados que dão profundidade à cena.
    const chord = compiled.pad.get(step)
    if (chord) {
      const barSec = SoundManager.STEPS_PER_BAR * stepSec
      for (const freq of chord) {
        this.playVoice(freq, start, barSec * 0.96, 'triangle', 0.014, barSec * 0.25)
      }
    }

    // Baixo pulsante — motor da trilha.
    const bassEv = compiled.bass.get(step)
    if (bassEv) {
      this.playVoice(bassEv.freq, start, bassEv.steps * stepSec, 'triangle', 0.06, 0.04)
    }

    // Melodia — timbre da trilha com camada grave (triangle) para calor/emoção.
    const leadEv = compiled.lead.get(step)
    if (leadEv) {
      const dur = leadEv.steps * stepSec
      this.playVoice(leadEv.freq, start, dur, track.leadType, 0.05, Math.min(0.12, dur * 0.4))
      this.playVoice(leadEv.freq / 2, start, dur, 'triangle', 0.022, Math.min(0.12, dur * 0.4))
    }

    // Bateria — varia conforme o estilo da trilha.
    const beat = step % SoundManager.STEPS_PER_BAR
    if (track.drums === 'full') {
      if (beat === 0 || beat === 8) this.drumKick(start)
      if (beat === 4 || beat === 12) this.drumSnare(start)
      if (beat % 2 === 0) this.drumHat(start)
    } else if (track.drums === 'soft') {
      if (beat === 0) this.drumKick(start)
      if (beat === 4 || beat === 12) this.drumHat(start)
    }

    this.musicStep += 1
    this.musicTimer = window.setTimeout(() => {
      this.playMusicStep()
    }, track.stepMs)
  }

  // Voz genérica com envelope ataque/sustentação/decaimento (ADSR simplificado).
  private playVoice(
    freq: number,
    start: number,
    dur: number,
    type: OscillatorType,
    peak: number,
    release: number,
  ): void {
    if (!this.ctx || !this.masterGain) return
    const ctx = this.ctx
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.type = type
    osc.frequency.setValueAtTime(freq, start)
    const attack = Math.min(0.03, dur * 0.3)
    gain.gain.setValueAtTime(0.0001, start)
    gain.gain.exponentialRampToValueAtTime(peak, start + attack)
    gain.gain.setValueAtTime(peak, start + Math.max(attack, dur - release))
    gain.gain.exponentialRampToValueAtTime(0.0001, start + dur)
    osc.connect(gain)
    gain.connect(this.masterGain)
    osc.start(start)
    osc.stop(start + dur + 0.02)
  }

  private drumKick(start: number): void {
    if (!this.ctx || !this.masterGain) return
    const ctx = this.ctx
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.type = 'sine'
    osc.frequency.setValueAtTime(150, start)
    osc.frequency.exponentialRampToValueAtTime(45, start + 0.12)
    gain.gain.setValueAtTime(0.22, start)
    gain.gain.exponentialRampToValueAtTime(0.001, start + 0.16)
    osc.connect(gain)
    gain.connect(this.masterGain)
    osc.start(start)
    osc.stop(start + 0.18)
  }

  private drumSnare(start: number): void {
    if (!this.ctx || !this.masterGain) return
    const ctx = this.ctx
    const dur = 0.14
    const buffer = ctx.createBuffer(1, Math.floor(ctx.sampleRate * dur), ctx.sampleRate)
    const data = buffer.getChannelData(0)
    for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / data.length)
    const noise = ctx.createBufferSource()
    noise.buffer = buffer
    const filter = ctx.createBiquadFilter()
    filter.type = 'highpass'
    filter.frequency.setValueAtTime(1200, start)
    const gain = ctx.createGain()
    gain.gain.setValueAtTime(0.11, start)
    gain.gain.exponentialRampToValueAtTime(0.001, start + dur)
    noise.connect(filter)
    filter.connect(gain)
    gain.connect(this.masterGain)
    noise.start(start)
    noise.stop(start + dur)
  }

  private drumHat(start: number): void {
    if (!this.ctx || !this.masterGain) return
    const ctx = this.ctx
    const dur = 0.03
    const buffer = ctx.createBuffer(1, Math.floor(ctx.sampleRate * dur), ctx.sampleRate)
    const data = buffer.getChannelData(0)
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1
    const noise = ctx.createBufferSource()
    noise.buffer = buffer
    const filter = ctx.createBiquadFilter()
    filter.type = 'highpass'
    filter.frequency.setValueAtTime(7000, start)
    const gain = ctx.createGain()
    gain.gain.setValueAtTime(0.04, start)
    gain.gain.exponentialRampToValueAtTime(0.001, start + dur)
    noise.connect(filter)
    filter.connect(gain)
    gain.connect(this.masterGain)
    noise.start(start)
    noise.stop(start + dur)
  }

  shoot(): void {
    const ctx = this.ensureCtx()
    if (!ctx || !this.masterGain) return

    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.type = 'square'
    osc.frequency.setValueAtTime(880, ctx.currentTime)
    osc.frequency.exponentialRampToValueAtTime(220, ctx.currentTime + 0.08)
    gain.gain.setValueAtTime(0.15, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.08)
    osc.connect(gain)
    gain.connect(this.masterGain)
    osc.start(ctx.currentTime)
    osc.stop(ctx.currentTime + 0.08)
  }

  explosion(): void {
    const ctx = this.ensureCtx()
    if (!ctx || !this.masterGain) return

    const bufferSize = ctx.sampleRate * 0.4
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate)
    const data = buffer.getChannelData(0)
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize)
    }
    const noise = ctx.createBufferSource()
    noise.buffer = buffer

    const filter = ctx.createBiquadFilter()
    filter.type = 'lowpass'
    filter.frequency.setValueAtTime(1000, ctx.currentTime)
    filter.frequency.exponentialRampToValueAtTime(100, ctx.currentTime + 0.3)

    const gain = ctx.createGain()
    gain.gain.setValueAtTime(0.4, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4)

    noise.connect(filter)
    filter.connect(gain)
    gain.connect(this.masterGain)
    noise.start(ctx.currentTime)
    noise.stop(ctx.currentTime + 0.4)

    const osc = ctx.createOscillator()
    const oscGain = ctx.createGain()
    osc.type = 'sine'
    osc.frequency.setValueAtTime(150, ctx.currentTime)
    osc.frequency.exponentialRampToValueAtTime(30, ctx.currentTime + 0.3)
    oscGain.gain.setValueAtTime(0.3, ctx.currentTime)
    oscGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3)
    osc.connect(oscGain)
    oscGain.connect(this.masterGain)
    osc.start(ctx.currentTime)
    osc.stop(ctx.currentTime + 0.3)
  }

  fuelCollect(): void {
    const ctx = this.ensureCtx()
    if (!ctx || !this.masterGain) return

    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.type = 'sine'
    osc.frequency.setValueAtTime(440, ctx.currentTime)
    osc.frequency.setValueAtTime(660, ctx.currentTime + 0.06)
    osc.frequency.setValueAtTime(880, ctx.currentTime + 0.12)
    gain.gain.setValueAtTime(0.2, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.2)
    osc.connect(gain)
    gain.connect(this.masterGain)
    osc.start(ctx.currentTime)
    osc.stop(ctx.currentTime + 0.2)
  }

  lowFuelBeep(): void {
    const ctx = this.ensureCtx()
    if (!ctx || !this.masterGain) return

    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.type = 'square'
    osc.frequency.setValueAtTime(880, ctx.currentTime) // High pitch
    gain.gain.setValueAtTime(0.1, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.1)

    osc.connect(gain)
    gain.connect(this.masterGain)
    osc.start(ctx.currentTime)
    osc.stop(ctx.currentTime + 0.1)
  }

  enemyHit(): void {
    const ctx = this.ensureCtx()
    if (!ctx || !this.masterGain) return

    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.type = 'sawtooth'
    osc.frequency.setValueAtTime(400, ctx.currentTime)
    osc.frequency.exponentialRampToValueAtTime(80, ctx.currentTime + 0.15)
    gain.gain.setValueAtTime(0.15, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15)
    osc.connect(gain)
    gain.connect(this.masterGain)
    osc.start(ctx.currentTime)
    osc.stop(ctx.currentTime + 0.15)
  }

  powerUpBomb(): void {
    const ctx = this.ensureCtx()
    if (!ctx || !this.masterGain) return

    const master = this.masterGain

    // Noise burst curto
    const bufferSize = ctx.sampleRate * 0.08
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate)
    const data = buffer.getChannelData(0)
    for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1
    const noise = ctx.createBufferSource()
    noise.buffer = buffer
    const noiseGain = ctx.createGain()
    noiseGain.gain.setValueAtTime(0.3, ctx.currentTime)
    noiseGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.08)
    noise.connect(noiseGain)
    noiseGain.connect(master)
    noise.start(ctx.currentTime)
    noise.stop(ctx.currentTime + 0.08)

    // Pitch descendente
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.type = 'square'
    osc.frequency.setValueAtTime(600, ctx.currentTime)
    osc.frequency.exponentialRampToValueAtTime(80, ctx.currentTime + 0.15)
    gain.gain.setValueAtTime(0.2, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15)
    osc.connect(gain)
    gain.connect(master)
    osc.start(ctx.currentTime)
    osc.stop(ctx.currentTime + 0.15)
  }

  bombShockwave(): void {
    const ctx = this.ensureCtx()
    if (!ctx || !this.masterGain) return

    const master = this.masterGain

    // Low-freq rumble descendente
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.type = 'sine'
    osc.frequency.setValueAtTime(120, ctx.currentTime)
    osc.frequency.exponentialRampToValueAtTime(20, ctx.currentTime + 0.5)
    gain.gain.setValueAtTime(0.35, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5)
    osc.connect(gain)
    gain.connect(master)
    osc.start(ctx.currentTime)
    osc.stop(ctx.currentTime + 0.5)

    // Noise layer para textura
    const bufferSize = ctx.sampleRate * 0.3
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate)
    const data = buffer.getChannelData(0)
    for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1
    const noise = ctx.createBufferSource()
    noise.buffer = buffer
    const filter = ctx.createBiquadFilter()
    filter.type = 'lowpass'
    filter.frequency.value = 200
    const noiseGain = ctx.createGain()
    noiseGain.gain.setValueAtTime(0.2, ctx.currentTime)
    noiseGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3)
    noise.connect(filter)
    filter.connect(noiseGain)
    noiseGain.connect(master)
    noise.start(ctx.currentTime)
    noise.stop(ctx.currentTime + 0.3)
  }

  powerUpRapidFire(): void {
    const ctx = this.ensureCtx()
    if (!ctx || !this.masterGain) return

    const master = this.masterGain

    // Chirp ascendente agudo
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.type = 'square'
    osc.frequency.setValueAtTime(440, ctx.currentTime)
    osc.frequency.exponentialRampToValueAtTime(1200, ctx.currentTime + 0.12)
    gain.gain.setValueAtTime(0.15, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.12)
    osc.connect(gain)
    gain.connect(master)
    osc.start(ctx.currentTime)
    osc.stop(ctx.currentTime + 0.12)
  }

  powerUpMagnet(): void {
    const ctx = this.ensureCtx()
    if (!ctx || !this.masterGain) return

    const master = this.masterGain

    // Pulso suave ascendente
    const notes = [330, 495, 660]
    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.type = 'sine'
      const start = ctx.currentTime + i * 0.07
      osc.frequency.setValueAtTime(freq, start)
      gain.gain.setValueAtTime(0.12, start)
      gain.gain.exponentialRampToValueAtTime(0.001, start + 0.1)
      osc.connect(gain)
      gain.connect(master)
      osc.start(start)
      osc.stop(start + 0.1)
    })
  }

  gameOver(): void {
    const ctx = this.ensureCtx()
    if (!ctx || !this.masterGain) return

    this.stopMusic()
    this.stopEngine()

    const master = this.masterGain
    const notes = [440, 370, 311, 261]
    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.type = 'square'
      const start = ctx.currentTime + i * 0.2
      osc.frequency.setValueAtTime(freq, start)
      gain.gain.setValueAtTime(0.15, start)
      gain.gain.exponentialRampToValueAtTime(0.001, start + 0.18)
      osc.connect(gain)
      gain.connect(master)
      osc.start(start)
      osc.stop(start + 0.18)
    })
  }

  destroy(): void {
    this.stopMusic()
    this.stopEngine()
    if (this.ctx) {
      void this.ctx.close()
      this.ctx = null
      this.masterGain = null
    }
  }
}
