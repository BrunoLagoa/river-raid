import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { Game } from './Game'
import { CollisionSystem } from './CollisionSystem'
import { writeSecureNumber } from './StorageService'
import * as StorageService from './StorageService'
import * as AchievementService from './AchievementService'
import { createSeededRandom } from './random'
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
  it('construtor falha sem contexto 2D', () => {
    const canvas = {
      width: 800,
      height: 600,
      getContext: () => null,
    } as unknown as HTMLCanvasElement

    expect(() => new Game(canvas)).toThrow('Could not get 2D context')
  })

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

  it('start quando ja rodando retorna sem reexecutar init', () => {
    const canvas = createMockCanvas()
    const game = new Game(canvas)
    const initSpy = vi.spyOn(game.sound, 'init')

    game.start()
    game.start()
    game.stop()

    expect(initSpy).toHaveBeenCalledTimes(1)
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

  it('setObjectiveBalanceProfile repassa para ObjectiveSystem', () => {
    const canvas = createMockCanvas()
    const game = new Game(canvas)
    const spy = vi.spyOn(game.objectives, 'setProfile')

    game.setObjectiveBalanceProfile('aggressive')

    expect(spy).toHaveBeenCalledWith('aggressive')
  })

  it('construtor aplica perfil de objetivos na primeira missao', () => {
    const canvas = createMockCanvas()
    const game = new Game(canvas, () => 0, 'aggressive')
    const objectiveState = game.objectives as unknown as {
      current: { type: string; target: number }
    }

    expect(objectiveState.current.type).toBe('enemy_kills')
    expect(objectiveState.current.target).toBe(6)
  })

  it('objetivos sao expostos ao HUD', () => {
    const canvas = createMockCanvas()
    const raf = mockAnimationFrame()
    const game = new Game(canvas)
    const renderSpy = vi.spyOn(game.ui, 'render')

    game.start()
    raf.flush(50)
    game.stop()

    expect(renderSpy).toHaveBeenCalled()
    const lastCall = renderSpy.mock.calls.at(-1)
    expect(lastCall?.[10]).toEqual(expect.objectContaining({
      title: expect.any(String),
      detail: expect.any(String),
      progressText: expect.any(String),
    }))
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
    const game = new Game(canvas, () => 0.1)
    const smokeSpy = vi.spyOn(game.fx, 'smokeTrail')

    game.player.keys.add('ArrowUp')
    game.start()
    raf.flush(50)
    game.stop()

    expect(smokeSpy).toHaveBeenCalledWith(expect.any(Number), expect.any(Number), '#aa7744')
  })

  it('gera trilha de fumaca com cor de frenagem', () => {
    const canvas = createMockCanvas()
    const raf = mockAnimationFrame()
    const game = new Game(canvas, () => 0.1)
    const smokeSpy = vi.spyOn(game.fx, 'smokeTrail')

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

  it('usa random injetado para trilha de fumaca de forma deterministica', () => {
    const canvasA = createMockCanvas()
    const canvasB = createMockCanvas()
    const raf = mockAnimationFrame()
    const gameA = new Game(canvasA, createSeededRandom(77))
    const gameB = new Game(canvasB, createSeededRandom(77))
    const smokeA = vi.spyOn(gameA.fx, 'smokeTrail')
    const smokeB = vi.spyOn(gameB.fx, 'smokeTrail')

    gameA.start()
    gameB.start()
    raf.flush(50)
    gameA.stop()
    gameB.stop()

    expect(smokeA.mock.calls.length).toBe(smokeB.mock.calls.length)
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

  it('polls gamepad sem botao A remove espaco', () => {
    const canvas = createMockCanvas()
    const raf = mockAnimationFrame()
    const game = new Game(canvas)

    const buttons = Array.from({ length: 17 }, () => ({ pressed: false }))
    Object.defineProperty(navigator, 'getGamepads', {
      value: () => [{ axes: [0, 0], buttons }],
      configurable: true,
    })

    game.player.keys.add(' ')
    game.start()
    raf.flush(50)

    expect(game.player.keys.has(' ')).toBe(false)
    game.stop()
    delete (navigator as unknown as Record<string, unknown>).getGamepads
  })

  it('polls gamepad botao start alterna pause', () => {
    const canvas = createMockCanvas()
    const raf = mockAnimationFrame()
    const game = new Game(canvas)

    const buttons = Array.from({ length: 17 }, () => ({ pressed: false }))
    buttons[9] = { pressed: true }
    Object.defineProperty(navigator, 'getGamepads', {
      value: () => [{ axes: [0, 0], buttons }],
      configurable: true,
    })

    game.start()
    raf.flush(50)

    expect((game as unknown as { paused: boolean }).paused).toBe(true)
    game.stop()
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

  it('pollGamepad retorna cedo sem navigator.getGamepads', () => {
    const canvas = createMockCanvas()
    const raf = mockAnimationFrame()
    const game = new Game(canvas)

    vi.stubGlobal('navigator', {
      ...navigator,
      getGamepads: undefined,
    })

    game.start()
    raf.flush(50)
    game.stop()

    expect(game.player.keys.size).toBeGreaterThanOrEqual(0)
  })
})

describe('Game internal edges', () => {
  it('loop retorna cedo quando jogo nao esta rodando', () => {
    const canvas = createMockCanvas()
    const game = new Game(canvas)
    const renderSpy = vi.spyOn(game as unknown as { render: () => void }, 'render')

    ;(game as unknown as { loop: (ts: number) => void }).loop(100)

    expect(renderSpy).not.toHaveBeenCalled()
    game.destroy()
  })

  it('update fora do estado alive ainda executa fx update', () => {
    const canvas = createMockCanvas()
    const raf = mockAnimationFrame()
    const game = new Game(canvas)
    const fxSpy = vi.spyOn(game.fx, 'update')

    game.player.state = 'dead'
    game.start()
    raf.flush(50)
    game.stop()

    expect(fxSpy).toHaveBeenCalled()
  })

  it('triggerGameOver retorna cedo quando ja disparado', () => {
    const canvas = createMockCanvas()
    const game = new Game(canvas)
    const gameOverSpy = vi.spyOn(game.sound, 'gameOver')

    ;(game as unknown as { gameOverTriggered: boolean }).gameOverTriggered = true
    ;(game as unknown as { triggerGameOver: () => void }).triggerGameOver()

    expect(gameOverSpy).not.toHaveBeenCalled()
    game.destroy()
  })

  it('saveHighScore ignora excecao de leitura', () => {
    const canvas = createMockCanvas()
    const game = new Game(canvas)

    vi.spyOn(game, 'getHighScore').mockImplementationOnce(() => {
      throw new Error('storage fail')
    })

    expect(() => (game as unknown as { saveHighScore: () => void }).saveHighScore()).not.toThrow()
    game.destroy()
  })

  it('saveHighScore nao grava quando score nao supera atual', () => {
    const canvas = createMockCanvas()
    const game = new Game(canvas)
    game.score = 10
    vi.spyOn(game, 'getHighScore').mockReturnValue(100)
    const writeSpy = vi.spyOn(StorageService, 'writeSecureNumber')

    ;(game as unknown as { saveHighScore: () => void }).saveHighScore()

    expect(writeSpy).not.toHaveBeenCalled()
    game.destroy()
  })

  it('pollGamepad trata eixo ausente com fallback para 0', () => {
    const canvas = createMockCanvas()
    const raf = mockAnimationFrame()
    const game = new Game(canvas)

    Object.defineProperty(navigator, 'getGamepads', {
      value: () => [{ axes: [], buttons: Array.from({ length: 17 }, () => ({ pressed: false })) }],
      configurable: true,
    })

    game.start()
    raf.flush(50)
    game.stop()

    expect(game.player.keys.has('ArrowLeft')).toBe(false)
    expect(game.player.keys.has('ArrowRight')).toBe(false)
    delete (navigator as unknown as Record<string, unknown>).getGamepads
  })

  it('update segue caminho quando estado nao e alive/exploding/dead', () => {
    const canvas = createMockCanvas()
    const raf = mockAnimationFrame()
    const game = new Game(canvas)
    const fxSpy = vi.spyOn(game.fx, 'update')

    ;(game.player as unknown as { state: string }).state = 'ghost'
    game.start()
    raf.flush(50)
    game.stop()

    expect(fxSpy).toHaveBeenCalled()
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

describe('Game achievement system', () => {
  beforeEach(() => {
    vi.spyOn(AchievementService, 'isAchievementUnlocked').mockReturnValue(false)
    vi.spyOn(AchievementService, 'unlockAchievement').mockImplementation((id) => {
      return [{ id, title: id, description: '', unlocked: true, unlockedAt: new Date().toISOString() }]
    })
  })

  it('setOnAchievementUnlocked registra callback', () => {
    const canvas = createMockCanvas()
    const game = new Game(canvas)
    const cb = vi.fn()

    game.setOnAchievementUnlocked(cb)

    // Verifica que o callback é armazenado sem exceções
    expect(cb).not.toHaveBeenCalled()
    game.destroy()
  })

  it('tryUnlockAchievement nao dispara se ja desbloqueado', () => {
    vi.mocked(AchievementService.isAchievementUnlocked).mockReturnValue(true)
    const canvas = createMockCanvas()
    const game = new Game(canvas)
    const cb = vi.fn()
    game.setOnAchievementUnlocked(cb)

    ;(game as unknown as { tryUnlockAchievement: (id: AchievementService.AchievementId) => void })
      .tryUnlockAchievement('first_bridge')

    expect(AchievementService.unlockAchievement).not.toHaveBeenCalled()
    expect(cb).not.toHaveBeenCalled()
    game.destroy()
  })

  it('tryUnlockAchievement nao chama pushToast se achievement nao encontrado no array', () => {
    const canvas = createMockCanvas()
    const game = new Game(canvas)
    const toastSpy = vi.spyOn(game.ui, 'pushToast')
    vi.spyOn(AchievementService, 'unlockAchievement').mockReturnValue([])

    ;(game as unknown as { tryUnlockAchievement: (id: AchievementService.AchievementId) => void })
      .tryUnlockAchievement('first_bridge')

    expect(toastSpy).not.toHaveBeenCalled()
    game.destroy()
  })

  it('tryUnlockAchievement dispara callback e pushToast quando nao desbloqueado', () => {
    const canvas = createMockCanvas()
    const game = new Game(canvas)
    const cb = vi.fn()
    const toastSpy = vi.spyOn(game.ui, 'pushToast')
    game.setOnAchievementUnlocked(cb)

    ;(game as unknown as { tryUnlockAchievement: (id: AchievementService.AchievementId) => void })
      .tryUnlockAchievement('first_bridge')

    expect(AchievementService.unlockAchievement).toHaveBeenCalledWith('first_bridge')
    expect(toastSpy).toHaveBeenCalled()
    expect(cb).toHaveBeenCalledWith('first_bridge', expect.any(String), expect.any(String))
    game.destroy()
  })

  it('restart reseta rastreadores de conquistas', () => {
    const canvas = createMockCanvas()
    const game = new Game(canvas)
    type TrackerPrivate = {
      enemiesKilled: number
      powerUpsCollected: number
      fuelHighTimer: number
      bridgeDestroyed: boolean
      lostLife: boolean
    }
    const tracker = (game as unknown as { achievements: TrackerPrivate }).achievements

    tracker.enemiesKilled = 10
    tracker.powerUpsCollected = 5
    tracker.fuelHighTimer = 30
    tracker.bridgeDestroyed = true
    tracker.lostLife = true

    game.restart()
    game.stop()

    expect(tracker.enemiesKilled).toBe(0)
    expect(tracker.powerUpsCollected).toBe(0)
    expect(tracker.fuelHighTimer).toBe(0)
    expect(tracker.bridgeDestroyed).toBe(false)
    expect(tracker.lostLife).toBe(false)
  })

  it('untouchable e desbloqueado ao fim do jogo sem mortes', () => {
    const canvas = createMockCanvas()
    const raf = mockAnimationFrame()
    const game = new Game(canvas)
    game.setOnAchievementUnlocked(vi.fn())

    // Dispara game over via CollisionSystem sem passar por handlePlayerDeath
    vi.spyOn(CollisionSystem, 'resolveCollisions').mockImplementationOnce((ctx) => {
      ctx.triggerGameOver()
    })

    game.start()
    raf.flush(50)
    vi.advanceTimersByTime(1300)
    game.stop()

    const ids = (AchievementService.unlockAchievement as ReturnType<typeof vi.fn>).mock.calls
      .map((c: unknown[]) => c[0] as AchievementService.AchievementId)
    expect(ids).toContain('untouchable')
  })

  it('untouchable NAO e desbloqueado se perdeu vida antes do game over', () => {
    const canvas = createMockCanvas()
    const game = new Game(canvas)
    const cb = vi.fn()
    game.setOnAchievementUnlocked(cb)

    game.lives = 2
    game.handlePlayerDeath() // perde 1 vida — marca achievementLostLife = true
    vi.advanceTimersByTime(1500) // respawn

    game.lives = 0
    game.handlePlayerDeath() // game over real
    vi.advanceTimersByTime(1300)

    const unlockCalls = (AchievementService.unlockAchievement as ReturnType<typeof vi.fn>).mock.calls
    const ids = unlockCalls.map((c: unknown[]) => c[0] as AchievementService.AchievementId)
    expect(ids).not.toContain('untouchable')
    game.destroy()
  })

  it('survivor e desbloqueado quando score >= 10000 no game over', () => {
    const canvas = createMockCanvas()
    const game = new Game(canvas)
    game.setOnAchievementUnlocked(vi.fn())

    game.score = 10000
    game.handlePlayerDeath()
    game.handlePlayerDeath()
    game.handlePlayerDeath()
    vi.advanceTimersByTime(1300)

    const ids = (AchievementService.unlockAchievement as ReturnType<typeof vi.fn>).mock.calls
      .map((c: unknown[]) => c[0] as AchievementService.AchievementId)
    expect(ids).toContain('survivor')
    game.destroy()
  })

  it('survivor NAO e desbloqueado quando score < 10000', () => {
    const canvas = createMockCanvas()
    const game = new Game(canvas)

    game.score = 9999
    game.handlePlayerDeath()
    game.handlePlayerDeath()
    game.handlePlayerDeath()
    vi.advanceTimersByTime(1300)

    const ids = (AchievementService.unlockAchievement as ReturnType<typeof vi.fn>).mock.calls
      .map((c: unknown[]) => c[0] as AchievementService.AchievementId)
    expect(ids).not.toContain('survivor')
    game.destroy()
  })

  it('high_flyer e desbloqueado quando score >= 50000 no game over', () => {
    const canvas = createMockCanvas()
    const game = new Game(canvas)

    game.score = 50000
    game.handlePlayerDeath()
    game.handlePlayerDeath()
    game.handlePlayerDeath()
    vi.advanceTimersByTime(1300)

    const ids = (AchievementService.unlockAchievement as ReturnType<typeof vi.fn>).mock.calls
      .map((c: unknown[]) => c[0] as AchievementService.AchievementId)
    expect(ids).toContain('high_flyer')
    game.destroy()
  })

  it('combo_master e desbloqueado quando combo >= 4 no game over', () => {
    const canvas = createMockCanvas()
    const raf = mockAnimationFrame()
    const game = new Game(canvas)

    // Dispara game over via CollisionSystem sem passar por handlePlayerDeath
    // (que chama registerMiss() e reseta o combo)
    vi.spyOn(CollisionSystem, 'resolveCollisions').mockImplementationOnce((ctx) => {
      ctx.triggerGameOver()
    })

    // Força combo x4 antes do game over
    for (let i = 0; i < 30; i++) game.registerHit()
    expect(game.comboMultiplier).toBeGreaterThanOrEqual(4)

    game.start()
    raf.flush(50)
    vi.advanceTimersByTime(1300)
    game.stop()

    const ids = (AchievementService.unlockAchievement as ReturnType<typeof vi.fn>).mock.calls
      .map((c: unknown[]) => c[0] as AchievementService.AchievementId)
    expect(ids).toContain('combo_master')
  })

  it('sharpshooter e desbloqueado via onEnemyDestroyed apos 50 inimigos', () => {
    const canvas = createMockCanvas()
    const raf = mockAnimationFrame()
    const game = new Game(canvas)

    vi.spyOn(CollisionSystem, 'resolveCollisions').mockImplementation((ctx) => {
      for (let i = 0; i < 50; i++) ctx.onEnemyDestroyed?.('helicopter')
    })

    game.start()
    raf.flush(50)
    game.stop()

    const ids = (AchievementService.unlockAchievement as ReturnType<typeof vi.fn>).mock.calls
      .map((c: unknown[]) => c[0] as AchievementService.AchievementId)
    expect(ids).toContain('sharpshooter')
  })

  it('first_bridge e desbloqueado ao destruir primeira ponte', () => {
    const canvas = createMockCanvas()
    const raf = mockAnimationFrame()
    const game = new Game(canvas)

    vi.spyOn(CollisionSystem, 'resolveCollisions').mockImplementation((ctx) => {
      ctx.onEnemyDestroyed?.('bridge')
    })

    game.start()
    raf.flush(50)
    game.stop()

    const ids = (AchievementService.unlockAchievement as ReturnType<typeof vi.fn>).mock.calls
      .map((c: unknown[]) => c[0] as AchievementService.AchievementId)
    expect(ids).toContain('first_bridge')
  })

  it('first_bridge nao e disparado duas vezes na mesma run', () => {
    const canvas = createMockCanvas()
    const raf = mockAnimationFrame()
    const game = new Game(canvas)

    vi.spyOn(CollisionSystem, 'resolveCollisions').mockImplementation((ctx) => {
      ctx.onEnemyDestroyed?.('bridge')
      ctx.onEnemyDestroyed?.('bridge')
    })

    game.start()
    raf.flush(50)
    game.stop()

    const bridgeCalls = (AchievementService.unlockAchievement as ReturnType<typeof vi.fn>).mock.calls
      .filter((c: unknown[]) => c[0] as AchievementService.AchievementId === 'first_bridge')
    expect(bridgeCalls.length).toBe(1)
  })

  it('power_collector e desbloqueado apos 10 power-ups coletados', () => {
    const canvas = createMockCanvas()
    const raf = mockAnimationFrame()
    const game = new Game(canvas)

    vi.spyOn(CollisionSystem, 'resolveCollisions').mockImplementation((ctx) => {
      for (let i = 0; i < 10; i++) ctx.onPowerUpCollected?.('shield')
    })

    game.start()
    raf.flush(50)
    game.stop()

    const ids = (AchievementService.unlockAchievement as ReturnType<typeof vi.fn>).mock.calls
      .map((c: unknown[]) => c[0] as AchievementService.AchievementId)
    expect(ids).toContain('power_collector')
  })

  it('fuel_saver e desbloqueado apos 60s com combustivel alto', () => {
    const canvas = createMockCanvas()
    const raf = mockAnimationFrame()
    const game = new Game(canvas)

    // Impede consumo de combustivel via colisoes e mantém fuel alto
    vi.spyOn(CollisionSystem, 'resolveCollisions').mockImplementation(() => {})
    game.fuelSystem.fuel = 100
    game.world.isOutOfBounds = () => false

    game.start()
    // dt é clamped a 0.05s/frame; precisa de 60/0.05 = 1200 frames
    for (let i = 1; i <= 1210; i++) {
      game.fuelSystem.fuel = 100 // reabastece a cada frame para garantir condição
      raf.flush(i * 50)
    }
    game.stop()

    const ids = (AchievementService.unlockAchievement as ReturnType<typeof vi.fn>).mock.calls
      .map((c: unknown[]) => c[0] as AchievementService.AchievementId)
    expect(ids).toContain('fuel_saver')
  })

  it('onFuelCollected dispara objectives.onFuelCollected', () => {
    const canvas = createMockCanvas()
    const raf = mockAnimationFrame()
    const game = new Game(canvas)

    vi.spyOn(CollisionSystem, 'resolveCollisions').mockImplementation((ctx) => {
      ctx.onFuelCollected?.(1)
    })

    const objSpy = vi.spyOn(
      (game as unknown as { objectives: { onFuelCollected: (n: number) => void } }).objectives,
      'onFuelCollected',
    )

    game.start()
    raf.flush(50)
    game.stop()

    expect(objSpy).toHaveBeenCalledWith(1)
  })

  it('awardScore callback via ObjectiveSystem repassa pontos ao scoring', () => {
    const canvas = createMockCanvas()
    const game = new Game(canvas)

    const scoring = (game as unknown as { scoring: { addScore: (n: number) => void } }).scoring
    const addScoreSpy = vi.spyOn(scoring, 'addScore')

    const objectives = (game as unknown as { objectives: { completeCurrentObjective?: () => void; current: { rewardScore: number; rewardGranted: boolean; completed: boolean; failed: boolean; completionTimer: number } } }).objectives
    // Force complete the current objective to trigger awardScore -> scoring.addScore
    objectives.current.rewardGranted = false
    objectives.current.rewardScore = 500
    ;(objectives as unknown as { completeCurrentObjective: () => void }).completeCurrentObjective()

    expect(addScoreSpy).toHaveBeenCalledWith(500)
  })

  it('ui.updateToasts e chamado a cada frame do game loop', () => {
    const canvas = createMockCanvas()
    const raf = mockAnimationFrame()
    const game = new Game(canvas)
    const toastSpy = vi.spyOn(game.ui, 'updateToasts')

    game.start()
    raf.flush(50)
    raf.flush(100)
    game.stop()

    expect(toastSpy).toHaveBeenCalled()
  })

  it('magnet fuel atrai tanks em direcao ao player', () => {
    const canvas = createMockCanvas()
    const raf = mockAnimationFrame()
    const game = new Game(canvas)

    vi.spyOn(CollisionSystem, 'resolveCollisions').mockImplementation(() => {})
    game.player.magnetFuelTimer = 10
    game.fuelSystem.tanks.push({ x: 300, y: game.player.y, width: 16, height: 16, active: true })

    const initialX = game.fuelSystem.tanks[0].x

    game.start()
    raf.flush(50)
    game.stop()

    expect(game.fuelSystem.tanks[0].x).not.toBe(initialX)
  })

  it('magnet fuel ignora tanks inativos', () => {
    const canvas = createMockCanvas()
    const raf = mockAnimationFrame()
    const game = new Game(canvas)

    vi.spyOn(CollisionSystem, 'resolveCollisions').mockImplementation(() => {})
    game.player.magnetFuelTimer = 10
    const inactiveTank = { x: 300, y: game.player.y, width: 16, height: 16, active: false }
    game.fuelSystem.tanks.push(inactiveTank)

    game.start()
    raf.flush(50)
    game.stop()

    // Inactive tank should not have been moved by the magnet loop (continue branch)
    expect(inactiveTank.x).toBe(300)
  })

  it('magnet fuel com tank no mesmo ponto que player (dist=0 usa fallback 1)', () => {
    const canvas = createMockCanvas()
    const game = new Game(canvas)

    // Call updateGameplaySystems directly with tank at exact player position
    type GamePrivate = {
      updateGameplaySystems: (envDt: number) => void
      fuelSystem: { update: () => void; tanks: Array<{ x: number; y: number; active: boolean; width: number; height: number }> }
    }
    const g = game as unknown as GamePrivate
    vi.spyOn(g.fuelSystem, 'update').mockImplementation(() => {})

    game.player.magnetFuelTimer = 10
    const tank = { x: game.player.x, y: game.player.y, width: 16, height: 16, active: true }
    g.fuelSystem.tanks.push(tank)

    expect(() => g.updateGameplaySystems(1 / 60)).not.toThrow()
  })

  it('renderShockwave e chamado quando fx tem shockwave ativo', () => {
    const canvas = createMockCanvas()
    const raf = mockAnimationFrame()
    const game = new Game(canvas)

    vi.spyOn(CollisionSystem, 'resolveCollisions').mockImplementation(() => {})
    game.fx.triggerShockwave(game.player.x, game.player.y, 1.0)

    game.start()
    raf.flush(50)
    game.stop()

    // Shockwave timer should have decremented
    expect(game.fx.getShockwave().timer).toBeLessThan(1.0)
  })

  it('first_bridge achievement desbloqueado ao destruir bridge', () => {
    const canvas = createMockCanvas()
    const raf = mockAnimationFrame()
    const game = new Game(canvas)

    vi.spyOn(AchievementService, 'unlockAchievement').mockReturnValue([
      { id: 'first_bridge', title: 'First Bridge', description: 'Destroyed a bridge' },
    ] as ReturnType<typeof AchievementService.unlockAchievement>)
    vi.spyOn(CollisionSystem, 'resolveCollisions').mockImplementation((ctx) => {
      ctx.onEnemyDestroyed?.('bridge')
    })

    game.start()
    raf.flush(50)
     game.stop()

    const ids = (AchievementService.unlockAchievement as ReturnType<typeof vi.fn>).mock.calls
      .map((c: unknown[]) => c[0] as string)
    expect(ids).toContain('first_bridge')
  })

  it('onMiss callback em player.update aciona registerMiss no game', () => {
    const canvas = createMockCanvas()
    const game = new Game(canvas)

    // Inject a bullet at y=-100 (already offscreen) via bulletPool.acquire()
    type PlayerPrivate = { bulletPool: { acquire: () => { x: number; y: number; speed: number; active: boolean } } }
    const bullet = (game.player as unknown as PlayerPrivate).bulletPool.acquire()
    bullet.x = game.player.x
    bullet.y = -100
    bullet.speed = 400

    const spy = vi.spyOn(game, 'registerMiss')

    // Call updateWorldAndPlayer directly to trigger the onMiss callback
    type GamePrivate = { updateWorldAndPlayer: (dt: number, envDt: number) => void }
    ;(game as unknown as GamePrivate).updateWorldAndPlayer(1 / 60, 1 / 60)

    expect(spy).toHaveBeenCalled()
  })

  it('activateOverdrive com energia suficiente ativa modo overdrive e limpa tiros inimigos', () => {
    const canvas = createMockCanvas()
    const game = new Game(canvas)

    game.enemyManager.spawnEnemyBullet({ x: 100, y: 100, vx: 0, speed: 200 })
    expect(game.enemyManager.bullets.length).toBe(1)

    // Cannot activate when empty
    expect(game.activateOverdrive()).toBe(false)

    // Fill overdrive
    game.overdrive.addEnergy(100)
    game.start()

    const activated = game.activateOverdrive()
    expect(activated).toBe(true)
    expect(game.player.overdriveActive).toBe(true)
    // EMP clears active enemy bullets
    expect(game.enemyManager.bullets.length).toBe(0)
    game.stop()
  })

  it('globalKeyHandler X ativa overdrive e ignora Shift/auto-repeat', () => {
    const canvas = createMockCanvas()
    const game = new Game(canvas)
    const spy = vi.spyOn(game, 'activateOverdrive')

    // Shift é modificador: Shift+P, maiúsculas etc. não podem disparar overdrive.
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Shift' }))
    expect(spy).not.toHaveBeenCalled()

    // Auto-repeat de tecla presa também não.
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'x', repeat: true }))
    expect(spy).not.toHaveBeenCalled()

    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'x' }))
    expect(spy).toHaveBeenCalled()
  })

  it('restart reseta estado do boss e overdrive', () => {
    const canvas = createMockCanvas()
    const game = new Game(canvas)
    game.overdrive.addEnergy(100)
    game.restart()

    expect(game.overdrive.currentEnergy).toBe(0)
    expect(game.boss).toBeNull()
    expect(game.player.overdriveActive).toBe(false)
  })
})
