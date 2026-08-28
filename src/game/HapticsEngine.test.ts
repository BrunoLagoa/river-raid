import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { HapticsEngine, HAPTIC_PATTERNS } from './HapticsEngine'

describe('HapticsEngine', () => {
  let haptics: HapticsEngine
  let vibrateMock: ReturnType<typeof vi.fn>
  let playEffectMock: ReturnType<typeof vi.fn>

  beforeEach(() => {
    haptics = new HapticsEngine()
    vibrateMock = vi.fn()
    playEffectMock = vi.fn().mockResolvedValue('complete')

    // Mock navigator.vibrate
    vi.stubGlobal('navigator', {
      vibrate: vibrateMock,
      getGamepads: vi.fn(() => [
        {
          connected: true,
          vibrationActuator: {
            playEffect: playEffectMock,
          },
        },
      ]),
    })
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('aciona vibracao mobile e dual-rumble no gamepad ao atirar', () => {
    expect(haptics.triggerShoot()).toBe(true)
    expect(vibrateMock).toHaveBeenCalledWith(HAPTIC_PATTERNS.shoot.mobilePattern)
    expect(playEffectMock).toHaveBeenCalledWith('dual-rumble', expect.objectContaining({
      duration: HAPTIC_PATTERNS.shoot.gamepadDuration,
      weakMagnitude: HAPTIC_PATTERNS.shoot.gamepadWeak,
    }))
  })

  it('aciona outros efeitos táteis com sucesso', () => {
    expect(haptics.triggerEnemyKill()).toBe(true)
    expect(haptics.triggerBridgeDestroy()).toBe(true)
    expect(haptics.triggerPlayerDamage()).toBe(true)
    expect(haptics.triggerOverdriveActive()).toBe(true)
    expect(haptics.triggerBossAlert()).toBe(true)
  })

  it('respeita toggle de enabled', () => {
    haptics.setEnabled(false)
    expect(haptics.isEnabled()).toBe(false)
    expect(haptics.triggerShoot()).toBe(false)
    expect(vibrateMock).not.toHaveBeenCalled()
  })

  it('respeita flag de reducedMotion', () => {
    haptics.setReducedMotion(true)
    expect(haptics.triggerShoot()).toBe(false)
    expect(vibrateMock).not.toHaveBeenCalled()
  })

  it('trata graciosamente erro ou ausencia de APIs', () => {
    vi.stubGlobal('navigator', {})
    expect(() => haptics.triggerShoot()).not.toThrow()
  })
})
