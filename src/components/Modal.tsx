import { useEffect, useId, useRef, type CSSProperties, type ReactNode } from 'react'

interface ModalProps {
  isOpen: boolean
  onClose: () => void
  title: string
  subtitle?: string
  testId: string
  maxWidth?: string
  /** Extras between the header and the scrollable body (e.g. a status banner). */
  banner?: ReactNode
  bodyStyle?: CSSProperties
  footer?: ReactNode
  children: ReactNode
}

const FOCUSABLE =
  'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'

/**
 * Shared dialog shell for the mode, stats and keybinding modals.
 *
 * The three used to be copy-pasted backdrops with no dialog semantics: screen
 * readers saw a plain div, Escape did nothing and focus stayed on the page
 * behind the overlay. This centralises role/aria wiring, Escape handling and a
 * minimal focus trap so every modal behaves the same.
 */
export default function Modal({
  isOpen,
  onClose,
  title,
  subtitle,
  testId,
  maxWidth = '560px',
  banner,
  bodyStyle,
  footer,
  children,
}: ModalProps) {
  const titleId = useId()
  const dialogRef = useRef<HTMLDivElement>(null)
  const onCloseRef = useRef(onClose)
  useEffect(() => {
    onCloseRef.current = onClose
  })

  useEffect(() => {
    if (!isOpen) return

    const previouslyFocused = document.activeElement as HTMLElement | null
    const dialog = dialogRef.current
    dialog?.focus()

    const handleKeyDown = (event: KeyboardEvent): void => {
      if (event.key === 'Escape') {
        event.preventDefault()
        onCloseRef.current()
        return
      }
      if (event.key !== 'Tab' || !dialog) return

      const focusable = Array.from(dialog.querySelectorAll<HTMLElement>(FOCUSABLE))
      if (focusable.length === 0) {
        event.preventDefault()
        dialog.focus()
        return
      }

      const first = focusable[0]
      const last = focusable[focusable.length - 1]
      if (!dialog.contains(document.activeElement)) {
        event.preventDefault()
        first.focus()
      } else if (event.shiftKey && document.activeElement === first) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault()
        first.focus()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      previouslyFocused?.focus?.()
    }
  }, [isOpen])

  if (!isOpen) return null

  return (
    <div
      data-testid={testId}
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
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        style={{
          width: '100%',
          maxWidth,
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
          outline: 'none',
        }}
      >
        <div style={{ padding: '16px 20px', borderBottom: '1px solid rgba(0, 229, 255, 0.2)', textAlign: 'center' }}>
          <h2
            id={titleId}
            style={{
              margin: 0,
              fontSize: '20px',
              letterSpacing: '2px',
              color: '#00e5ff',
              textShadow: '0 0 10px rgba(0,229,255,0.5)',
            }}
          >
            {title}
          </h2>
          {subtitle && (
            <div style={{ fontSize: '11px', color: '#7ba0c0', letterSpacing: '1px', marginTop: '4px' }}>
              {subtitle}
            </div>
          )}
        </div>

        {banner}

        <div
          style={{
            padding: '16px 20px',
            overflowY: 'auto',
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            gap: '10px',
            ...bodyStyle,
          }}
        >
          {children}
        </div>

        {footer && (
          <div
            style={{
              padding: '14px 20px',
              borderTop: '1px solid rgba(0, 229, 255, 0.2)',
              display: 'flex',
              justifyContent: 'space-between',
              gap: '12px',
            }}
          >
            {footer}
          </div>
        )}
      </div>
    </div>
  )
}
