export type KeyAction = 'left' | 'right' | 'accelerate' | 'brake' | 'shoot' | 'overdrive' | 'pause'

export type Keybindings = Record<KeyAction, string[]>

export const DEFAULT_KEYBINDINGS: Keybindings = {
  left: ['ArrowLeft', 'KeyA'],
  right: ['ArrowRight', 'KeyD'],
  accelerate: ['ArrowUp', 'KeyW'],
  brake: ['ArrowDown', 'KeyS'],
  shoot: ['Space'],
  // Shift foi removido de propósito: pressionar o modificador sozinho disparava
  // o Overdrive (mesmo problema que já existia e motivou o uso só de X).
  overdrive: ['KeyX'],
  pause: ['KeyP', 'Escape'],
}

export function formatKeyDisplay(code: string): string {
  if (!code) return '—'
  if (code.startsWith('Key')) return code.slice(3)
  if (code.startsWith('Digit')) return code.slice(5)
  if (code.startsWith('Numpad')) return `NUM ${code.slice(6)}`
  switch (code) {
    case 'ArrowLeft': return '← LEFT'
    case 'ArrowRight': return '→ RIGHT'
    case 'ArrowUp': return '↑ UP'
    case 'ArrowDown': return '↓ DOWN'
    case 'Space': return 'SPACE'
    case 'ShiftLeft': return 'L-SHIFT'
    case 'ShiftRight': return 'R-SHIFT'
    case 'ControlLeft': return 'L-CTRL'
    case 'ControlRight': return 'R-CTRL'
    case 'AltLeft': return 'L-ALT'
    case 'AltRight': return 'R-ALT'
    case 'Escape': return 'ESC'
    case 'Enter': return 'ENTER'
    default: return code
  }
}

export class KeybindingService {
  private bindings: Keybindings

  constructor(initialBindings?: Partial<Keybindings>) {
    this.bindings = this.sanitizeBindings(initialBindings)
  }

  getBindings(): Keybindings {
    return JSON.parse(JSON.stringify(this.bindings)) as Keybindings
  }

  setBindings(bindings?: Partial<Keybindings>): void {
    this.bindings = this.sanitizeBindings(bindings)
  }

  getKeysForAction(action: KeyAction): string[] {
    return [...(this.bindings[action] ?? DEFAULT_KEYBINDINGS[action] ?? [])]
  }

  setKeysForAction(action: KeyAction, keys: string[]): void {
    if (!DEFAULT_KEYBINDINGS[action]) return
    const validKeys = keys.filter(k => typeof k === 'string' && k.trim().length > 0)
    this.bindings[action] = validKeys.length > 0 ? validKeys : [...DEFAULT_KEYBINDINGS[action]]
  }

  bindKey(action: KeyAction, key: string, slotIndex = 0): void {
    if (!DEFAULT_KEYBINDINGS[action] || !key) return
    const current = [...this.getKeysForAction(action)]
    if (slotIndex >= 0) {
      current[slotIndex] = key
      this.setKeysForAction(action, current)
    }
  }

  isActionPressed(action: KeyAction, activeKeys: Set<string>): boolean {
    const keys = this.bindings[action]
    if (!keys) return false
    for (let i = 0; i < keys.length; i++) {
      const k = keys[i]
      if (activeKeys.has(k)) return true
      if (k === 'Space' && activeKeys.has(' ')) return true
      if (k === ' ' && activeKeys.has('Space')) return true
      if (k.startsWith('Key')) {
        const char = k.slice(3)
        if (activeKeys.has(char.toLowerCase()) || activeKeys.has(char.toUpperCase())) return true
      }
      if (k.length === 1) {
        const fullCode = `Key${k.toUpperCase()}`
        if (activeKeys.has(fullCode)) return true
      }
    }
    return false
  }

  getActionForKey(keyCode: string): KeyAction | null {
    const actions = Object.keys(this.bindings) as KeyAction[]
    for (let i = 0; i < actions.length; i++) {
      const action = actions[i]
      const keys = this.bindings[action]
      if (keys) {
        for (let j = 0; j < keys.length; j++) {
          const k = keys[j]
          if (k === keyCode) return action
          if ((k === 'Space' && keyCode === ' ') || (k === ' ' && keyCode === 'Space')) return action
          if (k.startsWith('Key') && keyCode.length === 1 && k.slice(3).toLowerCase() === keyCode.toLowerCase()) {
            return action
          }
          if (keyCode.startsWith('Key') && k.length === 1 && keyCode.slice(3).toLowerCase() === k.toLowerCase()) {
            return action
          }
        }
      }
    }
    return null
  }

  resetDefaults(): void {
    this.bindings = JSON.parse(JSON.stringify(DEFAULT_KEYBINDINGS)) as Keybindings
  }

  private sanitizeBindings(custom?: Partial<Keybindings>): Keybindings {
    const result: Keybindings = JSON.parse(JSON.stringify(DEFAULT_KEYBINDINGS)) as Keybindings
    if (!custom) return result

    const actions = Object.keys(DEFAULT_KEYBINDINGS) as KeyAction[]
    for (let i = 0; i < actions.length; i++) {
      const action = actions[i]
      const customList = custom[action]
      if (Array.isArray(customList) && customList.length > 0) {
        const validList = customList.filter(k => typeof k === 'string' && k.trim().length > 0)
        if (validList.length > 0) {
          result[action] = validList
        }
      }
    }
    return result
  }
}
