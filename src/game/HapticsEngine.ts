// ---------------------------------------------------------------------------
// Haptics Engine — Tactical vibration feedback for Mobile & Gamepad
// Provides procedural haptic responses for shooting, impacts, explosions,
// and tactical alerts using Vibration API and GamepadHapticActuator.
// ---------------------------------------------------------------------------

export type HapticEffect = 'shoot' | 'enemyKill' | 'bridgeDestroy' | 'playerDamage' | 'overdriveActive' | 'bossAlert'

export interface HapticPattern {
  /** Duration(s) in ms for navigator.vibrate */
  mobilePattern: number | number[]
  /** Gamepad weak motor intensity (0 to 1) */
  gamepadWeak: number
  /** Gamepad strong motor intensity (0 to 1) */
  gamepadStrong: number
  /** Gamepad rumble duration in ms */
  gamepadDuration: number
}

export const HAPTIC_PATTERNS: Record<HapticEffect, HapticPattern> = {
  shoot: {
    mobilePattern: 15,
    gamepadWeak: 0.25,
    gamepadStrong: 0.05,
    gamepadDuration: 25,
  },
  enemyKill: {
    mobilePattern: 60,
    gamepadWeak: 0.6,
    gamepadStrong: 0.35,
    gamepadDuration: 75,
  },
  bridgeDestroy: {
    mobilePattern: [100, 40, 160],
    gamepadWeak: 0.9,
    gamepadStrong: 0.8,
    gamepadDuration: 250,
  },
  playerDamage: {
    mobilePattern: [180, 50, 250],
    gamepadWeak: 1.0,
    gamepadStrong: 1.0,
    gamepadDuration: 350,
  },
  overdriveActive: {
    mobilePattern: 80,
    gamepadWeak: 0.7,
    gamepadStrong: 0.4,
    gamepadDuration: 90,
  },
  bossAlert: {
    mobilePattern: [80, 60, 80],
    gamepadWeak: 0.8,
    gamepadStrong: 0.6,
    gamepadDuration: 180,
  },
}

export class HapticsEngine {
  private enabled = true
  private reducedMotion = false

  setEnabled(enabled: boolean): void {
    this.enabled = enabled
  }

  isEnabled(): boolean {
    return this.enabled
  }

  setReducedMotion(reduced: boolean): void {
    this.reducedMotion = reduced
  }

  trigger(effect: HapticEffect): boolean {
    if (!this.enabled || this.reducedMotion) return false

    const pattern = HAPTIC_PATTERNS[effect]
    if (!pattern) return false

    // 1. Mobile Vibration API
    this.triggerMobile(pattern.mobilePattern)

    // 2. Gamepad Dual-Rumble API
    this.triggerGamepad(pattern)

    return true
  }

  triggerShoot(): boolean {
    return this.trigger('shoot')
  }

  triggerEnemyKill(): boolean {
    return this.trigger('enemyKill')
  }

  triggerBridgeDestroy(): boolean {
    return this.trigger('bridgeDestroy')
  }

  triggerPlayerDamage(): boolean {
    return this.trigger('playerDamage')
  }

  triggerOverdriveActive(): boolean {
    return this.trigger('overdriveActive')
  }

  triggerBossAlert(): boolean {
    return this.trigger('bossAlert')
  }

  private triggerMobile(pattern: number | number[]): void {
    try {
      if (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') {
        navigator.vibrate(pattern)
      }
    } catch {
      // Falha silenciosa em navegadores sem permissão ou sem suporte
    }
  }

  private triggerGamepad(pattern: HapticPattern): void {
    try {
      if (typeof navigator === 'undefined' || typeof navigator.getGamepads !== 'function') return

      const gamepads = navigator.getGamepads()
      if (!gamepads) return

      for (let i = 0; i < gamepads.length; i++) {
        const gp = gamepads[i]
        if (!gp || !gp.connected) continue

        // Modern Gamepad API vibration actuator
        type GamepadWithActuator = Gamepad & {
          vibrationActuator?: {
            playEffect: (type: string, params: {
              startDelay: number
              duration: number
              weakMagnitude: number
              strongMagnitude: number
            }) => Promise<string>
          }
        }
        const actuator = (gp as GamepadWithActuator).vibrationActuator
        if (actuator && typeof actuator.playEffect === 'function') {
          actuator.playEffect('dual-rumble', {
            startDelay: 0,
            duration: pattern.gamepadDuration,
            weakMagnitude: pattern.gamepadWeak,
            strongMagnitude: pattern.gamepadStrong,
          }).catch(() => {
            // Ignora falha de reprodução de efeito de vibração
          })
        }
      }
    } catch {
      // Ignora erro em ambientes sem suporte
    }
  }
}
