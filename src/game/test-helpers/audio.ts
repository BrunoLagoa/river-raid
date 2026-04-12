import { vi } from 'vitest'

class FakeAudioParam {
  value = 0
  setValueAtTime = vi.fn()
  exponentialRampToValueAtTime = vi.fn()
}

class FakeGainNode {
  gain = new FakeAudioParam()
  connect = vi.fn()
}

class FakeOscillatorNode {
  type: OscillatorType = 'sine'
  frequency = new FakeAudioParam()
  connect = vi.fn()
  start = vi.fn()
  stop = vi.fn()
}

class FakeBufferSourceNode {
  buffer: AudioBuffer | null = null
  connect = vi.fn()
  start = vi.fn()
  stop = vi.fn()
}

class FakeBiquadFilterNode {
  type: BiquadFilterType = 'lowpass'
  frequency = new FakeAudioParam()
  connect = vi.fn()
}

class FakeAudioBuffer {
  private size: number

  constructor(size: number) {
    this.size = size
  }

  getChannelData(): Float32Array {
    return new Float32Array(this.size)
  }
}

class FakeAudioContext {
  state: AudioContextState = 'running'
  currentTime = 0
  sampleRate = 44100
  destination = {} as AudioDestinationNode

  createGain = vi.fn(() => new FakeGainNode())
  createOscillator = vi.fn(() => new FakeOscillatorNode())
  createBuffer = vi.fn((_channels: number, size: number) => new FakeAudioBuffer(size) as unknown as AudioBuffer)
  createBufferSource = vi.fn(() => new FakeBufferSourceNode())
  createBiquadFilter = vi.fn(() => new FakeBiquadFilterNode())

  resume = vi.fn(async () => undefined)
  close = vi.fn(async () => undefined)
}

export function mockAudioContext(): void {
  vi.stubGlobal('AudioContext', FakeAudioContext)
}
