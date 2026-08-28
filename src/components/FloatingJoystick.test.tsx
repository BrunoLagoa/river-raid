import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { FloatingJoystick } from './FloatingJoystick'

describe('FloatingJoystick', () => {
  it('renderiza botoes de acao (fire, pause, mute)', () => {
    const handleMove = vi.fn()
    const handleFire = vi.fn()
    const handlePause = vi.fn()
    const handleMute = vi.fn()

    render(
      <FloatingJoystick
        onMove={handleMove}
        onFire={handleFire}
        onPause={handlePause}
        onMute={handleMute}
        isMuted={false}
      />
    )

    expect(screen.getByTestId('mobile-btn-fire')).toBeDefined()
    expect(screen.getByTestId('mobile-btn-pause')).toBeDefined()
    expect(screen.getByTestId('mobile-btn-mute')).toBeDefined()
  })

  it('dispara onFire ao pressionar e soltar botao de tiro', () => {
    const handleFire = vi.fn()
    render(<FloatingJoystick onMove={vi.fn()} onFire={handleFire} />)

    const fireBtn = screen.getByTestId('mobile-btn-fire')

    fireEvent.mouseDown(fireBtn)
    expect(handleFire).toHaveBeenCalledWith(true)

    fireEvent.mouseUp(fireBtn)
    expect(handleFire).toHaveBeenCalledWith(false)
  })

  it('dispara onOverdrive quando botao especial e clicado', () => {
    const handleOverdrive = vi.fn()
    render(
      <FloatingJoystick
        onMove={vi.fn()}
        onFire={vi.fn()}
        onOverdrive={handleOverdrive}
        isOverdriveReady={true}
      />
    )

    const overdriveBtn = screen.getByTestId('mobile-btn-overdrive')
    fireEvent.click(overdriveBtn)
    expect(handleOverdrive).toHaveBeenCalled()
  })

  it('rastreia touchstart e touchmove na metade esquerda e emite vetor analogico', () => {
    const handleMove = vi.fn()
    render(<FloatingJoystick onMove={handleMove} onFire={vi.fn()} />)

    const container = screen.getByTestId('floating-joystick-container')

    // Touch start at (100, 200)
    fireEvent.touchStart(container, {
      changedTouches: [{ identifier: 1, clientX: 100, clientY: 200 }],
    })

    expect(screen.getByTestId('joystick-base')).toBeDefined()
    expect(screen.getByTestId('joystick-knob')).toBeDefined()

    // Touch move to (130, 200) -> Moving right
    fireEvent.touchMove(container, {
      changedTouches: [{ identifier: 1, clientX: 130, clientY: 200 }],
    })

    expect(handleMove).toHaveBeenCalledWith(expect.objectContaining({
      x: expect.any(Number),
      y: expect.any(Number),
    }))

    // Touch end -> Reseta vetor para (0, 0)
    fireEvent.touchEnd(container, {
      changedTouches: [{ identifier: 1, clientX: 130, clientY: 200 }],
    })

    expect(handleMove).toHaveBeenCalledWith({ x: 0, y: 0 })
    expect(screen.queryByTestId('joystick-base')).toBeNull()
  })
})
