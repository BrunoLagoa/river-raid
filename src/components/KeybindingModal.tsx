import React, { useState, useEffect } from 'react'
import type { KeyAction, Keybindings } from '../game/KeybindingService'
import { DEFAULT_KEYBINDINGS, formatKeyDisplay } from '../game/KeybindingService'
import type { Strings } from '../i18n'

interface KeybindingModalProps {
  isOpen: boolean
  onClose: () => void
  currentBindings: Keybindings
  onSave: (bindings: Keybindings) => void
  locale: Strings
}

const ACTION_KEYS: KeyAction[] = [
  'left',
  'right',
  'accelerate',
  'brake',
  'shoot',
  'overdrive',
  'pause',
]

const KeybindingModalContent: React.FC<Omit<KeybindingModalProps, 'isOpen'>> = ({
  onClose,
  currentBindings,
  onSave,
  locale,
}) => {
  const [bindings, setBindings] = useState<Keybindings>(currentBindings ?? DEFAULT_KEYBINDINGS)
  const [listeningSlot, setListeningSlot] = useState<{ action: KeyAction; slotIndex: number } | null>(null)

  useEffect(() => {
    if (!listeningSlot) return

    const handleKeyDown = (e: KeyboardEvent): void => {
      // Don't intercept developer tools or tab navigation
      if (['F5', 'F11', 'F12', 'Tab'].includes(e.code)) return

      e.preventDefault()
      e.stopPropagation()

      const { action, slotIndex } = listeningSlot
      const currentKeys = [...(bindings[action] ?? DEFAULT_KEYBINDINGS[action])]
      currentKeys[slotIndex] = e.code

      const nextBindings: Keybindings = {
        ...bindings,
        [action]: currentKeys.filter(k => typeof k === 'string' && k.length > 0),
      }

      setBindings(nextBindings)
      setListeningSlot(null)
    }

    window.addEventListener('keydown', handleKeyDown, { capture: true })
    return () => {
      window.removeEventListener('keydown', handleKeyDown, { capture: true })
    }
  }, [listeningSlot, bindings])

  const getActionLabel = (action: KeyAction): string => {
    switch (action) {
      case 'left': return locale.keybindActionLeft
      case 'right': return locale.keybindActionRight
      case 'accelerate': return locale.keybindActionAccelerate
      case 'brake': return locale.keybindActionBrake
      case 'shoot': return locale.keybindActionShoot
      case 'overdrive': return locale.keybindActionOverdrive
      case 'pause': return locale.keybindActionPause
      default: return action
    }
  }

  const handleResetDefaults = (): void => {
    setBindings(JSON.parse(JSON.stringify(DEFAULT_KEYBINDINGS)) as Keybindings)
    setListeningSlot(null)
  }

  const handleDone = (): void => {
    onSave(bindings)
    onClose()
  }

  return (
    <div
      data-testid="keybinding-modal-backdrop"
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(5, 10, 20, 0.88)',
        backdropFilter: 'blur(6px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        padding: '20px',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '520px',
          backgroundColor: '#0c1424',
          border: '2px solid #00e5ff',
          borderRadius: '12px',
          boxShadow: '0 0 30px rgba(0, 229, 255, 0.25)',
          color: '#e2f1ff',
          fontFamily: "'Courier New', Courier, monospace",
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          maxHeight: '90vh',
        }}
      >
        {/* Header */}
        <div style={{ padding: '16px 20px', borderBottom: '1px solid rgba(0, 229, 255, 0.2)', textAlign: 'center' }}>
          <h2 style={{ margin: 0, fontSize: '20px', letterSpacing: '2px', color: '#00e5ff', textShadow: '0 0 10px rgba(0,229,255,0.5)' }}>
            {locale.keybindModalTitle}
          </h2>
          <div style={{ fontSize: '11px', color: '#7ba0c0', letterSpacing: '1px', marginTop: '4px' }}>
            {locale.keybindModalSubtitle}
          </div>
        </div>

        {/* Listening banner */}
        {listeningSlot && (
          <div
            style={{
              backgroundColor: '#ffaa00',
              color: '#000',
              padding: '8px',
              textAlign: 'center',
              fontWeight: 'bold',
              fontSize: '13px',
              letterSpacing: '1px',
              animation: 'pulse 1s infinite alternate',
            }}
          >
            {locale.keybindListeningPrompt}
          </div>
        )}

        {/* List of actions */}
        <div style={{ padding: '16px 20px', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {ACTION_KEYS.map(action => {
            const safeBindings = bindings ?? DEFAULT_KEYBINDINGS
            const keys = safeBindings[action] ?? DEFAULT_KEYBINDINGS[action] ?? []
            const key1 = keys[0] ?? ''
            const key2 = keys[1] ?? ''

            const isListening1 = listeningSlot?.action === action && listeningSlot.slotIndex === 0
            const isListening2 = listeningSlot?.action === action && listeningSlot.slotIndex === 1

            return (
              <div
                key={action}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '8px 12px',
                  backgroundColor: 'rgba(255, 255, 255, 0.03)',
                  border: '1px solid rgba(0, 229, 255, 0.1)',
                  borderRadius: '6px',
                }}
              >
                <div style={{ fontSize: '13px', fontWeight: 'bold', color: '#b9dcff', flex: 1 }}>
                  {getActionLabel(action)}
                </div>

                <div style={{ display: 'flex', gap: '8px' }}>
                  {/* Primary Key Slot */}
                  <button
                    type="button"
                    onClick={() => setListeningSlot({ action, slotIndex: 0 })}
                    style={{
                      minWidth: '85px',
                      padding: '6px 10px',
                      fontSize: '12px',
                      fontFamily: 'inherit',
                      fontWeight: 'bold',
                      backgroundColor: isListening1 ? '#ffaa00' : 'rgba(0, 229, 255, 0.15)',
                      color: isListening1 ? '#000' : '#00e5ff',
                      border: isListening1 ? '1px solid #ffaa00' : '1px solid rgba(0, 229, 255, 0.4)',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    {isListening1 ? '...' : formatKeyDisplay(key1)}
                  </button>

                  {/* Secondary Key Slot */}
                  <button
                    type="button"
                    onClick={() => setListeningSlot({ action, slotIndex: 1 })}
                    style={{
                      minWidth: '85px',
                      padding: '6px 10px',
                      fontSize: '12px',
                      fontFamily: 'inherit',
                      fontWeight: 'bold',
                      backgroundColor: isListening2 ? '#ffaa00' : 'rgba(255, 255, 255, 0.05)',
                      color: isListening2 ? '#000' : '#7ba0c0',
                      border: isListening2 ? '1px solid #ffaa00' : '1px solid rgba(255, 255, 255, 0.15)',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    {isListening2 ? '...' : formatKeyDisplay(key2)}
                  </button>
                </div>
              </div>
            )
          })}
        </div>

        {/* Footer actions */}
        <div
          style={{
            padding: '14px 20px',
            borderTop: '1px solid rgba(0, 229, 255, 0.2)',
            display: 'flex',
            justifyContent: 'space-between',
            gap: '12px',
          }}
        >
          <button
            type="button"
            onClick={handleResetDefaults}
            style={{
              padding: '10px 16px',
              fontSize: '12px',
              fontFamily: 'inherit',
              fontWeight: 'bold',
              letterSpacing: '1px',
              backgroundColor: 'rgba(255, 70, 70, 0.15)',
              color: '#ff6666',
              border: '1px solid rgba(255, 70, 70, 0.4)',
              borderRadius: '6px',
              cursor: 'pointer',
            }}
          >
            {locale.keybindBtnReset}
          </button>

          <button
            type="button"
            onClick={handleDone}
            style={{
              padding: '10px 24px',
              fontSize: '13px',
              fontFamily: 'inherit',
              fontWeight: 'bold',
              letterSpacing: '1px',
              backgroundColor: '#00e5ff',
              color: '#05101a',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              boxShadow: '0 0 15px rgba(0, 229, 255, 0.4)',
            }}
          >
            {locale.keybindBtnDone}
          </button>
        </div>
      </div>
    </div>
  )
}

export const KeybindingModal: React.FC<KeybindingModalProps> = (props) => {
  if (!props.isOpen) return null
  return <KeybindingModalContent {...props} />
}
