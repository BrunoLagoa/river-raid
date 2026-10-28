import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import Modal from './Modal'

describe('Modal', () => {
  it('renders nothing while closed', () => {
    render(
      <Modal isOpen={false} onClose={vi.fn()} title="Settings" testId="test-modal">
        <p>Body</p>
      </Modal>,
    )

    expect(screen.queryByTestId('test-modal')).toBeNull()
  })

  it('exposes dialog semantics and names the dialog after its title', () => {
    render(
      <Modal isOpen onClose={vi.fn()} title="Settings" subtitle="Configure" testId="test-modal">
        <p>Body</p>
      </Modal>,
    )

    const dialog = screen.getByRole('dialog', { name: 'Settings' })
    expect(dialog.getAttribute('aria-modal')).toBe('true')
    expect(screen.getByText('Configure')).toBeTruthy()
    expect(screen.getByText('Body')).toBeTruthy()
  })

  it('closes on Escape', () => {
    const onClose = vi.fn()
    render(
      <Modal isOpen onClose={onClose} title="Settings" testId="test-modal">
        <button type="button">Action</button>
      </Modal>,
    )

    fireEvent.keyDown(document, { key: 'Escape' })

    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('keeps tab focus inside the dialog', () => {
    render(
      <Modal isOpen onClose={vi.fn()} title="Settings" testId="test-modal">
        <button type="button">First</button>
        <button type="button">Last</button>
      </Modal>,
    )

    const [first, last] = screen.getAllByRole('button')
    last.focus()
    fireEvent.keyDown(document, { key: 'Tab' })
    expect(document.activeElement).toBe(first)

    first.focus()
    fireEvent.keyDown(document, { key: 'Tab', shiftKey: true })
    expect(document.activeElement).toBe(last)
  })
})
