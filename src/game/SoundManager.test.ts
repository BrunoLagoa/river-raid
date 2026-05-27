import { describe, it, expect, beforeEach } from 'vitest'
import { SoundManager } from './SoundManager'
import { mockAudioContext } from './test-helpers/audio'

describe('SoundManager', () => {
  let sm: SoundManager

  beforeEach(() => {
    sm = new SoundManager()
  })

  describe('mute', () => {
    it('toggleMute alterna estado', () => {
      expect(sm.isMuted()).toBe(false)
      sm.toggleMute()
      expect(sm.isMuted()).toBe(true)
      sm.toggleMute()
      expect(sm.isMuted()).toBe(false)
    })

    it('isMuted retorna estado atual', () => {
      expect(sm.isMuted()).toBe(false)
      ;(sm as unknown as { muted: boolean }).muted = true
      expect(sm.isMuted()).toBe(true)
    })
  })

  describe('volume', () => {
    it('setVolume limita entre 0 e 1', () => {
      sm.setVolume(1.5)
      expect((sm as unknown as { volume: number }).volume).toBe(1)
      sm.setVolume(-0.5)
      expect((sm as unknown as { volume: number }).volume).toBe(0)
      sm.setVolume(0.5)
      expect((sm as unknown as { volume: number }).volume).toBe(0.5)
    })
  })

  describe('resume', () => {
    it('resume nao falha se ctx null', () => {
      expect(() => sm.resume()).not.toThrow()
    })
  })

  describe('engine', () => {
    it('startEngine nao falha', () => {
      expect(() => sm.startEngine()).not.toThrow()
    })

    it('stopEngine nao falha', () => {
      expect(() => sm.stopEngine()).not.toThrow()
    })

    it('updateEngine nao falha', () => {
      expect(() => sm.updateEngine()).not.toThrow()
    })
  })

  describe('power-up sounds', () => {
    beforeEach(() => {
      mockAudioContext()
      sm = new SoundManager()
      sm.init()
    })

    it('powerUpBomb nao falha sem ctx', () => {
      expect(() => sm.powerUpBomb()).not.toThrow()
    })

    it('bombShockwave nao falha sem ctx', () => {
      expect(() => sm.bombShockwave()).not.toThrow()
    })

    it('powerUpRapidFire nao falha sem ctx', () => {
      expect(() => sm.powerUpRapidFire()).not.toThrow()
    })

    it('powerUpMagnet nao falha sem ctx', () => {
      expect(() => sm.powerUpMagnet()).not.toThrow()
    })
  })

  describe('destroy', () => {
    it('destroy nao falha sem init', () => {
      expect(() => sm.destroy()).not.toThrow()
    })
  })
})