import { readSecureJSON, writeSecureJSON } from './StorageService'
import type { GameModeId } from './GameMode'

export interface GhostSample {
  t: number // tempo em segundos
  x: number // coordenada X
  y: number // coordenada Y
  b: number // inclinação lateral (-1, 0, 1)
  s: number // tiro ativo (1 = sim, 0 = não)
}

export interface GhostData {
  mode: GameModeId
  score: number
  duration: number
  samples: GhostSample[]
}

export interface GhostPlaybackState {
  x: number
  y: number
  bank: number
  shooting: boolean
}

export const GHOST_STORAGE_KEY_PREFIX = 'river_raid_ghost_'
export const GHOST_SAMPLE_INTERVAL = 0.1 // 100ms (10 Hz)

export class GhostReplaySystem {
  private currentSamples: GhostSample[] = []
  private lastSampleTime = -1
  private currentMode: GameModeId = 'classic'
  private activeGhost: GhostData | null = null

  constructor(mode: GameModeId = 'classic') {
    this.currentMode = mode
    this.activeGhost = this.loadBestGhost(mode)
  }

  setMode(mode: GameModeId): void {
    this.currentMode = mode
    this.activeGhost = this.loadBestGhost(mode)
    this.resetRecording()
  }

  getActiveGhost(): GhostData | null {
    return this.activeGhost
  }

  resetRecording(): void {
    this.currentSamples = []
    this.lastSampleTime = -1
  }

  recordSample(
    currentTime: number,
    x: number,
    y: number,
    bank = 0,
    shooting = false
  ): void {
    if (this.lastSampleTime >= 0 && currentTime - this.lastSampleTime < GHOST_SAMPLE_INTERVAL - 0.005) {
      return
    }

    const t = Math.round(currentTime * 100) / 100
    const sample: GhostSample = {
      t,
      x: Math.round(x * 10) / 10,
      y: Math.round(y * 10) / 10,
      b: bank,
      s: shooting ? 1 : 0,
    }

    this.currentSamples.push(sample)
    this.lastSampleTime = currentTime
  }

  saveIfBest(mode: GameModeId, finalScore: number, duration: number): boolean {
    if (finalScore <= 0 || this.currentSamples.length < 5) {
      return false
    }

    const currentBest = this.loadBestGhost(mode)
    if (!currentBest || finalScore > currentBest.score) {
      const ghostData: GhostData = {
        mode,
        score: finalScore,
        duration: Math.round(duration * 100) / 100,
        samples: this.currentSamples,
      }

      this.saveGhost(mode, ghostData)
      this.activeGhost = ghostData
      return true
    }

    return false
  }

  loadBestGhost(mode: GameModeId): GhostData | null {
    const key = `${GHOST_STORAGE_KEY_PREFIX}${mode}`
    const data = readSecureJSON<GhostData | null>(key, null)
    if (data && Array.isArray(data.samples) && data.samples.length > 0) {
      return data
    }
    return null
  }

  clearGhost(mode: GameModeId): void {
    const key = `${GHOST_STORAGE_KEY_PREFIX}${mode}`
    try {
      localStorage.removeItem(key)
    } catch {
      // ignore
    }
    if (this.currentMode === mode) {
      this.activeGhost = null
    }
  }

  getGhostStateAtTime(time: number): GhostPlaybackState | null {
    if (!this.activeGhost || this.activeGhost.samples.length === 0) {
      return null
    }

    const samples = this.activeGhost.samples
    if (time < samples[0].t) {
      return {
        x: samples[0].x,
        y: samples[0].y,
        bank: samples[0].b,
        shooting: samples[0].s === 1,
      }
    }

    const lastIdx = samples.length - 1
    if (time >= samples[lastIdx].t) {
      // Ghost terminou a trajetória da run
      return null
    }

    // Busca binária para localizar o intervalo [s1, s2]
    let low = 0
    let high = lastIdx

    while (low <= high) {
      const mid = Math.floor((low + high) / 2)
      if (samples[mid].t <= time && (mid === lastIdx || samples[mid + 1].t > time)) {
        const s1 = samples[mid]
        const s2 = samples[mid + 1]

        if (!s2) {
          return { x: s1.x, y: s1.y, bank: s1.b, shooting: s1.s === 1 }
        }

        const dt = s2.t - s1.t
        const alpha = dt > 0 ? Math.max(0, Math.min(1, (time - s1.t) / dt)) : 0

        return {
          x: s1.x + alpha * (s2.x - s1.x),
          y: s1.y + alpha * (s2.y - s1.y),
          bank: alpha < 0.5 ? s1.b : s2.b,
          shooting: s1.s === 1 || s2.s === 1,
        }
      }

      if (samples[mid].t < time) {
        low = mid + 1
      } else {
        high = mid - 1
      }
    }

    return null
  }

  private saveGhost(mode: GameModeId, data: GhostData): void {
    const key = `${GHOST_STORAGE_KEY_PREFIX}${mode}`
    writeSecureJSON(key, data)
  }
}
