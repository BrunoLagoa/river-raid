import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { getStoredAchievements, unlockAchievement, resetAchievements } from './AchievementService'

describe('AchievementService', () => {
  beforeEach(() => {
    vi.spyOn(localStorage, 'getItem').mockReturnValue(null)
    vi.spyOn(localStorage, 'setItem').mockImplementation(() => {})
    vi.spyOn(localStorage, 'removeItem').mockImplementation(() => {})
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('getStoredAchievements', () => {
    it('retorna catalogo padrao se nada armazenado', () => {
      const achievements = getStoredAchievements()
      expect(achievements.length).toBe(8)
      expect(achievements[0].id).toBe('first_bridge')
      expect(achievements[0].unlocked).toBe(false)
    })
  })

  describe('unlockAchievement', () => {
    it('desbloqueia conquista', () => {
      const achievements = unlockAchievement('first_bridge')
      expect(achievements[0].unlocked).toBe(true)
      expect(achievements[0].unlockedAt).toBeDefined()
    })

    it('nao muda se ja desbloqueado', () => {
      const a1 = unlockAchievement('first_bridge')
      const original = a1[0].unlockedAt
      const a2 = unlockAchievement('first_bridge')
      expect(a2[0].unlockedAt).toBe(original)
    })

    it('nao afeta outras conquistas', () => {
      unlockAchievement('first_bridge')
      const achievements = getStoredAchievements()
      expect(achievements[1].unlocked).toBe(false)
    })
  })

  describe('resetAchievements', () => {
    it('reseta todas para nao desbloqueadas', () => {
      unlockAchievement('first_bridge')
      const achievements = resetAchievements()
      expect(achievements[0].unlocked).toBe(false)
    })
  })
})