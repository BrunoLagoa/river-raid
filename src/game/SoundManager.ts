export class SoundManager {
  private ctx: AudioContext | null = null
  private masterGain: GainNode | null = null
  private muted = false
  private volume = 0.3
  private musicTimer: number | null = null
  private musicStep = 0
  private currentMusicVariation = 0

  private static readonly MELODY = [659.25, 783.99, 880, 783.99, 698.46, 783.99, 987.77, 880]
  private static readonly MELODY_VAR_1 = [880, 987.77, 1046.50, 987.77, 880, 783.99, 880, 659.25]
  private static readonly BASS = [164.81, 164.81, 196, 196, 174.61, 174.61, 220, 196]


  init(): void {
    if (this.ctx) return
    this.ctx = new AudioContext()
    this.masterGain = this.ctx.createGain()
    this.masterGain.gain.value = this.muted ? 0 : this.volume
    this.masterGain.connect(this.ctx.destination)
  }

  resume(): void {
    if (this.ctx?.state === 'suspended') {
      this.ctx.resume()
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

  startMusic(): void {
    const ctx = this.ensureCtx()
    if (!ctx || !this.masterGain || this.musicTimer !== null) return
    this.musicStep = 0
    this.playMusicStep()
  }

  stopMusic(): void {
    if (this.musicTimer !== null) {
      window.clearTimeout(this.musicTimer)
      this.musicTimer = null
    }
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
    if (!ctx || !this.masterGain) return

    const start = ctx.currentTime + 0.02

    // Switch variation every 4 measures (32 steps)
    if (this.musicStep > 0 && this.musicStep % 32 === 0) {
      this.currentMusicVariation = (this.currentMusicVariation + 1) % 2
    }
    const currentMelody = this.currentMusicVariation === 0 ? SoundManager.MELODY : SoundManager.MELODY_VAR_1
    const melodyFreq = currentMelody[this.musicStep % currentMelody.length]
    const bassFreq = SoundManager.BASS[this.musicStep % SoundManager.BASS.length]

    const leadOsc = ctx.createOscillator()
    const leadGain = ctx.createGain()
    leadOsc.type = 'square'
    leadOsc.frequency.setValueAtTime(melodyFreq, start)
    leadGain.gain.setValueAtTime(0.02, start)
    leadGain.gain.exponentialRampToValueAtTime(0.001, start + 0.14)
    leadOsc.connect(leadGain)
    leadGain.connect(this.masterGain)
    leadOsc.start(start)
    leadOsc.stop(start + 0.16)

    if (bassFreq > 0) {
      const bassOsc = ctx.createOscillator()
      const bassGain = ctx.createGain()
      bassOsc.type = 'triangle'
      bassOsc.frequency.setValueAtTime(bassFreq, start)
      bassGain.gain.setValueAtTime(0.012, start)
      bassGain.gain.exponentialRampToValueAtTime(0.001, start + 0.16)
      bassOsc.connect(bassGain)
      bassGain.connect(this.masterGain)
      bassOsc.start(start)
      bassOsc.stop(start + 0.18)
    }

    this.musicStep += 1
    this.musicTimer = window.setTimeout(() => {
      this.playMusicStep()
    }, 180)
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
      this.ctx.close()
      this.ctx = null
      this.masterGain = null
    }
  }
}
