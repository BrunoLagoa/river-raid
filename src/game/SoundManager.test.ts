import { describe, it, expect, beforeEach, afterEach } from 'vitest'
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

  describe('channels and volumes', () => {
    it('setMasterVolume limita entre 0 e 1', () => {
      sm.setMasterVolume(1.5)
      expect(sm.getMasterVolume()).toBe(1)
      sm.setMasterVolume(-0.5)
      expect(sm.getMasterVolume()).toBe(0)
      sm.setMasterVolume(0.5)
      expect(sm.getMasterVolume()).toBe(0.5)
    })

    it('setMusicVolume, setSfxVolume, setVoiceVolume e setVoiceEnabled funcionam', () => {
      sm.setMusicVolume(0.4)
      expect(sm.getMusicVolume()).toBe(0.4)

      sm.setSfxVolume(0.6)
      expect(sm.getSfxVolume()).toBe(0.6)

      sm.setVoiceVolume(0.75)
      expect(sm.getVoiceVolume()).toBe(0.75)

      sm.setVoiceEnabled(false)
      expect(sm.isVoiceEnabled()).toBe(false)
      sm.setVoiceEnabled(true)
      expect(sm.isVoiceEnabled()).toBe(true)
    })

    it('setDynamicIntensity e setBiomeAcoustics nao falham', () => {
      expect(() => sm.setDynamicIntensity({ comboMax: true, lowFuel: true, inBossFight: true })).not.toThrow()
      expect(() => sm.setBiomeAcoustics('snow')).not.toThrow()
      expect(() => sm.setBiomeAcoustics('desert')).not.toThrow()
    })

    it('setLanguage repassa para o sintetizador de voz', () => {
      sm.setLanguage('pt-BR')
      expect(sm.speech.getLanguage()).toBe('pt-BR')
      sm.setLanguage('en')
      expect(sm.speech.getLanguage()).toBe('en')
    })
  })

  describe('resume', () => {
    it('resume nao falha se ctx null', () => {
      expect(() => sm.resume()).not.toThrow()
    })

    it('resume recria contexto quando closed', () => {
      mockAudioContext()
      sm.init()
      const ctx = (sm as unknown as { ctx: { state: string } }).ctx
      ctx.state = 'closed'

      sm.resume()
      expect((sm as unknown as { ctx: { state: string } }).ctx).not.toBeNull()
    })
  })

  describe('biome music', () => {
    beforeEach(() => {
      mockAudioContext()
      sm = new SoundManager()
    })

    afterEach(() => {
      sm.stopMusic()
    })

    it('startMusic aceita bioma e nao falha', () => {
      expect(() => sm.startMusic('desert')).not.toThrow()
    })

    it('setBiomeMusic troca de bioma sem falhar', () => {
      sm.startMusic('forest')
      expect(() => sm.setBiomeMusic('industrial')).not.toThrow()
    })

    it('setBiomeMusic aceita o bioma de neve', () => {
      sm.startMusic('forest')
      expect(() => sm.setBiomeMusic('snow')).not.toThrow()
    })

    it('setBiomeMusic e no-op quando o bioma nao muda', () => {
      sm.startMusic('forest')
      expect(() => sm.setBiomeMusic('forest')).not.toThrow()
    })

    it('setMusicPhase aceita fases validas e ignora invalidas', () => {
      expect(() => {
        sm.setMusicPhase(2)   // noite
        sm.setMusicPhase(0)   // dia
        sm.setMusicPhase(-1)  // invalida: ignorada
        sm.setMusicPhase(99)  // invalida: ignorada
      }).not.toThrow()
      expect((sm as unknown as { musicPhase: number }).musicPhase).toBe(0)
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