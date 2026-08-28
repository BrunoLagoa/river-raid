import { describe, it, expect, beforeEach, vi } from 'vitest'
import { GhostReplaySystem, GHOST_STORAGE_KEY_PREFIX } from './GhostReplaySystem'

describe('GhostReplaySystem', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.restoreAllMocks()
  })

  it('inicia sem fantasma gravado', () => {
    const sys = new GhostReplaySystem('classic')
    expect(sys.getActiveGhost()).toBeNull()
    expect(sys.getGhostStateAtTime(1.0)).toBeNull()
  })

  it('grava amostras espaçadas e salva quando bate recorde', () => {
    const sys = new GhostReplaySystem('classic')

    // Grava 6 amostras
    sys.recordSample(0.0, 400, 500, 0, false)
    sys.recordSample(0.05, 410, 490, 0, false) // Ignorado pois < 0.1s
    sys.recordSample(0.1, 410, 490, 1, false)
    sys.recordSample(0.2, 420, 480, 1, true)
    sys.recordSample(0.3, 430, 470, 0, true)
    sys.recordSample(0.4, 440, 460, -1, false)
    sys.recordSample(0.5, 450, 450, 0, false)

    const saved = sys.saveIfBest('classic', 12000, 0.5)
    expect(saved).toBe(true)

    // Nova instância carrega o fantasma gravado
    const sys2 = new GhostReplaySystem('classic')
    expect(sys2.getActiveGhost()?.score).toBe(12000)
    expect(sys2.getActiveGhost()?.samples.length).toBe(6)
  })

  it('interpola posicoes suavemente no playback', () => {
    const sys = new GhostReplaySystem('classic')
    sys.recordSample(0.0, 400, 500, 0, false)
    sys.recordSample(0.1, 410, 490, 0, false)
    sys.recordSample(0.2, 420, 480, 0, false)
    sys.recordSample(0.3, 430, 470, 0, false)
    sys.recordSample(0.4, 440, 460, 0, false)
    sys.recordSample(0.5, 450, 450, 0, false)
    sys.saveIfBest('classic', 15000, 0.5)

    // Ponto intermediário t = 0.25 (entre t=0.2 em (420,480) e t=0.3 em (430,470))
    const state = sys.getGhostStateAtTime(0.25)
    expect(state).not.toBeNull()
    expect(state?.x).toBeCloseTo(425, 1)
    expect(state?.y).toBeCloseTo(475, 1)

    // Apos fim do replay
    expect(sys.getGhostStateAtTime(0.6)).toBeNull()
  })

  it('nao substitui fantasma se pontuacao da run for menor', () => {
    const sys = new GhostReplaySystem('classic')
    sys.recordSample(0.0, 400, 500)
    sys.recordSample(0.1, 400, 490)
    sys.recordSample(0.2, 400, 480)
    sys.recordSample(0.3, 400, 470)
    sys.recordSample(0.4, 400, 460)
    sys.recordSample(0.5, 400, 450)
    sys.saveIfBest('classic', 20000, 0.5)

    // Nova run com score menor
    const sys2 = new GhostReplaySystem('classic')
    sys2.recordSample(0.0, 300, 500)
    sys2.recordSample(0.1, 300, 490)
    sys2.recordSample(0.2, 300, 480)
    sys2.recordSample(0.3, 300, 470)
    sys2.recordSample(0.4, 300, 460)
    sys2.recordSample(0.5, 300, 450)
    const saved = sys2.saveIfBest('classic', 15000, 0.5)

    expect(saved).toBe(false)
    expect(sys2.getActiveGhost()?.score).toBe(20000)
  })

  it('permite limpar fantasma gravado', () => {
    const sys = new GhostReplaySystem('hardcore')
    sys.recordSample(0.0, 400, 500)
    sys.recordSample(0.1, 400, 490)
    sys.recordSample(0.2, 400, 480)
    sys.recordSample(0.3, 400, 470)
    sys.recordSample(0.4, 400, 460)
    sys.recordSample(0.5, 400, 450)
    sys.saveIfBest('hardcore', 10000, 0.5)

    expect(sys.getActiveGhost()).not.toBeNull()
    sys.clearGhost('hardcore')
    expect(sys.getActiveGhost()).toBeNull()
    expect(localStorage.getItem(`${GHOST_STORAGE_KEY_PREFIX}hardcore`)).toBeNull()
  })
})
