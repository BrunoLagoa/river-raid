/**
 * jsdom has no canvas implementation. Components and smoke tests that mount a
 * canvas without installing the native `canvas` package used to spam
 * "Not implemented: HTMLCanvasElement's getContext()" for every call.
 *
 * This stub returns a no-op 2D context. Tests that need to assert draw calls
 * keep using `createMockCanvas()`, which spies on the element and overrides
 * this prototype fallback.
 */

const DATA_PROPERTIES: Record<string, unknown> = {
  globalAlpha: 1,
  globalCompositeOperation: 'source-over',
  fillStyle: '#000',
  strokeStyle: '#000',
  lineWidth: 1,
  lineCap: 'butt',
  lineJoin: 'miter',
  miterLimit: 10,
  shadowBlur: 0,
  shadowColor: 'rgba(0, 0, 0, 0)',
  shadowOffsetX: 0,
  shadowOffsetY: 0,
  font: '10px monospace',
  textAlign: 'start',
  textBaseline: 'alphabetic',
  direction: 'inherit',
  imageSmoothingEnabled: true,
  imageSmoothingQuality: 'low',
  filter: 'none',
  lineDashOffset: 0,
}

const contexts = new WeakMap<HTMLCanvasElement, CanvasRenderingContext2D>()

function createStubContext(canvas: HTMLCanvasElement): CanvasRenderingContext2D {
  const state: Record<string, unknown> = { ...DATA_PROPERTIES, canvas }

  return new Proxy(state, {
    get(target, prop) {
      if (prop in target) return target[prop as string]
      if (typeof prop !== 'string') return undefined

      if (prop === 'measureText') {
        return () => ({
          width: 0,
          actualBoundingBoxAscent: 0,
          actualBoundingBoxDescent: 0,
          actualBoundingBoxLeft: 0,
          actualBoundingBoxRight: 0,
        })
      }
      if (prop === 'createLinearGradient' || prop === 'createRadialGradient' || prop === 'createPattern') {
        return () => ({ addColorStop: () => {} })
      }
      if (prop === 'getImageData' || prop === 'createImageData') {
        return () => ({ data: new Uint8ClampedArray(4), width: 1, height: 1 })
      }
      if (prop === 'isPointInPath' || prop === 'isPointInStroke') {
        return () => false
      }

      // Every other unknown member is a CanvasRenderingContext2D method
      // (save, restore, beginPath, arc, fill, drawImage, roundRect, ...).
      return () => {}
    },
    set(target, prop, value) {
      target[prop as string] = value
      return true
    },
  }) as unknown as CanvasRenderingContext2D
}

if (typeof HTMLCanvasElement !== 'undefined') {
  Object.defineProperty(HTMLCanvasElement.prototype, 'getContext', {
    configurable: true,
    writable: true,
    value(this: HTMLCanvasElement, type: string) {
      if (type !== '2d') return null
      let ctx = contexts.get(this)
      if (!ctx) {
        ctx = createStubContext(this)
        contexts.set(this, ctx)
      }
      return ctx
    },
  })
}
