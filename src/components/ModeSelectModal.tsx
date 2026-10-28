import React, { useState } from 'react'
import { getAllGameModes, type GameModeId, type GameModeConfig } from '../game/GameMode'
import type { Strings } from '../i18n'
import Modal from './Modal'

interface ModeSelectModalProps {
  isOpen: boolean
  onClose: () => void
  onSelectMode: (modeId: GameModeId) => void
  locale: Strings
  currentMode?: GameModeId
}

const ModeSelectModalContent: React.FC<Omit<ModeSelectModalProps, 'isOpen'>> = ({
  onClose,
  onSelectMode,
  locale,
  currentMode = 'classic',
}) => {
  const [modes] = useState<GameModeConfig[]>(() => getAllGameModes())
  const [selectedId, setSelectedId] = useState<GameModeId>(currentMode)

  const getModeName = (m: GameModeConfig): string => {
    const key = m.nameKey as keyof Strings
    return (locale[key] as string) ?? m.id
  }

  const getModeDesc = (m: GameModeConfig): string => {
    const key = m.descKey as keyof Strings
    return (locale[key] as string) ?? ''
  }

  const getModeTags = (m: GameModeConfig): string[] => {
    switch (m.id) {
      case 'hardcore':
        return [locale.modeTag1Life, locale.modeTagFastFuel, locale.modeTagNoMinimap]
      case 'zen':
        return [locale.modeTagInfiniteLives, locale.modeTagNoFuelDrain]
      case 'boss_rush':
        return [locale.modeTagRapidBosses]
      case 'daily':
        return [locale.modeTagDeterministic]
      case 'classic':
      default:
        return [locale.modeTag3Lives, locale.modeTagRadar]
    }
  }

  const handleLaunch = (): void => {
    onSelectMode(selectedId)
    onClose()
  }

  return (
    <Modal
      isOpen
      onClose={onClose}
      title={locale.modeSelectTitle}
      subtitle={locale.modeSelectSubtitle}
      testId="mode-select-backdrop"
      maxWidth="580px"
      footer={
        <>
          <button
            type="button"
            data-testid="mode-modal-close-btn"
            onClick={onClose}
            style={{
              padding: '10px 20px',
              fontSize: '13px',
              fontFamily: 'inherit',
              fontWeight: 'bold',
              letterSpacing: '1px',
              backgroundColor: 'transparent',
              color: '#94a3b8',
              border: '1px solid rgba(148, 163, 184, 0.3)',
              borderRadius: '6px',
              cursor: 'pointer',
            }}
          >
            {locale.modeBtnBack}
          </button>

          <button
            type="button"
            data-testid="mode-modal-launch-btn"
            onClick={handleLaunch}
            style={{
              padding: '10px 24px',
              fontSize: '13px',
              fontFamily: 'inherit',
              fontWeight: 'bold',
              letterSpacing: '1.5px',
              backgroundColor: '#00e5ff',
              color: '#05101a',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              boxShadow: '0 0 20px rgba(0, 229, 255, 0.4)',
            }}
          >
            ▶ {locale.modeBtnPlay}
          </button>
        </>
      }
    >
      {modes.map((m) => {
        const isSelected = selectedId === m.id
        const tags = getModeTags(m)

        return (
          <button
            type="button"
            key={m.id}
            data-testid={`mode-card-${m.id}`}
            aria-pressed={isSelected}
            onClick={() => setSelectedId(m.id)}
            style={{
              textAlign: 'left',
              backgroundColor: isSelected ? 'rgba(0, 229, 255, 0.12)' : 'rgba(255, 255, 255, 0.02)',
              border: `1.5px solid ${isSelected ? '#00e5ff' : 'rgba(0, 229, 255, 0.15)'}`,
              borderRadius: '8px',
              padding: '12px 16px',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
              boxShadow: isSelected ? '0 0 15px rgba(0, 229, 255, 0.25)' : 'none',
              display: 'flex',
              flexDirection: 'column',
              gap: '6px',
              fontFamily: 'inherit',
              color: 'inherit',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '18px' }}>{m.badgeIcon}</span>
                <span style={{ fontSize: '15px', fontWeight: 'bold', color: isSelected ? '#00e5ff' : '#ffffff' }}>
                  {getModeName(m)}
                </span>
              </div>
              {isSelected && (
                <span style={{ fontSize: '11px', color: '#00e5ff', fontWeight: 'bold', letterSpacing: '1px' }}>
                  {locale.modeSelected}
                </span>
              )}
            </div>

            <p style={{ margin: 0, fontSize: '12px', color: '#94a3b8', lineHeight: '1.4' }}>
              {getModeDesc(m)}
            </p>

            {/* Tags */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '2px' }}>
              {tags.map((tag) => (
                <span
                  key={tag}
                  style={{
                    fontSize: '10px',
                    fontWeight: 'bold',
                    padding: '2px 6px',
                    borderRadius: '4px',
                    backgroundColor: 'rgba(0, 229, 255, 0.1)',
                    border: '1px solid rgba(0, 229, 255, 0.25)',
                    color: '#7dd3fc',
                  }}
                >
                  {tag}
                </span>
              ))}
            </div>
          </button>
        )
      })}
    </Modal>
  )
}

export const ModeSelectModal: React.FC<ModeSelectModalProps> = (props) => {
  if (!props.isOpen) return null
  return <ModeSelectModalContent {...props} />
}
