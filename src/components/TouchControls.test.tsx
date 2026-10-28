import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import TouchControls from './TouchControls'

beforeEach(() => {
  // jsdom does not implement the Pointer Events capture API used by the
  // on-screen controls.
  Object.assign(HTMLElement.prototype, {
    setPointerCapture: vi.fn(),
    releasePointerCapture: vi.fn(),
    hasPointerCapture: vi.fn(() => false),
  })
})

describe('TouchControls', () => {
  it('exposes pause, mute and every direction as accessible buttons', () => {
    render(<TouchControls onKey={vi.fn()} onPause={vi.fn()} onMute={vi.fn()} />)

    for (const name of ['Pause', 'Mute', 'Move up', 'Move down', 'Move left', 'Move right', 'Fire']) {
      expect(screen.getByRole('button', { name })).toBeTruthy()
    }
  })

  it('emits key down/up for the D-pad and fire button', () => {
    const onKey = vi.fn()
    render(<TouchControls onKey={onKey} onPause={vi.fn()} onMute={vi.fn()} />)

    const up = screen.getByRole('button', { name: 'Move up' })
    fireEvent.pointerDown(up, { pointerId: 1 })
    fireEvent.pointerUp(up, { pointerId: 1 })
    expect(onKey).toHaveBeenCalledWith('ArrowUp', true)
    expect(onKey).toHaveBeenCalledWith('ArrowUp', false)

    const fire = screen.getByRole('button', { name: 'Fire' })
    fireEvent.pointerDown(fire, { pointerId: 2 })
    fireEvent.pointerUp(fire, { pointerId: 2 })
    expect(onKey).toHaveBeenCalledWith(' ', true)
    expect(onKey).toHaveBeenCalledWith(' ', false)
  })

  it('wires the pause and mute system buttons', () => {
    const onPause = vi.fn()
    const onMute = vi.fn()
    render(<TouchControls onKey={vi.fn()} onPause={onPause} onMute={onMute} />)

    fireEvent.click(screen.getByRole('button', { name: 'Pause' }))
    fireEvent.click(screen.getByRole('button', { name: 'Mute' }))

    expect(onPause).toHaveBeenCalledTimes(1)
    expect(onMute).toHaveBeenCalledTimes(1)
  })
})
