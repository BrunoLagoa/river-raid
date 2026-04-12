import { useRef, useCallback } from 'react'
import './SwipeControls.css'

interface SwipeControlsProps {
  onSetPosition: (x: number | null) => void
  onFire: (down: boolean) => void
  onPause: () => void
  onMute: () => void
}

const TAP_MAX_DURATION = 200
const TAP_MAX_DISTANCE = 15

export default function SwipeControls({ onSetPosition, onFire, onPause, onMute }: SwipeControlsProps) {
  const touchRef = useRef<{ startX: number; startTime: number } | null>(null)

  const handlePointerDown = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      e.preventDefault()
      const el = e.currentTarget as HTMLElement
      el.setPointerCapture(e.pointerId)
      touchRef.current = {
        startX: e.clientX,
        startTime: performance.now(),
      }
      onSetPosition(e.clientX)
    },
    [onSetPosition]
  )

  const handlePointerMove = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (!touchRef.current) return
      e.preventDefault()
      onSetPosition(e.clientX)
    },
    [onSetPosition]
  )

  const handlePointerUp = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (!touchRef.current) return
      e.preventDefault()
      const el = e.currentTarget as HTMLElement
      if (el.hasPointerCapture(e.pointerId)) {
        el.releasePointerCapture(e.pointerId)
      }

      const dx = Math.abs(e.clientX - touchRef.current.startX)
      const elapsed = performance.now() - touchRef.current.startTime

      if (elapsed < TAP_MAX_DURATION && dx < TAP_MAX_DISTANCE) {
        onFire(true)
        requestAnimationFrame(() => {
          onFire(false)
        })
      }

      touchRef.current = null
      onSetPosition(null)
    },
    [onSetPosition, onFire]
  )

  const handlePointerCancel = useCallback(() => {
    touchRef.current = null
    onSetPosition(null)
  }, [onSetPosition])

  return (
    <div className="swipe-controls-container" onContextMenu={(e) => e.preventDefault()}>
      <div className="sys-buttons top-left">
        <button className="btn-sys" onClick={onPause}>
          II
        </button>
      </div>
      <div className="sys-buttons top-right">
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
