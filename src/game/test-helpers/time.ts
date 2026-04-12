import { vi } from 'vitest'

export function mockAnimationFrame() {
  let id = 0
  const callbacks = new Map<number, FrameRequestCallback>()

  vi.stubGlobal('requestAnimationFrame', (cb: FrameRequestCallback) => {
    id += 1
    callbacks.set(id, cb)
    return id
  })

  vi.stubGlobal('cancelAnimationFrame', (rafId: number) => {
    callbacks.delete(rafId)
  })

  return {
    flush(timestamp = 16): void {
      const current = Array.from(callbacks.values())
      callbacks.clear()
      for (const cb of current) cb(timestamp)
    },
  }
}
