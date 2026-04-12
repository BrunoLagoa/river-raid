export class SoundManager {
  private ctx: AudioContext | null = null
  private masterGain: GainNode | null = null
  private muted = false


  init(): void {
    if (this.ctx) return
    this.ctx = new AudioContext()
    this.masterGain = this.ctx.createGain()
    this.masterGain.gain.value = 0.3
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
      this.masterGain.gain.value = this.muted ? 0 : 0.3
    }
    return this.muted
  }

  isMuted(): boolean {
    return this.muted
  }

  private ensureCtx(): AudioContext | null {
    if (!this.ctx) this.init()
    this.resume()
    return this.ctx
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

  gameOver(): void {
    const ctx = this.ensureCtx()
    if (!ctx || !this.masterGain) return

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
    if (this.ctx) {
      this.ctx.close()
      this.ctx = null
      this.masterGain = null
    }
  }
}
