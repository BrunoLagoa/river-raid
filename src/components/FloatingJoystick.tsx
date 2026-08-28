import React, { useState, useRef, useEffect, useCallback } from 'react'

export interface JoystickVector {
  x: number // -1 (left) to 1 (right)
  y: number // -1 (up/accelerate) to 1 (down/brake)
}

interface FloatingJoystickProps {
  onMove: (vector: JoystickVector) => void
  onFire: (isFiring: boolean) => void
  onOverdrive?: () => void
  onPause?: () => void
  onMute?: () => void
  isOverdriveReady?: boolean
  isMuted?: boolean
}

const MAX_RADIUS = 48 // Maximum thumbstick excursion in px

export const FloatingJoystick: React.FC<FloatingJoystickProps> = ({
  onMove,
  onFire,
  onOverdrive,
  onPause,
  onMute,
  isOverdriveReady = false,
  isMuted = false,
}) => {
  const [active, setActive] = useState(false)
  const [basePos, setBasePos] = useState<{ x: number; y: number }>({ x: 0, y: 0 })
  const [knobPos, setKnobPos] = useState<{ x: number; y: number }>({ x: 0, y: 0 })
  const touchIdRef = useRef<number | null>(null)

  const handleTouchStart = useCallback((e: React.TouchEvent<HTMLDivElement>) => {
    // Only capture touches on the left 60% of the screen if not already tracking
    if (touchIdRef.current !== null) return

    for (let i = 0; i < e.changedTouches.length; i++) {
      const touch = e.changedTouches[i]
      if (touch.clientX < window.innerWidth * 0.65) {
        touchIdRef.current = touch.identifier
        setBasePos({ x: touch.clientX, y: touch.clientY })
        setKnobPos({ x: touch.clientX, y: touch.clientY })
        setActive(true)
        break
      }
    }
  }, [])

  const handleTouchMove = useCallback((e: React.TouchEvent<HTMLDivElement>) => {
    if (touchIdRef.current === null) return

    for (let i = 0; i < e.changedTouches.length; i++) {
      const touch = e.changedTouches[i]
      if (touch.identifier === touchIdRef.current) {
        const dx = touch.clientX - basePos.x
        const dy = touch.clientY - basePos.y
        const distance = Math.hypot(dx, dy)
        const angle = Math.atan2(dy, dx)

        const clampedDist = Math.min(distance, MAX_RADIUS)
        const clampedX = basePos.x + Math.cos(angle) * clampedDist
        const clampedY = basePos.y + Math.sin(angle) * clampedDist

        setKnobPos({ x: clampedX, y: clampedY })

        const normalizedX = (clampedDist / MAX_RADIUS) * Math.cos(angle)
        const normalizedY = (clampedDist / MAX_RADIUS) * Math.sin(angle)

        onMove({ x: normalizedX, y: normalizedY })
        break
      }
    }
  }, [basePos, onMove])

  const handleTouchEnd = useCallback((e: React.TouchEvent<HTMLDivElement>) => {
    if (touchIdRef.current === null) return

    for (let i = 0; i < e.changedTouches.length; i++) {
      const touch = e.changedTouches[i]
      if (touch.identifier === touchIdRef.current) {
        touchIdRef.current = null
        setActive(false)
        onMove({ x: 0, y: 0 })
        break
      }
    }
  }, [onMove])

  // Safety fallback if touch is cancelled by browser
  useEffect(() => {
    const handleGlobalTouchEnd = (): void => {
      if (touchIdRef.current !== null) {
        touchIdRef.current = null
        setActive(false)
        onMove({ x: 0, y: 0 })
      }
    }
    window.addEventListener('touchend', handleGlobalTouchEnd)
    window.addEventListener('touchcancel', handleGlobalTouchEnd)
    return () => {
      window.removeEventListener('touchend', handleGlobalTouchEnd)
      window.removeEventListener('touchcancel', handleGlobalTouchEnd)
    }
  }, [onMove])

  return (
    <div
      data-testid="floating-joystick-container"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={handleTouchEnd}
      style={{
        position: 'absolute',
        inset: 0,
        touchAction: 'none',
        pointerEvents: 'auto',
        userSelect: 'none',
        zIndex: 50,
      }}
    >
      {/* Visual Joystick Ring & Thumbstick Knob */}
      {active && (
        <div
          data-testid="joystick-base"
          style={{
            position: 'absolute',
            left: `${basePos.x - MAX_RADIUS}px`,
            top: `${basePos.y - MAX_RADIUS}px`,
            width: `${MAX_RADIUS * 2}px`,
            height: `${MAX_RADIUS * 2}px`,
            borderRadius: '50%',
            backgroundColor: 'rgba(0, 229, 255, 0.1)',
            border: '2px solid rgba(0, 229, 255, 0.4)',
            boxShadow: '0 0 15px rgba(0, 229, 255, 0.2)',
            pointerEvents: 'none',
          }}
        >
          {/* Thumbstick Knob */}
          <div
            data-testid="joystick-knob"
            style={{
              position: 'absolute',
              left: `${knobPos.x - basePos.x + MAX_RADIUS - 22}px`,
              top: `${knobPos.y - basePos.y + MAX_RADIUS - 22}px`,
              width: '44px',
              height: '44px',
              borderRadius: '50%',
              backgroundColor: '#00e5ff',
              boxShadow: '0 0 12px #00e5ff',
              border: '2px solid #ffffff',
              pointerEvents: 'none',
            }}
          />
        </div>
      )}

      {/* Top action shortcuts (Pause / Mute) */}
      <div
        style={{
          position: 'absolute',
          top: '12px',
          right: '12px',
          display: 'flex',
          gap: '8px',
          pointerEvents: 'auto',
        }}
      >
        {onMute && (
          <button
            type="button"
            data-testid="mobile-btn-mute"
            onClick={onMute}
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '8px',
              backgroundColor: isMuted ? 'rgba(255, 70, 70, 0.3)' : 'rgba(0, 229, 255, 0.15)',
              border: '1px solid rgba(0, 229, 255, 0.3)',
              color: isMuted ? '#ff6666' : '#00e5ff',
              fontSize: '14px',
              cursor: 'pointer',
            }}
          >
            {isMuted ? '🔇' : '🔊'}
          </button>
        )}

        {onPause && (
          <button
            type="button"
            data-testid="mobile-btn-pause"
            onClick={onPause}
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '8px',
              backgroundColor: 'rgba(0, 229, 255, 0.15)',
              border: '1px solid rgba(0, 229, 255, 0.3)',
              color: '#00e5ff',
              fontSize: '14px',
              cursor: 'pointer',
            }}
          >
            ⏸
          </button>
        )}
      </div>

      {/* Right side Action Buttons (Fire & Overdrive) */}
      <div
        style={{
          position: 'absolute',
          bottom: '24px',
          right: '24px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '14px',
          pointerEvents: 'auto',
        }}
      >
        {/* Overdrive Special Button */}
        {onOverdrive && (
          <button
            type="button"
            data-testid="mobile-btn-overdrive"
            onClick={onOverdrive}
            style={{
              width: '56px',
              height: '56px',
              borderRadius: '50%',
              backgroundColor: isOverdriveReady ? '#ffaa00' : 'rgba(255, 170, 0, 0.15)',
              color: isOverdriveReady ? '#000' : '#ffaa00',
              border: isOverdriveReady ? '2px solid #ffffff' : '1px solid rgba(255, 170, 0, 0.4)',
              fontSize: '18px',
              fontWeight: 'bold',
              boxShadow: isOverdriveReady ? '0 0 16px #ffaa00' : 'none',
              cursor: isOverdriveReady ? 'pointer' : 'default',
              transition: 'all 0.15s ease',
            }}
          >
            ⚡
          </button>
        )}

        {/* Primary Fire Button */}
        <button
          type="button"
          data-testid="mobile-btn-fire"
          onTouchStart={(e) => { e.stopPropagation(); onFire(true) }}
          onTouchEnd={(e) => { e.stopPropagation(); onFire(false) }}
          onMouseDown={() => onFire(true)}
          onMouseUp={() => onFire(false)}
          onMouseLeave={() => onFire(false)}
          style={{
            width: '74px',
            height: '74px',
            borderRadius: '50%',
            backgroundColor: 'rgba(255, 50, 50, 0.35)',
            border: '3px solid #ff4444',
            color: '#ffffff',
            fontSize: '15px',
            fontWeight: 'bold',
            letterSpacing: '1px',
            fontFamily: "'Courier New', Courier, monospace",
            boxShadow: '0 0 18px rgba(255, 50, 50, 0.4)',
            cursor: 'pointer',
            touchAction: 'none',
          }}
        >
          FIRE
        </button>
      </div>
    </div>
  )
}
