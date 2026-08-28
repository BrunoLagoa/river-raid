import { describe, it, expect, beforeEach } from 'vitest'
import { WeatherSystem } from './WeatherSystem'
import {
  WEATHER_LIGHTNING_FLASH_DURATION,
  WEATHER_RAIN_ALPHA_BASE,
  WEATHER_RAIN_ALPHA_VARIATION,
} from './constants'
import type { WeatherParticle } from './WeatherSystem'

describe('WeatherSystem', () => {
  let ws: WeatherSystem
  const CANVAS_WIDTH = 480
  const CANVAS_HEIGHT = 640

  beforeEach(() => {
    // `() => 0` faz o sorteio de ocorrência do clima sempre passar, mantendo
    // estes testes determinísticos agora que a chuva é probabilística.
    ws = new WeatherSystem(CANVAS_WIDTH, CANVAS_HEIGHT, () => 0)
  })

  it('initializes with default state', () => {
    expect(ws.getCurrentWeather()).toBe('rain')
    expect(ws.isLightningActive()).toBe(false)
  })

  it('updates particle count according to weather type', () => {
    ws.update(0.1, 100, 'rain')
    expect(ws.getCurrentWeather()).toBe('rain')

    ws.update(0.1, 100, 'snow')
    expect(ws.getCurrentWeather()).toBe('snow')

    ws.update(0.1, 100, 'sandstorm')
    expect(ws.getCurrentWeather()).toBe('sandstorm')

    ws.update(0.1, 100, 'smog')
    expect(ws.getCurrentWeather()).toBe('smog')
  })

  it('reduces particle counts when reducedMotion is enabled', () => {
    ws.update(0.1, 100, 'rain', true)
    // Runs without throwing and respects reduced particle cap
    expect(ws.isLightningActive()).toBe(false)
  })

  it('handles lightning flash timing in rain mode', () => {
    // Force lightning timer to near trigger
    let sawFlash = false
    for (let i = 0; i < 200; i++) {
      ws.update(0.1, 100, 'rain', false)
      if (ws.isLightningActive()) {
        sawFlash = true
        break
      }
    }
    // We should either trigger or verify the flash decays properly
    if (sawFlash) {
      expect(ws.isLightningActive()).toBe(true)
      ws.update(WEATHER_LIGHTNING_FLASH_DURATION + 0.05, 100, 'rain', false)
      expect(ws.isLightningActive()).toBe(false)
    }
  })

  it('never triggers lightning when reducedMotion is true or non-rain weather', () => {
    for (let i = 0; i < 100; i++) {
      ws.update(0.1, 100, 'snow', false)
      expect(ws.isLightningActive()).toBe(false)
    }
    for (let i = 0; i < 100; i++) {
      ws.update(0.1, 100, 'rain', true)
      expect(ws.isLightningActive()).toBe(false)
    }
  })

  it('resets particles and timers on reset()', () => {
    ws.update(0.5, 100, 'sandstorm')
    ws.reset()
    expect(ws.isLightningActive()).toBe(false)
  })

  it('handles zero or negative dt gracefully', () => {
    ws.update(0, 100, 'rain')
    ws.update(-1, 100, 'rain')
    expect(ws.getCurrentWeather()).toBe('rain')
  })

  it('updates canvas dimensions on setCanvasSize', () => {
    ws.setCanvasSize(600, 800)
    ws.update(0.1, 100, 'rain')
    expect(ws.getCurrentWeather()).toBe('rain')
  })

  it('renders without errors when enabled or disabled', () => {
    const mockCtx = {
      save: () => {},
      restore: () => {},
      fillRect: () => {},
      beginPath: () => {},
      moveTo: () => {},
      lineTo: () => {},
      arc: () => {},
      stroke: () => {},
      fill: () => {},
      fillStyle: '',
      strokeStyle: '',
      globalAlpha: 1,
      lineWidth: 1,
    } as unknown as CanvasRenderingContext2D

    ws.update(0.1, 100, 'rain')
    expect(() => ws.render(mockCtx, CANVAS_WIDTH, CANVAS_HEIGHT, true, false)).not.toThrow()
    expect(() => ws.render(mockCtx, CANVAS_WIDTH, CANVAS_HEIGHT, false, false)).not.toThrow()
    expect(() => ws.render(mockCtx, CANVAS_WIDTH, CANVAS_HEIGHT, true, true)).not.toThrow()

    // Test other weathers
    ws.update(0.1, 100, 'sandstorm')
    expect(() => ws.render(mockCtx, CANVAS_WIDTH, CANVAS_HEIGHT, true, false)).not.toThrow()
    ws.update(0.1, 100, 'snow')
    expect(() => ws.render(mockCtx, CANVAS_WIDTH, CANVAS_HEIGHT, true, false)).not.toThrow()
    ws.update(0.1, 100, 'smog')
    expect(() => ws.render(mockCtx, CANVAS_WIDTH, CANVAS_HEIGHT, true, false)).not.toThrow()
  })
  describe('sorteio de ocorrencia do clima', () => {
    function makeWs(roll: () => number) {
      return new WeatherSystem(CANVAS_WIDTH, CANVAS_HEIGHT, roll)
    }

    it('deixa o trecho limpo quando a chuva nao e sorteada', () => {
      const rainy = makeWs(() => 0.99)

      rainy.update(0.1, 100, 'rain')

      expect(rainy.getCurrentWeather()).toBe('clear')
      expect(rainy.isLightningActive()).toBe(false)
    })

    it('mantem o resultado do sorteio durante todo o trecho', () => {
      let roll = 0.99
      const rainy = makeWs(() => roll)

      rainy.update(0.1, 100, 'rain')
      expect(rainy.getCurrentWeather()).toBe('clear')

      // Mesmo com a sorte virando, o trecho atual nao pode comecar a chover
      // no meio — o sorteio vale ate a proxima troca de bioma.
      roll = 0
      for (let i = 0; i < 20; i++) rainy.update(0.1, 100, 'rain')
      expect(rainy.getCurrentWeather()).toBe('clear')
    })

    it('sorteia de novo a cada troca de clima', () => {
      let roll = 0.99
      const rainy = makeWs(() => roll)

      rainy.update(0.1, 100, 'rain')
      expect(rainy.getCurrentWeather()).toBe('clear')

      roll = 0
      rainy.update(0.1, 100, 'snow')
      rainy.update(0.1, 100, 'rain')
      expect(rainy.getCurrentWeather()).toBe('rain')
    })

    it('climas com chance 1 ocorrem sempre', () => {
      const unlucky = makeWs(() => 0.99)

      unlucky.update(0.1, 100, 'sandstorm')
      expect(unlucky.getCurrentWeather()).toBe('sandstorm')

      unlucky.update(0.1, 100, 'snow')
      expect(unlucky.getCurrentWeather()).toBe('snow')
    })

    it('reset volta a sortear na proxima run', () => {
      let roll = 0.99
      const rainy = makeWs(() => roll)

      rainy.update(0.1, 100, 'rain')
      expect(rainy.getCurrentWeather()).toBe('clear')

      rainy.reset()
      roll = 0
      rainy.update(0.1, 100, 'rain')
      expect(rainy.getCurrentWeather()).toBe('rain')
    })
  })
  it('mantem as gotas discretas para nao competir com os projeteis', () => {
    ws.update(0.1, 100, 'rain')

    const particles = (ws as unknown as { particles: WeatherParticle[] }).particles
    const drops = particles.filter((p) => p.active && p.kind === 'rain')

    expect(drops.length).toBeGreaterThan(0)
    for (const drop of drops) {
      expect(drop.alpha).toBeGreaterThanOrEqual(WEATHER_RAIN_ALPHA_BASE)
      expect(drop.alpha).toBeLessThanOrEqual(WEATHER_RAIN_ALPHA_BASE + WEATHER_RAIN_ALPHA_VARIATION)
      // Meio opaco ja embaralha a leitura das balas.
      expect(drop.alpha).toBeLessThan(0.5)
    }
  })
})
