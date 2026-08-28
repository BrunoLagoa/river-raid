import { describe, it, expect, beforeEach } from 'vitest'
import { KeybindingService, DEFAULT_KEYBINDINGS } from './KeybindingService'

describe('KeybindingService', () => {
  let service: KeybindingService

  beforeEach(() => {
    service = new KeybindingService()
  })

  it('inicializa com os atalhos padrao', () => {
    expect(service.getBindings()).toEqual(DEFAULT_KEYBINDINGS)
    expect(service.getKeysForAction('shoot')).toEqual(['Space'])
  })

  it('permite customizar atalhos no construtor', () => {
    const custom = new KeybindingService({ shoot: ['KeyJ'], left: ['KeyA'] })
    expect(custom.getKeysForAction('shoot')).toEqual(['KeyJ'])
    expect(custom.getKeysForAction('left')).toEqual(['KeyA'])
    // As outras mantêm os padrões
    expect(custom.getKeysForAction('right')).toEqual(DEFAULT_KEYBINDINGS.right)
  })

  it('setKeysForAction atualiza teclas para uma acao valida', () => {
    service.setKeysForAction('shoot', ['KeyZ', 'Space'])
    expect(service.getKeysForAction('shoot')).toEqual(['KeyZ', 'Space'])
  })

  it('bindKey altera um slot especifico', () => {
    service.bindKey('left', 'Numpad4', 0)
    expect(service.getKeysForAction('left')[0]).toBe('Numpad4')
  })

  it('isActionPressed detecta quando uma das teclas mapeadas esta ativa', () => {
    const activeKeys = new Set<string>(['KeyA', 'Space'])
    expect(service.isActionPressed('left', activeKeys)).toBe(true)
    expect(service.isActionPressed('shoot', activeKeys)).toBe(true)
    expect(service.isActionPressed('brake', activeKeys)).toBe(false)
  })

  it('getActionForKey retorna a acao correspondente ou null', () => {
    expect(service.getActionForKey('ArrowLeft')).toBe('left')
    expect(service.getActionForKey('Space')).toBe('shoot')
    expect(service.getActionForKey('KeyF12')).toBeNull()
  })

  it('resetDefaults restaura as configuracoes originais', () => {
    service.setKeysForAction('shoot', ['KeyK'])
    expect(service.getKeysForAction('shoot')).toEqual(['KeyK'])

    service.resetDefaults()
    expect(service.getKeysForAction('shoot')).toEqual(['Space'])
  })
})
