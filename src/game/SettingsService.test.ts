import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import * as StorageService from './StorageService'
import { getDefaultSettings, getStoredSettings, saveStoredSettings } from './SettingsService'

describe('SettingsService', () => {
  beforeEach(() => {
    vi.spyOn(StorageService, 'readSecureJSON').mockReturnValue(null)
    vi.spyOn(StorageService, 'writeSecureJSON').mockImplementation(() => {})
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('getDefaultSettings', () => {
    it('retorna valores padrao', () => {
      const defaults = getDefaultSettings()
      expect(defaults.masterVolume).toBe(0.3)
      expect(defaults.muted).toBe(false)
      expect(defaults.reducedMotion).toBe(false)
      expect(defaults.gamepadEnabled).toBe(true)
      expect(defaults.objectiveBalanceProfile).toBe('conservative')
    })
  })

  describe('normalizacao', () => {
    it('normaliza perfil invalido para conservador na leitura', () => {
      vi.mocked(StorageService.readSecureJSON).mockReturnValue({
        objectiveBalanceProfile: 'invalid',
      })

      const settings = getStoredSettings()
      expect(settings.objectiveBalanceProfile).toBe('conservative')
    })

    it('normaliza perfil invalido para conservador no salvamento', () => {
      saveStoredSettings({
        masterVolume: 0.5,
        muted: false,
        reducedMotion: false,
        gamepadEnabled: true,
        objectiveBalanceProfile: 'invalid' as never,
      })

      expect(StorageService.writeSecureJSON).toHaveBeenCalledWith(
        'river-raid-settings',
        expect.objectContaining({ objectiveBalanceProfile: 'conservative' })
      )
    })
  })
})