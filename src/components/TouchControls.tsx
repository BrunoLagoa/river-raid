import { useCallback } from 'react'
import './TouchControls.css'

interface TouchControlsProps {
  onKey: (key: string, isDown: boolean) => void
  onPause: () => void
  onMute: () => void
}

export default function TouchControls({ onKey, onPause, onMute }: TouchControlsProps) {
  // Helpers to prevent context menu and scrolling on mobile
  const preventDefault = useCallback((e: React.SyntheticEvent) => {
    e.preventDefault()
    e.stopPropagation()
  }, [])

  const handlePointer = useCallback(
    (key: string, isDown: boolean) => (e: React.PointerEvent) => {
      e.preventDefault()
      e.stopPropagation()
      const el = e.currentTarget as HTMLElement
      if (isDown) {
        el.setPointerCapture(e.pointerId)
      } else {
        if (el.hasPointerCapture(e.pointerId)) {
          el.releasePointerCapture(e.pointerId)
        }
      }
      onKey(key, isDown)
    },
    [onKey]
  )

  return (
    <div className="mobile-controls-container" onContextMenu={(e) => e.preventDefault()}>
      {/* Top sys buttons */}
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

      {/* D-Pad on the left */}
      <div className="d-pad">
        <div className="d-pad-row row-up">
          <button
            className="btn-dir up"
            onPointerDown={handlePointer('ArrowUp', true)}
            onPointerUp={handlePointer('ArrowUp', false)}
            onPointerCancel={handlePointer('ArrowUp', false)}
            onContextMenu={preventDefault}
          />
        </div>
        <div className="d-pad-row row-mid">
          <button
            className="btn-dir left"
            onPointerDown={handlePointer('ArrowLeft', true)}
            onPointerUp={handlePointer('ArrowLeft', false)}
            onPointerCancel={handlePointer('ArrowLeft', false)}
            onContextMenu={preventDefault}
          >
            ◁
          </button>
          <div className="d-pad-center" />
          <button
            className="btn-dir right"
            onPointerDown={handlePointer('ArrowRight', true)}
            onPointerUp={handlePointer('ArrowRight', false)}
            onPointerCancel={handlePointer('ArrowRight', false)}
            onContextMenu={preventDefault}
          >
            ▷
          </button>
        </div>
        <div className="d-pad-row row-down">
          <button
            className="btn-dir down"
            onPointerDown={handlePointer('ArrowDown', true)}
            onPointerUp={handlePointer('ArrowDown', false)}
            onPointerCancel={handlePointer('ArrowDown', false)}
            onContextMenu={preventDefault}
          />
        </div>
      </div>

      {/* Action button on the right */}
      <div className="action-buttons">
        <button
          className="btn-action"
          onPointerDown={handlePointer(' ', true)}
          onPointerUp={handlePointer(' ', false)}
          onPointerCancel={handlePointer(' ', false)}
          onContextMenu={preventDefault}
        >
          FIRE
        </button>
      </div>
    </div>
  )
}
