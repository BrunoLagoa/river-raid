// ---------------------------------------------------------------------------
// Retro 8-Bit Speech Synthesizer — Procedural Web Audio Speech
// Generates classic 80s arcade robotic vocal cues (Berzerk / Sinistar style)
// using formant filter banks (F1/F2 resonant bandpass), pitch envelopes,
// and noise modulators without external audio samples.
// ---------------------------------------------------------------------------

export type SpeechCue = 'warning_low_fuel' | 'combo_max' | 'boss_alert' | 'overdrive_ready' | 'mission_complete'

interface FormantFrame {
  /** Fundamental frequency (pitch in Hz) */
  pitch: number
  /** First formant center freq (Hz) */
  f1: number
  /** Second formant center freq (Hz) */
  f2: number
  /** Duration of phoneme in seconds */
  duration: number
  /** Amplitude / gain (0 to 1) */
  gain: number
  /** Noise amount for fricatives/plosives (0 to 1) */
  noise?: number
  /** Pitch bend target (Hz) */
  pitchEnd?: number
}

// Phoneme vowel / consonant formant mappings (Hz)
// Typical formant approximations:
// [AA] F1: 730, F2: 1090
// [EE] F1: 270, F2: 2290
// [OO] F1: 300, F2: 870
// [EH] F1: 530, F2: 1840
// [OH] F1: 570, F2: 840
// [ER] F1: 490, F2: 1350
// [AY] F1: 660, F2: 1720

const CUE_PHONEMES_EN: Record<SpeechCue, FormantFrame[]> = {
  // "WAR - NING: LOW FU - EL"
  warning_low_fuel: [
    // WAR
    { pitch: 120, pitchEnd: 110, f1: 500, f2: 900, duration: 0.12, gain: 0.85, noise: 0.2 },
    { pitch: 110, pitchEnd: 95, f1: 600, f2: 1100, duration: 0.14, gain: 0.9 },
    // pause
    { pitch: 100, f1: 500, f2: 1000, duration: 0.05, gain: 0 },
    // NING
    { pitch: 140, pitchEnd: 130, f1: 350, f2: 2100, duration: 0.16, gain: 0.8 },
    // pause
    { pitch: 100, f1: 500, f2: 1000, duration: 0.08, gain: 0 },
    // LOW
    { pitch: 105, pitchEnd: 95, f1: 550, f2: 850, duration: 0.15, gain: 0.9 },
    // pause
    { pitch: 100, f1: 500, f2: 1000, duration: 0.04, gain: 0 },
    // FU
    { pitch: 130, pitchEnd: 115, f1: 320, f2: 950, duration: 0.14, gain: 0.85, noise: 0.3 },
    // EL
    { pitch: 100, pitchEnd: 85, f1: 500, f2: 1700, duration: 0.18, gain: 0.75 },
  ],

  // "COM - BO MAX"
  combo_max: [
    // COM
    { pitch: 140, pitchEnd: 155, f1: 650, f2: 1100, duration: 0.13, gain: 0.85, noise: 0.2 },
    // BO
    { pitch: 175, pitchEnd: 190, f1: 500, f2: 850, duration: 0.15, gain: 0.95 },
    // pause
    { pitch: 100, f1: 500, f2: 1000, duration: 0.04, gain: 0 },
    // MAX
    { pitch: 210, pitchEnd: 230, f1: 750, f2: 1600, duration: 0.22, gain: 1.0, noise: 0.25 },
  ],

  // "BOSS A - LERT"
  boss_alert: [
    // BOSS
    { pitch: 85, pitchEnd: 80, f1: 580, f2: 950, duration: 0.18, gain: 1.0, noise: 0.3 },
    // pause
    { pitch: 80, f1: 500, f2: 1000, duration: 0.06, gain: 0 },
    // A
    { pitch: 100, pitchEnd: 110, f1: 700, f2: 1200, duration: 0.12, gain: 0.85 },
    // LERT
    { pitch: 125, pitchEnd: 95, f1: 480, f2: 1400, duration: 0.22, gain: 0.95, noise: 0.2 },
  ],

  // "O - VER - DRIVE REA - DY"
  overdrive_ready: [
    // O
    { pitch: 130, pitchEnd: 140, f1: 520, f2: 880, duration: 0.10, gain: 0.8 },
    // VER
    { pitch: 150, pitchEnd: 160, f1: 490, f2: 1400, duration: 0.12, gain: 0.85 },
    // DRIVE
    { pitch: 180, pitchEnd: 200, f1: 680, f2: 1750, duration: 0.18, gain: 0.95, noise: 0.2 },
    // pause
    { pitch: 100, f1: 500, f2: 1000, duration: 0.04, gain: 0 },
    // REA
    { pitch: 200, pitchEnd: 220, f1: 350, f2: 2100, duration: 0.14, gain: 0.9 },
    // DY
    { pitch: 240, pitchEnd: 260, f1: 300, f2: 2300, duration: 0.18, gain: 0.85 },
  ],

  // "MIS - SION COM - PLETE"
  mission_complete: [
    // MIS
    { pitch: 140, pitchEnd: 150, f1: 380, f2: 2000, duration: 0.12, gain: 0.8, noise: 0.25 },
    // SION
    { pitch: 160, pitchEnd: 150, f1: 500, f2: 1700, duration: 0.14, gain: 0.85, noise: 0.3 },
    // pause
    { pitch: 100, f1: 500, f2: 1000, duration: 0.05, gain: 0 },
    // COM
    { pitch: 170, pitchEnd: 180, f1: 650, f2: 1100, duration: 0.12, gain: 0.85 },
    // PLETE
    { pitch: 210, pitchEnd: 240, f1: 320, f2: 2250, duration: 0.24, gain: 1.0, noise: 0.2 },
  ],
}

const CUE_PHONEMES_PT: Record<SpeechCue, FormantFrame[]> = {
  // "A - LER - TA: COM - BUS - TI - VEL"
  warning_low_fuel: [
    // A
    { pitch: 115, pitchEnd: 120, f1: 700, f2: 1200, duration: 0.10, gain: 0.8 },
    // LER
    { pitch: 135, pitchEnd: 125, f1: 480, f2: 1450, duration: 0.13, gain: 0.9 },
    // TA
    { pitch: 110, pitchEnd: 95, f1: 650, f2: 1150, duration: 0.11, gain: 0.8 },
    // pause
    { pitch: 100, f1: 500, f2: 1000, duration: 0.06, gain: 0 },
    // COM
    { pitch: 120, pitchEnd: 110, f1: 550, f2: 850, duration: 0.12, gain: 0.85 },
    // BUS
    { pitch: 145, pitchEnd: 135, f1: 320, f2: 950, duration: 0.14, gain: 0.9, noise: 0.25 },
    // TI
    { pitch: 160, pitchEnd: 175, f1: 270, f2: 2250, duration: 0.13, gain: 0.95 },
    // VEL
    { pitch: 120, pitchEnd: 90, f1: 500, f2: 1700, duration: 0.18, gain: 0.85 },
  ],

  // "COM - BO MA - XI - MO"
  combo_max: [
    // COM
    { pitch: 140, pitchEnd: 155, f1: 650, f2: 1100, duration: 0.12, gain: 0.85, noise: 0.2 },
    // BO
    { pitch: 170, pitchEnd: 180, f1: 500, f2: 850, duration: 0.14, gain: 0.9 },
    // pause
    { pitch: 100, f1: 500, f2: 1000, duration: 0.04, gain: 0 },
    // MA
    { pitch: 200, pitchEnd: 215, f1: 720, f2: 1180, duration: 0.13, gain: 0.95 },
    // XI
    { pitch: 230, pitchEnd: 245, f1: 280, f2: 2280, duration: 0.14, gain: 1.0, noise: 0.2 },
    // MO
    { pitch: 190, pitchEnd: 170, f1: 520, f2: 880, duration: 0.16, gain: 0.85 },
  ],

  // "A - LER - TA CHE - FE"
  boss_alert: [
    // A
    { pitch: 90, pitchEnd: 100, f1: 700, f2: 1200, duration: 0.11, gain: 0.85 },
    // LER
    { pitch: 115, pitchEnd: 105, f1: 480, f2: 1450, duration: 0.14, gain: 0.95 },
    // TA
    { pitch: 95, pitchEnd: 85, f1: 650, f2: 1150, duration: 0.12, gain: 0.85 },
    // pause
    { pitch: 80, f1: 500, f2: 1000, duration: 0.05, gain: 0 },
    // CHE
    { pitch: 125, pitchEnd: 110, f1: 520, f2: 1800, duration: 0.15, gain: 0.95, noise: 0.3 },
    // FE
    { pitch: 95, pitchEnd: 75, f1: 490, f2: 1650, duration: 0.18, gain: 0.85, noise: 0.2 },
  ],

  // "SO - BRE - CAR - GA PRON - TA"
  overdrive_ready: [
    // SO
    { pitch: 140, pitchEnd: 150, f1: 520, f2: 880, duration: 0.11, gain: 0.8, noise: 0.2 },
    // BRE
    { pitch: 165, pitchEnd: 175, f1: 530, f2: 1840, duration: 0.12, gain: 0.85 },
    // CAR
    { pitch: 190, pitchEnd: 200, f1: 680, f2: 1200, duration: 0.14, gain: 0.95, noise: 0.2 },
    // GA
    { pitch: 170, pitchEnd: 160, f1: 700, f2: 1150, duration: 0.12, gain: 0.85 },
    // pause
    { pitch: 100, f1: 500, f2: 1000, duration: 0.04, gain: 0 },
    // PRON
    { pitch: 210, pitchEnd: 230, f1: 550, f2: 900, duration: 0.15, gain: 0.95, noise: 0.2 },
    // TA
    { pitch: 240, pitchEnd: 260, f1: 680, f2: 1180, duration: 0.18, gain: 0.9 },
  ],

  // "MIS - SAO CON - CLU - I - DA"
  mission_complete: [
    // MIS
    { pitch: 140, pitchEnd: 150, f1: 380, f2: 2000, duration: 0.11, gain: 0.8, noise: 0.25 },
    // SAO
    { pitch: 165, pitchEnd: 155, f1: 620, f2: 1100, duration: 0.15, gain: 0.9, noise: 0.2 },
    // pause
    { pitch: 100, f1: 500, f2: 1000, duration: 0.05, gain: 0 },
    // CON
    { pitch: 170, pitchEnd: 180, f1: 550, f2: 880, duration: 0.12, gain: 0.85 },
    // CLU
    { pitch: 200, pitchEnd: 220, f1: 300, f2: 870, duration: 0.14, gain: 0.9 },
    // I
    { pitch: 230, pitchEnd: 245, f1: 270, f2: 2290, duration: 0.12, gain: 0.95 },
    // DA
    { pitch: 210, pitchEnd: 180, f1: 680, f2: 1180, duration: 0.18, gain: 0.85 },
  ],
}

export class SpeechSynth8Bit {
  private ctx: AudioContext | null = null
  private outputNode: AudioNode | null = null
  private enabled = true
  private volume = 0.9
  private muted = false
  private language: 'en' | 'pt-BR' = 'en'
  private cooldowns: Record<SpeechCue, number> = {
    warning_low_fuel: 0,
    combo_max: 0,
    boss_alert: 0,
    overdrive_ready: 0,
    mission_complete: 0,
  }

  // Minimum interval in seconds between same speech cue
  private static readonly COOLDOWNS_SEC: Record<SpeechCue, number> = {
    warning_low_fuel: 7.0,
    combo_max: 5.0,
    boss_alert: 10.0,
    overdrive_ready: 8.0,
    mission_complete: 10.0,
  }

  init(ctx: AudioContext, outputNode: AudioNode): void {
    this.ctx = ctx
    this.outputNode = outputNode
  }

  setEnabled(enabled: boolean): void {
    this.enabled = enabled
  }

  setVolume(volume: number): void {
    this.volume = Math.max(0, Math.min(1, volume))
  }

  setMuted(muted: boolean): void {
    this.muted = muted
  }

  setLanguage(language: 'en' | 'pt-BR'): void {
    this.language = language
  }

  getLanguage(): 'en' | 'pt-BR' {
    return this.language
  }

  update(dt: number): void {
    const keys = Object.keys(this.cooldowns) as SpeechCue[]
    for (const cue of keys) {
      if (this.cooldowns[cue] > 0) {
        this.cooldowns[cue] = Math.max(0, this.cooldowns[cue] - dt)
      }
    }
  }

  reset(): void {
    const keys = Object.keys(this.cooldowns) as SpeechCue[]
    for (const cue of keys) {
      this.cooldowns[cue] = 0
    }
  }

  play(cue: SpeechCue): boolean {
    if (!this.enabled || this.muted || this.volume <= 0) return false
    if (this.cooldowns[cue] > 0) return false

    const dict = this.language === 'pt-BR' ? CUE_PHONEMES_PT : CUE_PHONEMES_EN
    const frames = dict[cue] ?? CUE_PHONEMES_EN[cue]
    if (!frames || !this.ctx || !this.outputNode) return false

    try {
      this.renderPhonemeSequence(frames)
    } catch {
      // Falhou sem reproduzir nada: não consome o cooldown, senão o aviso ficaria
      // mudo por segundos após um erro pontual de agendamento de nós de áudio.
      return false
    }

    this.cooldowns[cue] = SpeechSynth8Bit.COOLDOWNS_SEC[cue]
    return true
  }

  playWarningLowFuel(): boolean {
    return this.play('warning_low_fuel')
  }

  playComboMax(): boolean {
    return this.play('combo_max')
  }

  playBossAlert(): boolean {
    return this.play('boss_alert')
  }

  playOverdriveReady(): boolean {
    return this.play('overdrive_ready')
  }

  playMissionComplete(): boolean {
    return this.play('mission_complete')
  }

  private renderPhonemeSequence(frames: FormantFrame[]): void {
    if (!this.ctx || !this.outputNode) return

    const now = this.ctx.currentTime
    let timeCursor = now + 0.02 // slight head margin

    for (const frame of frames) {
      if (frame.gain > 0) {
        this.synthesizeFrame(frame, timeCursor)
      }
      timeCursor += frame.duration
    }
  }

  private synthesizeFrame(frame: FormantFrame, startTime: number): void {
    if (!this.ctx || !this.outputNode) return

    const endTime = startTime + frame.duration

    // 1. Fundamental Glottal Pulse Generator (Sawtooth with robotic resonance)
    const osc = this.ctx.createOscillator()
    osc.type = 'sawtooth'
    osc.frequency.setValueAtTime(frame.pitch, startTime)
    if (frame.pitchEnd && frame.pitchEnd !== frame.pitch) {
      osc.frequency.exponentialRampToValueAtTime(Math.max(20, frame.pitchEnd), endTime)
    }

    // 2. Formant Filter Bank: F1 (Lower Vowel Cavity) & F2 (Upper Tongue/Oral Cavity)
    const f1Filter = this.ctx.createBiquadFilter()
    f1Filter.type = 'bandpass'
    f1Filter.frequency.setValueAtTime(frame.f1, startTime)
    f1Filter.Q.setValueAtTime(4.5, startTime)

    const f2Filter = this.ctx.createBiquadFilter()
    f2Filter.type = 'bandpass'
    f2Filter.frequency.setValueAtTime(frame.f2, startTime)
    f2Filter.Q.setValueAtTime(5.5, startTime)

    // Master envelope for this frame
    const frameGain = this.ctx.createGain()
    // O nó do canal `voiceGain` já aplica `this.volume`; multiplicar de novo aqui
    // deixava o slider com resposta quadrática (50% de slider -> 25% de ganho).
    const targetGain = frame.gain * 0.45
    frameGain.gain.setValueAtTime(0.001, startTime)
    frameGain.gain.linearRampToValueAtTime(targetGain, startTime + frame.duration * 0.2)
    frameGain.gain.linearRampToValueAtTime(0.001, endTime)

    // Connect Glottal Pulse -> Parallel Formant Filters -> Frame Gain
    osc.connect(f1Filter)
    osc.connect(f2Filter)
    f1Filter.connect(frameGain)
    f2Filter.connect(frameGain)

    // 3. Fricative / Plosive Noise Generator if phoneme has noise component
    if (frame.noise && frame.noise > 0) {
      const bufferSize = Math.max(128, Math.floor(this.ctx.sampleRate * frame.duration))
      const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate)
      const output = noiseBuffer.getChannelData(0)
      for (let i = 0; i < bufferSize; i++) {
        output[i] = Math.random() * 2 - 1
      }

      const noiseSource = this.ctx.createBufferSource()
      noiseSource.buffer = noiseBuffer

      const noiseFilter = this.ctx.createBiquadFilter()
      noiseFilter.type = 'highpass'
      noiseFilter.frequency.setValueAtTime(3200, startTime)

      const noiseGain = this.ctx.createGain()
      const noisePeak = frame.noise * 0.2
      // Envelope do fricativo modulado pelo frameGain
      noiseGain.gain.setValueAtTime(0.001, startTime)
      noiseGain.gain.linearRampToValueAtTime(noisePeak, startTime + Math.min(0.02, frame.duration * 0.25))
      noiseGain.gain.linearRampToValueAtTime(0.001, endTime)

      noiseSource.connect(noiseFilter)
      noiseFilter.connect(noiseGain)
      noiseGain.connect(frameGain)

      noiseSource.start(startTime)
      noiseSource.stop(endTime)
    }

    frameGain.connect(this.outputNode)

    osc.start(startTime)
    osc.stop(endTime)
  }
}
