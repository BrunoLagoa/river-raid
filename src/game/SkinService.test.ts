import { describe, it, expect, beforeEach, vi } from 'vitest'
import { SkinService, EQUIPPED_SKIN_STORAGE_KEY } from './SkinService'

describe('SkinService', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.restoreAllMocks()
  })

  it('retorna classic como skin inicial padrao', () => {
    const service = new SkinService()
    expect(service.getEquippedSkinId()).toBe('classic')
    expect(service.getEquippedSkinDef().id).toBe('classic')
    expect(service.getAllSkins().length).toBe(4)
  })

  it('verifica requisitos de desbloqueio corretamente', () => {
    const service = new SkinService()

    // Classic sempre desbloqueado
    expect(service.isSkinUnlocked('classic', [], 0)).toBe(true)

    // Stealth requer sharpshooter
    expect(service.isSkinUnlocked('stealth', [], 0)).toBe(false)
    expect(service.isSkinUnlocked('stealth', ['sharpshooter'], 0)).toBe(true)

    // Biplane requer first_bridge
    expect(service.isSkinUnlocked('biplane', [], 0)).toBe(false)
    expect(service.isSkinUnlocked('biplane', ['first_bridge'], 0)).toBe(true)

    // Cyber neon requer score >= 25000
    expect(service.isSkinUnlocked('cyber_neon', [], 20000)).toBe(false)
    expect(service.isSkinUnlocked('cyber_neon', [], 25000)).toBe(true)
  })

  it('nao permite equipar skin bloqueada', () => {
    const service = new SkinService()
    const success = service.setEquippedSkin('cyber_neon', [], 1000)
    expect(success).toBe(false)
    expect(service.getEquippedSkinId()).toBe('classic')
  })

  it('equipa e persiste skin desbloqueada com sucesso', () => {
    const service = new SkinService()
    const success = service.setEquippedSkin('stealth', ['sharpshooter'], 1000)
    expect(success).toBe(true)
    expect(service.getEquippedSkinId()).toBe('stealth')

    // Novo service carrega a skin persistida
    const service2 = new SkinService()
    expect(service2.getEquippedSkinId()).toBe('stealth')
  })

  it('fallback para classic se valor no storage for desconhecido', () => {
    localStorage.setItem(EQUIPPED_SKIN_STORAGE_KEY, JSON.stringify({ v: 1, d: 'invalid', c: 'bad' }))
    const service = new SkinService()
    expect(service.getEquippedSkinId()).toBe('classic')
  })
})
