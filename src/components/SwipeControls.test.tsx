import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import SwipeControls from './SwipeControls'

beforeEach(() => {
  Object.assign(HTMLElement.prototype, {
    setPointerCapture: vi.fn(),
    releasePointerCapture: vi.fn(),
    hasPointerCapture: vi.fn(() => false),
  })
})

function renderControls(overrides: Partial<React.ComponentProps<typeof SwipeControls>> = {}) {
  const props = {
    onSetPosition: vi.fn(),
    onPause: vi.fn(),
    onMute: vi.fn(),
    onFireDown: vi.fn(),
    onFireUp: vi.fn(),
    fireLabel: 'FIRE',
    ...overrides,
  }
  const view = render(<SwipeControls {...props} />)
  return { ...props, ...view }
}

describe('SwipeControls', () => {
  it('tracks a swipe from pointer down to pointer up', () => {
    const { container, onSetPosition } = renderControls()
    const area = container.querySelector('.swipe-area') as HTMLElement

    fireEvent.pointerDown(area, { pointerId: 1, clientX: 120, clientY: 240 })
    expect(onSetPosition).toHaveBeenCalledWith(120, 240)

    fireEvent.pointerMove(area, { pointerId: 1, clientX: 160, clientY: 260 })
    expect(onSetPosition).toHaveBeenCalledWith(160, 260)

    fireEvent.pointerUp(area, { pointerId: 1 })
    expect(onSetPosition).toHaveBeenLastCalledWith(null, null)
  })

  it('ignores pointer moves before the finger touches the screen', () => {
    const { container, onSetPosition } = renderControls()
    const area = container.querySelector('.swipe-area') as HTMLElement

    fireEvent.pointerMove(area, { pointerId: 1, clientX: 10, clientY: 20 })

    expect(onSetPosition).not.toHaveBeenCalled()
  })

  it('fires only while the fire button is held', () => {
    const { onFireDown, onFireUp } = renderControls()
    const fire = screen.getByRole('button', { name: 'FIRE' })

    fireEvent.pointerUp(fire, { pointerId: 1 })
    expect(onFireUp).not.toHaveBeenCalled()

    fireEvent.pointerDown(fire, { pointerId: 1 })
    expect(onFireDown).toHaveBeenCalledTimes(1)

    fireEvent.pointerUp(fire, { pointerId: 1 })
    expect(onFireUp).toHaveBeenCalledTimes(1)
  })

  it('shows overdrive only when the callback is provided', () => {
    const onOverdrive = vi.fn()
    const { rerender } = renderControls({ onOverdrive })

    fireEvent.click(screen.getByRole('button', { name: 'OVERDRIVE' }))
    expect(onOverdrive).toHaveBeenCalledTimes(1)

    rerender(
      <SwipeControls
        onSetPosition={vi.fn()}
        onPause={vi.fn()}
        onMute={vi.fn()}
        onFireDown={vi.fn()}
        onFireUp={vi.fn()}
        fireLabel="FIRE"
      />,
    )
    expect(screen.queryByRole('button', { name: 'OVERDRIVE' })).toBeNull()
  })

  it('wires pause and mute', () => {
    const { onPause, onMute } = renderControls()

    fireEvent.click(screen.getByRole('button', { name: 'Pause' }))
    fireEvent.click(screen.getByRole('button', { name: 'Mute' }))

    expect(onPause).toHaveBeenCalledTimes(1)
    expect(onMute).toHaveBeenCalledTimes(1)
  })
})
