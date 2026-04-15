import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import * as StorageService from './StorageService'
import { getDefaultSettings } from './SettingsService'

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
    })
  })
})