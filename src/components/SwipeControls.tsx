import { useRef, useCallback } from 'react'
import './SwipeControls.css'

interface SwipeControlsProps {
  onSetPosition: (x: number | null, y: number | null) => void
  onPause: () => void
  onMute: () => void
  onFireDown: () => void
  onFireUp: () => void
  onOverdrive?: () => void
  fireLabel: string
}

export default function SwipeControls({ onSetPosition, onPause, onMute, onFireDown, onFireUp, onOverdrive, fireLabel }: SwipeControlsProps) {
  const touching = useRef(false)
  const firing = useRef(false)

  const handleFireDown = useCallback(
    (e: React.PointerEvent<HTMLButtonElement>) => {
      e.preventDefault()
      e.currentTarget.setPointerCapture(e.pointerId)
      firing.current = true
      onFireDown()
    },
    [onFireDown]
  )

  const handleFireUp = useCallback(
    (e: React.PointerEvent<HTMLButtonElement>) => {
      if (!firing.current) return
      e.preventDefault()
      firing.current = false
      onFireUp()
    },
    [onFireUp]
  )

  const handlePointerDown = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      e.preventDefault()
      const el = e.currentTarget as HTMLElement
      el.setPointerCapture(e.pointerId)
      touching.current = true
      onSetPosition(e.clientX, e.clientY)
    },
    [onSetPosition]
  )

  const handlePointerMove = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (!touching.current) return
      e.preventDefault()
      onSetPosition(e.clientX, e.clientY)
    },
    [onSetPosition]
  )

  const handlePointerUp = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (!touching.current) return
      e.preventDefault()
      const el = e.currentTarget as HTMLElement
      if (el.hasPointerCapture(e.pointerId)) {
        el.releasePointerCapture(e.pointerId)
      }
      touching.current = false
      onSetPosition(null, null)
    },
    [onSetPosition]
  )

  const handlePointerCancel = useCallback(() => {
    touching.current = false
    onSetPosition(null, null)
  }, [onSetPosition])

  return (
    <div className="swipe-controls-container" onContextMenu={(e) => e.preventDefault()}>
      <div className="sys-buttons top-left">
        <button className="btn-sys" onClick={onPause}>
          II
        </button>
        <button className="btn-sys" onClick={onMute}>
          <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round">
            <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
            <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"></path>
          </svg>
        </button>
      </div>

      <div
        className="swipe-area"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerCancel}
      />

      {onOverdrive && (
        <button
          className="btn-overdrive"
          aria-label="OVERDRIVE"
          onClick={onOverdrive}
          onContextMenu={(e) => e.preventDefault()}
        >
          ⚡
        </button>
      )}

      <button
        className="btn-fire"
        aria-label={fireLabel}
        onPointerDown={handleFireDown}
        onPointerUp={handleFireUp}
        onPointerCancel={handleFireUp}
        onContextMenu={(e) => e.preventDefault()}
      >
        {fireLabel}
      </button>
    </div>
  )
}
