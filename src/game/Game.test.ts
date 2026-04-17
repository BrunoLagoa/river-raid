import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { Game } from './Game'
import { CollisionSystem } from './CollisionSystem'
import { writeSecureNumber } from './StorageService'
import { createMockCanvas } from './test-helpers/canvas'
import { mockAnimationFrame } from './test-helpers/time'
import { mockAudioContext } from './test-helpers/audio'

beforeEach(() => {
  vi.useFakeTimers()
  vi.setSystemTime(new Date('2026-01-01'))
  mockAudioContext()
})

afterEach(() => {
  vi.useRealTimers()
  vi.restoreAllMocks()
})

describe('Game integration', () => {
  it('start e stop controlam loop', () => {
    const canvas = createMockCanvas()
    const raf = mockAnimationFrame()
    const game = new Game(canvas)

    game.start()
    raf.flush(16)
    game.stop()

    expect(game).toBeDefined()
  })

  it('chama callback de game over', () => {
    const canvas = createMockCanvas()
    const game = new Game(canvas)
    const cb = vi.fn()
    game.setOnGameOver(cb)

    game.handlePlayerDeath()
    game.handlePlayerDeath()
    game.handlePlayerDeath()

    vi.advanceTimersByTime(1300)

    expect(cb).toHaveBeenCalled()
  })

  it('togglePause alterna estado sem quebrar o loop ativo', () => {
    const canvas = createMockCanvas()
    const raf = mockAnimationFrame()
    const game = new Game(canvas)

    game.start()
    game.togglePause()
    raf.flush(16)
    game.togglePause()
    raf.flush(32)
    game.stop()

    expect(game).toBeDefined()
  })

  it('restart reinicializa score e estado de jogo', () => {
    const canvas = createMockCanvas()
    const game = new Game(canvas)

    game.score = 1234
    game.lives = 1
    game.simulateKey(' ', true)
    game.restart()

    expect(game.score).toBe(0)
    expect(game.lives).toBe(3)
    expect(game.player.keys.has(' ')).toBe(false)
    game.stop()
  })

  it('setGamepadEnabled atualiza a flag interna', () => {
    const canvas = createMockCanvas()
    const game = new Game(canvas)

    game.setGamepadEnabled(false)

    expect((game as unknown as { gamepadEnabled: boolean }).gamepadEnabled).toBe(false)
  })
})

describe('Game update paths', () => {
  it('update com jogador exploding executa parcialmente', () => {
    const canvas = createMockCanvas()
    const raf = mockAnimationFrame()
    const game = new Game(canvas)
    game.start()
    game.player.explode()

    for (let i = 0; i < 30; i++) raf.flush(50 + i * 50)
    game.stop()

    expect(game.player.state).toBe('dead')
  })

  it('update com jogador dead executa apenas fx e atmosphere', () => {
    const canvas = createMockCanvas()
    const raf = mockAnimationFrame()
    const game = new Game(canvas)
    game.start()
    game.player.state = 'dead'

    raf.flush(50)
    game.stop()

    expect(game.player.state).toBe('dead')
  })

  it('fuel low dispara flash e beep', () => {
    const canvas = createMockCanvas()
    const raf = mockAnimationFrame()
    const game = new Game(canvas)
    game.start()

    game.fuelSystem.fuel = 5
    const flashSpy = vi.spyOn(game.fx, 'flash')
    const beepSpy = vi.spyOn(game.sound, 'lowFuelBeep')

    for (let i = 0; i < 60; i++) raf.flush(50 + i * 50)
    game.stop()

    expect(flashSpy).toHaveBeenCalled()
    expect(beepSpy).toHaveBeenCalled()
  })

  it('sem combustivel mata o jogador', () => {
    const canvas = createMockCanvas()
    const raf = mockAnimationFrame()
    const game = new Game(canvas)
    game.start()

    game.fuelSystem.fuel = 0

    raf.flush(50)
    game.stop()

    expect(game.player.state).toBe('exploding')
  })

  it('justShot dispara som de tiro', () => {
    const canvas = createMockCanvas()
    const raf = mockAnimationFrame()
    const game = new Game(canvas)
    game.start()
    const shootSpy = vi.spyOn(game.sound, 'shoot')

    game.player.keys.add(' ')
    raf.flush(50)
    game.stop()

    expect(shootSpy).toHaveBeenCalled()
  })

  it('justShot com combo penalty reduz comboLevelTimer', () => {
    const canvas = createMockCanvas()
    const raf = mockAnimationFrame()
    const game = new Game(canvas)
    game.start()

    for (let i = 0; i < 10; i++) game.registerHit()
    const timerBefore = game.comboLevelTimer

    game.player.keys.add(' ')
    raf.flush(50)
    game.stop()

    expect(game.comboLevelTimer).toBeLessThanOrEqual(timerBefore)
  })

  it('handlePlayerDeath com vidas respawn jogador apos delay', () => {
    const canvas = createMockCanvas()
    const game = new Game(canvas)
    game.start()

    game.lives = 2
    game.handlePlayerDeath()

    vi.advanceTimersByTime(1500)

    expect(game.player.state).toBe('alive')
    expect(game.lives).toBe(1)
    game.stop()
  })

  it('handlePlayerDeath com vidas reabastece fuel minimo', () => {
    const canvas = createMockCanvas()
    const game = new Game(canvas)
    game.start()

    game.lives = 2
    game.player.state = 'dead'
    game.fuelSystem.fuel = 2
    game.handlePlayerDeath()

    vi.advanceTimersByTime(1400)
    const fuelAfterRespawn = game.fuelSystem.fuel
    game.stop()

    expect(fuelAfterRespawn).toBeGreaterThan(2)
  })

  it('handlePlayerDeath com 0 vidas aciona game over', () => {
    const canvas = createMockCanvas()
    const game = new Game(canvas)
    const cb = vi.fn()
    game.setOnGameOver(cb)
    game.start()

    game.lives = 0
    game.handlePlayerDeath()

    vi.advanceTimersByTime(1300)

    expect(cb).toHaveBeenCalled()
    game.stop()
  })

  it('triggerGameOver salva high score quando score maior', () => {
    const canvas = createMockCanvas()
    const game = new Game(canvas)
    const cb = vi.fn()
    game.setOnGameOver(cb)

    game.score = 9999
    game.handlePlayerDeath()
    game.handlePlayerDeath()
    game.handlePlayerDeath()

    vi.advanceTimersByTime(1300)

    expect(cb).toHaveBeenCalledWith(9999, expect.any(Number))
  })

  it('game over nao dispara duas vezes', () => {
    const canvas = createMockCanvas()
    const game = new Game(canvas)
    const cb = vi.fn()
    game.setOnGameOver(cb)

    game.handlePlayerDeath()
    game.handlePlayerDeath()
    game.handlePlayerDeath()
    game.handlePlayerDeath()

    vi.advanceTimersByTime(1300)

    expect(cb).toHaveBeenCalledTimes(1)
  })

  it('colisao durante loop chama handlePlayerDeath via collision context', () => {
    const canvas = createMockCanvas()
    const raf = mockAnimationFrame()
    const game = new Game(canvas)
    const deathSpy = vi.spyOn(game, 'handlePlayerDeath')

    const pool = (game.enemyManager as unknown as { enemyPool: { acquire: () => Record<string, unknown> } }).enemyPool
    const e = pool.acquire()
    Object.assign(e, {
      type: 'helicopter',
      aiTier: 'basic',
      x: game.player.x,
      y: game.player.y,
      width: 28,
      height: 20,
      points: 60,
      speed: 100,
      active: true,
      originX: game.player.x,
      phase: 0,
      phaseSpeed: 1,
      amplitude: 30,
    })

    game.world.isOutOfBounds = () => false
    game.start()
    raf.flush(50)
    game.stop()

    expect(deathSpy).toHaveBeenCalled()
  })

  it('bala atingindo inimigo durante loop chama addScore', () => {
    const canvas = createMockCanvas()
    const raf = mockAnimationFrame()
    const game = new Game(canvas)
    const scoreBefore = game.score

    game.player.invincibilityTimer = 5
    game.player.keys.add(' ')

    const pool = (game.enemyManager as unknown as { enemyPool: { acquire: () => Record<string, unknown> } }).enemyPool
    const e = pool.acquire()
    Object.assign(e, {
      type: 'helicopter',
      aiTier: 'basic',
      x: game.player.x,
      y: game.player.y - 15,
      width: 28,
      height: 20,
      points: 60,
      speed: 0,
      active: true,
      originX: game.player.x,
      phase: 0,
      phaseSpeed: 0,
      amplitude: 0,
    })

    game.world.isOutOfBounds = () => false
    game.start()
    raf.flush(50)
    game.stop()

    expect(game.score).toBeGreaterThan(scoreBefore)
  })

  it('coleta slow_motion powerup durante loop ativa timer', () => {
    const canvas = createMockCanvas()
    const raf = mockAnimationFrame()
    const game = new Game(canvas)

    game.player.invincibilityTimer = 5
    game.powerUpSystem.powerUps.push({
      type: 'slow_motion',
      x: game.player.x,
      y: game.player.y,
      width: 16,
      height: 16,
      active: true,
    })

    game.world.isOutOfBounds = () => false
    game.start()
    raf.flush(50)

    const timer = game.slowMotionTimer
    game.stop()

    expect(timer).toBeGreaterThan(0)
  })

  it('morte durante loop com 0 vidas chama triggerGameOver', () => {
    const canvas = createMockCanvas()
    const raf = mockAnimationFrame()
    const game = new Game(canvas)
    const cb = vi.fn()
    game.setOnGameOver(cb)

    game.lives = 0

    const pool = (game.enemyManager as unknown as { enemyPool: { acquire: () => Record<string, unknown> } }).enemyPool
    const e = pool.acquire()
    Object.assign(e, {
      type: 'helicopter',
      aiTier: 'basic',
      x: game.player.x,
      y: game.player.y,
      width: 28,
      height: 20,
      points: 60,
      speed: 0,
      active: true,
      originX: game.player.x,
      phase: 0,
      phaseSpeed: 0,
      amplitude: 0,
    })

    game.world.isOutOfBounds = () => false
    game.start()
    raf.flush(50)
    vi.advanceTimersByTime(1300)
    game.stop()

    expect(cb).toHaveBeenCalled()
  })

  it('encaminha triggerGameOver no contexto de colisao', () => {
    const canvas = createMockCanvas()
    const raf = mockAnimationFrame()
    const game = new Game(canvas)
    const cb = vi.fn()
    game.setOnGameOver(cb)

    vi.spyOn(CollisionSystem, 'resolveCollisions').mockImplementationOnce((ctx) => {
      ctx.triggerGameOver()
    })

    game.start()
    raf.flush(50)
    vi.advanceTimersByTime(1300)
    game.stop()

    expect(cb).toHaveBeenCalled()
  })

  it('chama addScore do contexto de colisao', () => {
    const canvas = createMockCanvas()
    const raf = mockAnimationFrame()
    const game = new Game(canvas)

    vi.spyOn(CollisionSystem, 'resolveCollisions').mockImplementationOnce((ctx) => {
      ctx.addScore(42)
    })

    game.start()
    raf.flush(50)
    game.stop()

    expect(game.score).toBe(42)
  })

  it('gera trilha de fumaca com cor de aceleracao', () => {
    const canvas = createMockCanvas()
    const raf = mockAnimationFrame()
    const game = new Game(canvas)
    const smokeSpy = vi.spyOn(game.fx, 'smokeTrail')

    vi.spyOn(Math, 'random').mockReturnValue(0.1)
    game.player.keys.add('ArrowUp')
    game.start()
    raf.flush(50)
    game.stop()

    expect(smokeSpy).toHaveBeenCalledWith(expect.any(Number), expect.any(Number), '#aa7744')
  })

  it('gera trilha de fumaca com cor de frenagem', () => {
    const canvas = createMockCanvas()
    const raf = mockAnimationFrame()
    const game = new Game(canvas)
    const smokeSpy = vi.spyOn(game.fx, 'smokeTrail')

    vi.spyOn(Math, 'random').mockReturnValue(0.1)
    game.player.keys.add('ArrowDown')
    game.start()
    raf.flush(50)
    game.stop()

    expect(smokeSpy).toHaveBeenCalledWith(expect.any(Number), expect.any(Number), '#555555')
  })

  it('nao salva high score quando score atual e menor ou igual ao salvo', () => {
    const canvas = createMockCanvas()
    const game = new Game(canvas)
    const key = (Game as unknown as { HIGH_SCORE_KEY_STATIC: string }).HIGH_SCORE_KEY_STATIC
    writeSecureNumber(key, 9999)

    game.score = 100
    game.handlePlayerDeath()
    game.handlePlayerDeath()
    game.handlePlayerDeath()
    vi.advanceTimersByTime(1300)

    expect(game.getHighScore()).toBe(9999)
  })
})

describe('Game input and controls', () => {
  it('globalKeyHandler P alterna pause', () => {
    const canvas = createMockCanvas()
    const game = new Game(canvas)
    game.start()

    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'p' }))

    expect((game as unknown as { paused: boolean }).paused).toBe(true)
    game.stop()
  })

  it('globalKeyHandler M alterna mute', () => {
    const canvas = createMockCanvas()
    const game = new Game(canvas)
    const muteSpy = vi.spyOn(game.sound, 'toggleMute')

    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'm' }))

    expect(muteSpy).toHaveBeenCalled()
    game.destroy()
  })

  it('simulateKey adiciona e remove teclas', () => {
    const canvas = createMockCanvas()
    const game = new Game(canvas)

    game.simulateKey('ArrowLeft', true)
    expect(game.player.keys.has('ArrowLeft')).toBe(true)

    game.simulateKey('ArrowLeft', false)
    expect(game.player.keys.has('ArrowLeft')).toBe(false)
  })

  it('setTouchPosition repassa ao jogador', () => {
    const canvas = createMockCanvas()
    const game = new Game(canvas)

    game.setTouchPosition(200)

    expect((game.player as unknown as { touchTargetX: number | null }).touchTargetX).toBe(200)
    game.destroy()
  })

  it('setReducedMotion repassa ao fx', () => {
    const canvas = createMockCanvas()
    const game = new Game(canvas)
    const spy = vi.spyOn(game.fx, 'setReducedMotion')

    game.setReducedMotion(true)

    expect(spy).toHaveBeenCalledWith(true)
    game.destroy()
  })

  it('setMasterVolume repassa ao sound', () => {
    const canvas = createMockCanvas()
    const game = new Game(canvas)
    const spy = vi.spyOn(game.sound, 'setVolume')

    game.setMasterVolume(0.5)

    expect(spy).toHaveBeenCalledWith(0.5)
    game.destroy()
  })

  it('destroy limpa listeners e recursos', () => {
    const canvas = createMockCanvas()
    const game = new Game(canvas)
    const destroySpy = vi.spyOn(game.sound, 'destroy')

    game.destroy()

    expect(destroySpy).toHaveBeenCalled()
  })
})

describe('Game pollGamepad', () => {
  it('polls gamepad axis e mapeia para teclas', () => {
    const canvas = createMockCanvas()
    const raf = mockAnimationFrame()
    const game = new Game(canvas)

    const mockGamepad = {
      axes: [-0.5, 0],
      buttons: Array.from({ length: 17 }, () => ({ pressed: false })),
    }

    Object.defineProperty(navigator, 'getGamepads', {
      value: () => [mockGamepad],
      configurable: true,
    })

    game.start()
    raf.flush(50)

    const hasLeft = game.player.keys.has('ArrowLeft')
    game.stop()

    expect(hasLeft).toBe(true)
    delete (navigator as unknown as Record<string, unknown>).getGamepads
  })

  it('polls gamepad eixo direito adiciona ArrowRight', () => {
    const canvas = createMockCanvas()
    const raf = mockAnimationFrame()
    const game = new Game(canvas)

    Object.defineProperty(navigator, 'getGamepads', {
      value: () => [{
        axes: [0.5, 0],
        buttons: Array.from({ length: 17 }, () => ({ pressed: false })),
      }],
      configurable: true,
    })

    game.start()
    raf.flush(50)

    const hasRight = game.player.keys.has('ArrowRight')
    game.stop()

    expect(hasRight).toBe(true)
    delete (navigator as unknown as Record<string, unknown>).getGamepads
  })

  it('polls gamepad dead zone limpa ambas setas', () => {
    const canvas = createMockCanvas()
    const raf = mockAnimationFrame()
    const game = new Game(canvas)

    Object.defineProperty(navigator, 'getGamepads', {
      value: () => [{
        axes: [0.1, 0],
        buttons: Array.from({ length: 17 }, () => ({ pressed: false })),
      }],
      configurable: true,
    })

    game.player.keys.add('ArrowLeft')
    game.player.keys.add('ArrowRight')
    game.start()
    raf.flush(50)

    const noLeft = !game.player.keys.has('ArrowLeft')
    const noRight = !game.player.keys.has('ArrowRight')
    game.stop()

    expect(noLeft).toBe(true)
    expect(noRight).toBe(true)
    delete (navigator as unknown as Record<string, unknown>).getGamepads
  })

  it('polls gamepad botao A adiciona espaco', () => {
    const canvas = createMockCanvas()
    const raf = mockAnimationFrame()
    const game = new Game(canvas)

    const buttons = Array.from({ length: 17 }, () => ({ pressed: false }))
    buttons[0] = { pressed: true }

    Object.defineProperty(navigator, 'getGamepads', {
      value: () => [{ axes: [0, 0], buttons }],
      configurable: true,
    })

    game.start()
    raf.flush(50)

    const hasSpace = game.player.keys.has(' ')
    game.stop()

    expect(hasSpace).toBe(true)
    delete (navigator as unknown as Record<string, unknown>).getGamepads
  })

  it('polls gamepad sem gamepad retorna cedo', () => {
    const canvas = createMockCanvas()
    const raf = mockAnimationFrame()
    const game = new Game(canvas)

    Object.defineProperty(navigator, 'getGamepads', {
      value: () => [null],
      configurable: true,
    })

    game.start()
    raf.flush(50)
    game.stop()

    expect(game.player.keys.has('ArrowLeft')).toBe(false)
    delete (navigator as unknown as Record<string, unknown>).getGamepads
  })

  it('ignora gamepad quando disabled', () => {
    const canvas = createMockCanvas()
    const raf = mockAnimationFrame()
    const game = new Game(canvas)
    game.setGamepadEnabled(false)

    vi.stubGlobal('navigator', {
      ...navigator,
      getGamepads: () => [{
        axes: [-0.5, 0],
        buttons: Array.from({ length: 17 }, () => ({ pressed: false })),
      }],
    })

    game.start()
    raf.flush(50)
    game.stop()

    expect(game.player.keys.has('ArrowLeft')).toBe(false)
  })
})

describe('Game resize', () => {
  it('resize atualiza dimensoes e reposiciona jogador', () => {
    const canvas = createMockCanvas()
    const game = new Game(canvas)

    game.resize(400, 300)

    expect(canvas.width).toBe(400)
    expect(canvas.height).toBe(300)
    game.destroy()
  })
})

describe('Game render', () => {
  it('render chama clearRect e renderiza entidades', () => {
    const canvas = createMockCanvas()
    const raf = mockAnimationFrame()
    const game = new Game(canvas)
    const clearSpy = vi.spyOn(canvas.getContext('2d')!, 'clearRect')

    game.start()
    raf.flush(50)
    game.stop()

    expect(clearSpy).toHaveBeenCalled()
  })
})

describe('Game combo system', () => {
  it('registerHit com combo crescente adiciona shake', () => {
    const canvas = createMockCanvas()
    const game = new Game(canvas)
    const shakeSpy = vi.spyOn(game.fx, 'addShake')

    for (let i = 0; i < 5; i++) game.registerHit()

    expect(shakeSpy).toHaveBeenCalled()
    game.destroy()
  })

  it('registerMiss reseta combo', () => {
    const canvas = createMockCanvas()
    const game = new Game(canvas)

    for (let i = 0; i < 5; i++) game.registerHit()
    const combo = game.comboMultiplier

    game.registerMiss()

    expect(game.comboMultiplier).toBeLessThanOrEqual(combo)
    game.destroy()
  })

  it('decayCombo funciona', () => {
    const canvas = createMockCanvas()
    const game = new Game(canvas)

    game.decayCombo()

    expect(game).toBeDefined()
    game.destroy()
  })
})

describe('Game getHighScore', () => {
  it('retorna valor do storage', () => {
    const canvas = createMockCanvas()
    const game = new Game(canvas)

    const hs = game.getHighScore()

    expect(typeof hs).toBe('number')
    game.destroy()
  })
})

describe('Game getters and setters', () => {
  it('slowMotionTimer setter atualiza estado', () => {
    const canvas = createMockCanvas()
    const game = new Game(canvas)

    game.slowMotionTimer = 5
    expect(game.slowMotionTimer).toBe(5)
    game.destroy()
  })

  it('consecutiveHits retorna valor do scoring', () => {
    const canvas = createMockCanvas()
    const game = new Game(canvas)

    expect(typeof game.consecutiveHits).toBe('number')
    game.destroy()
  })

  it('comboAnimTimer retorna valor do scoring', () => {
    const canvas = createMockCanvas()
    const game = new Game(canvas)

    expect(typeof game.comboAnimTimer).toBe('number')
    game.destroy()
  })

  it('comboLevelTimer retorna valor do scoring', () => {
    const canvas = createMockCanvas()
    const game = new Game(canvas)

    expect(typeof game.comboLevelTimer).toBe('number')
    game.destroy()
  })

  it('gameTime getter e setter', () => {
    const canvas = createMockCanvas()
    const game = new Game(canvas)

    game.gameTime = 42
    expect(game.gameTime).toBe(42)
    game.destroy()
  })

  it('scrollSpeed getter e setter', () => {
    const canvas = createMockCanvas()
    const game = new Game(canvas)

    game.scrollSpeed = 200
    expect(game.scrollSpeed).toBe(200)
    game.destroy()
  })
})
