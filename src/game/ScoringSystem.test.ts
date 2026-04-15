import { describe, it, expect, beforeEach } from 'vitest'
import { ScoringSystem } from './ScoringSystem'
import { COMBO_LEVEL_2, COMBO_LEVEL_3, COMBO_LEVEL_4 } from './constants'

describe('ScoringSystem', () => {
  let ss: ScoringSystem

  beforeEach(() => {
    ss = new ScoringSystem()
  })

  describe('reset', () => {
    it('reseta score e combo', () => {
      ss.score = 1000
      ss.comboMultiplier = 3
      ss.consecutiveHits = 10

      ss.reset()

      expect(ss.score).toBe(0)
      expect(ss.comboMultiplier).toBe(1)
      expect(ss.consecutiveHits).toBe(0)
    })
  })

  describe('addScore', () => {
    it('adiciona pontos ao score', () => {
      ss.addScore(100)
      expect(ss.score).toBe(100)
    })

    it('acumula pontos', () => {
      ss.addScore(100)
      ss.addScore(50)
      expect(ss.score).toBe(150)
    })
  })

  describe('registerHit', () => {
    it('incrementa consecutiveHits', () => {
      ss.registerHit()
      expect(ss.consecutiveHits).toBe(1)
    })

    it('ativa combo level 2', () => {
      for (let i = 0; i < COMBO_LEVEL_2; i++) {
        ss.registerHit()
      }
      expect(ss.comboMultiplier).toBe(2)
    })

    it('ativa combo level 3', () => {
      for (let i = 0; i < COMBO_LEVEL_3; i++) {
        ss.registerHit()
      }
      expect(ss.comboMultiplier).toBe(3)
    })

    it('ativa combo level 4', () => {
      for (let i = 0; i < COMBO_LEVEL_4; i++) {
        ss.registerHit()
      }
      expect(ss.comboMultiplier).toBe(4)
    })

    it('reseta comboAnimTimer ao subir nivel', () => {
      for (let i = 0; i < COMBO_LEVEL_2; i++) {
        ss.registerHit()
      }
      expect(ss.comboAnimTimer).toBeGreaterThan(0)
    })
  })

  describe('registerMiss', () => {
    it('reseta combo para 1', () => {
      ss.comboMultiplier = 3
      ss.consecutiveHits = 10

      ss.registerMiss()

      expect(ss.comboMultiplier).toBe(1)
      expect(ss.consecutiveHits).toBe(0)
    })

    it('ativa anim down', () => {
      ss.registerMiss()
      expect(ss.comboAnimTimer).toBeGreaterThan(0)
    })
  })

  describe('decayCombo', () => {
    it('reduz multiplicador', () => {
      ss.comboMultiplier = 3
      ss.consecutiveHits = COMBO_LEVEL_4

      ss.decayCombo()

      expect(ss.comboMultiplier).toBe(2)
    })

    it('nao reduz abaixo de 1', () => {
      ss.comboMultiplier = 1

      ss.decayCombo()

      expect(ss.comboMultiplier).toBe(1)
    })

    it('ajusta consecutiveHits ao reduzir', () => {
      ss.comboMultiplier = 3
      ss.consecutiveHits = 20

      ss.decayCombo()

      expect(ss.consecutiveHits).toBe(COMBO_LEVEL_2)
    })
  })

  describe('update', () => {
    it('decrementa comboAnimTimer', () => {
      ss.comboAnimTimer = 1

      ss.update(0.5)

      expect(ss.comboAnimTimer).toBe(0.5)
    })

    it('decrementa comboLevelTimer e faz decay', () => {
      ss.comboMultiplier = 2
      ss.comboLevelTimer = 0.5

      ss.update(0.6)

      expect(ss.comboMultiplier).toBe(1)
    })

    it('nao falha com timers em zero', () => {
      ss.comboAnimTimer = 0
      ss.comboLevelTimer = 0

      expect(() => ss.update(0.1)).not.toThrow()
    })
  })
})