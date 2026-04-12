import { useRef, useCallback } from 'react'
import './SwipeControls.css'

interface SwipeControlsProps {
  onSetPosition: (x: number | null) => void
  onPause: () => void
  onMute: () => void
}

export default function SwipeControls({ onSetPosition, onPause, onMute }: SwipeControlsProps) {
  const touching = useRef(false)

  const handlePointerDown = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      e.preventDefault()
      const el = e.currentTarget as HTMLElement
      el.setPointerCapture(e.pointerId)
      touching.current = true
      onSetPosition(e.clientX)
    },
    [onSetPosition]
  )

  const handlePointerMove = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (!touching.current) return
      e.preventDefault()
      onSetPosition(e.clientX)
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
      onSetPosition(null)
    },
    [onSetPosition]
  )

  const handlePointerCancel = useCallback(() => {
    touching.current = false
    onSetPosition(null)
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
    </div>
  )
}
