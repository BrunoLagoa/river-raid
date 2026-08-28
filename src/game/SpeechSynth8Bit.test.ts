import { describe, it, expect, vi, beforeEach } from 'vitest'
import { SpeechSynth8Bit } from './SpeechSynth8Bit'

function createMockAudioContext(): {
  ctx: AudioContext
  destination: GainNode
} {
  const destination = {
    connect: vi.fn(),
  } as unknown as GainNode

  const ctx = {
    currentTime: 0,
    sampleRate: 44100,
    createOscillator: vi.fn(() => ({
      type: 'sawtooth',
      frequency: {
        setValueAtTime: vi.fn(),
        exponentialRampToValueAtTime: vi.fn(),
      },
      connect: vi.fn(),
      start: vi.fn(),
      stop: vi.fn(),
    })),
    createBiquadFilter: vi.fn(() => ({
      type: 'bandpass',
      frequency: { setValueAtTime: vi.fn() },
      Q: { setValueAtTime: vi.fn() },
      connect: vi.fn(),
    })),
    createGain: vi.fn(() => ({
      gain: {
        setValueAtTime: vi.fn(),
        linearRampToValueAtTime: vi.fn(),
      },
      connect: vi.fn(),
    })),
    createBuffer: vi.fn(() => ({
      getChannelData: vi.fn(() => new Float32Array(128)),
    })),
    createBufferSource: vi.fn(() => ({
      buffer: null,
      connect: vi.fn(),
      start: vi.fn(),
      stop: vi.fn(),
    })),
  } as unknown as AudioContext

  return { ctx, destination }
}

describe('SpeechSynth8Bit', () => {
  let synth: SpeechSynth8Bit
  let mockAudio: ReturnType<typeof createMockAudioContext>

  beforeEach(() => {
    synth = new SpeechSynth8Bit()
    mockAudio = createMockAudioContext()
  })

  it('nao toca sem inicializacao com audio context', () => {
    expect(synth.playWarningLowFuel()).toBe(false)
  })

  it('toca warning low fuel e aplica cooldown', () => {
    synth.init(mockAudio.ctx, mockAudio.destination)
    expect(synth.playWarningLowFuel()).toBe(true)

    // Segunda chamada imediata bloqueada por cooldown
    expect(synth.playWarningLowFuel()).toBe(false)

    // Avanca o tempo do cooldown (7s)
    synth.update(7.1)
    expect(synth.playWarningLowFuel()).toBe(true)
  })

  it('toca outros avisos de voz retrô', () => {
    synth.init(mockAudio.ctx, mockAudio.destination)

    expect(synth.playComboMax()).toBe(true)
    expect(synth.playBossAlert()).toBe(true)
    expect(synth.playOverdriveReady()).toBe(true)
    expect(synth.playMissionComplete()).toBe(true)
  })

  it('respeita toggle de enabled, volume e muted', () => {
    synth.init(mockAudio.ctx, mockAudio.destination)

    synth.setEnabled(false)
    expect(synth.playWarningLowFuel()).toBe(false)

    synth.setEnabled(true)
    synth.setVolume(0)
    expect(synth.playWarningLowFuel()).toBe(false)

    synth.setVolume(0.8)
    synth.setMuted(true)
    expect(synth.playWarningLowFuel()).toBe(false)

    synth.setMuted(false)
    expect(synth.playWarningLowFuel()).toBe(true)
  })

  it('reset zera todos os cooldowns', () => {
    synth.init(mockAudio.ctx, mockAudio.destination)
    synth.playComboMax()
    expect(synth.playComboMax()).toBe(false)

    synth.reset()
    expect(synth.playComboMax()).toBe(true)
  })

  it('suporta modo bilingue pt-BR e en', () => {
    synth.init(mockAudio.ctx, mockAudio.destination)
    expect(synth.getLanguage()).toBe('en')

    synth.setLanguage('pt-BR')
    expect(synth.getLanguage()).toBe('pt-BR')
    expect(synth.playWarningLowFuel()).toBe(true)

    synth.reset()
    expect(synth.playBossAlert()).toBe(true)
    synth.reset()
    expect(synth.playOverdriveReady()).toBe(true)
    synth.reset()
    expect(synth.playMissionComplete()).toBe(true)
  })
})
