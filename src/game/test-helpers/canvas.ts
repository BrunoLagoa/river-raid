import { vi } from 'vitest'

export function createMockContext2D(canvas?: HTMLCanvasElement): CanvasRenderingContext2D {
  const gradient = { addColorStop: vi.fn() }

  const ctx = {
    canvas: canvas ?? ({ width: 800, height: 600 } as HTMLCanvasElement),
    save: vi.fn(),
    restore: vi.fn(),
    clearRect: vi.fn(),
    fillRect: vi.fn(),
    strokeRect: vi.fn(),
    beginPath: vi.fn(),
    closePath: vi.fn(),
    moveTo: vi.fn(),
    lineTo: vi.fn(),
    arc: vi.fn(),
    stroke: vi.fn(),
    fill: vi.fn(),
    clip: vi.fn(),
    rect: vi.fn(),
    fillText: vi.fn(),
    translate: vi.fn(),
    rotate: vi.fn(),
    scale: vi.fn(),
    setTransform: vi.fn(),
    drawImage: vi.fn(),
    setLineDash: vi.fn(),
    createLinearGradient: vi.fn(() => gradient),
    globalAlpha: 1,
    fillStyle: '#000',
    strokeStyle: '#000',
    lineWidth: 1,
    textAlign: 'left' as const,
    textBaseline: 'alphabetic' as const,
    font: '10px monospace',
  }

  return ctx as unknown as CanvasRenderingContext2D
}

export function createMockCanvas(width = 800, height = 600): HTMLCanvasElement {
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = createMockContext2D(canvas)
  vi.spyOn(canvas, 'getContext').mockImplementation((type: string) => {
    if (type === '2d') return ctx
    return null
  })
  return canvas
}
