import { useEffect, useRef, useCallback, useState } from 'react'
import type { Game as GameInstance } from '@/game/Game'
import type { IntroStage } from '@/game/IntroCinematic'
import SwipeControls from './SwipeControls'
import TouchControls from './TouchControls'
import { FloatingJoystick } from './FloatingJoystick'
import type { GameSettings } from '@/game/SettingsService'
import type { AchievementId } from '@/game/AchievementService'
import { createSeededRandom } from '@/game/random'
import { getStrings } from '@/i18n'

import type { GameModeId } from '@/game/GameMode'

interface GameCanvasProps {
  onGameOver: (score: number, highScore: number) => void
  onAchievementUnlocked?: (id: AchievementId, title: string, description: string) => void
  settings: GameSettings
  mode?: GameModeId
  /** When set, the run is deterministic (daily challenge); otherwise Math.random. */
  seed?: number
  /** Abre a partida com a cinemática de abertura (lido só na criação do jogo). */
  intro?: boolean
}

/** Push every persisted preference into a freshly created engine instance. */
function applyGameSettings(game: GameInstance, settings: GameSettings): void {
  game.setReducedMotion(settings.reducedMotion)
  game.setWeatherEnabled(settings.weatherEffects)
  game.setLightingEnabled(settings.dynamicLighting)
  game.setGhostReplayEnabled(settings.ghostReplay)
  game.setMasterVolume(settings.masterVolume)
  game.setMusicVolume(settings.musicVolume)
  game.setSfxVolume(settings.sfxVolume)
  game.setVoiceVolume(settings.voiceVolume)
  game.setVoiceEnabled(settings.voiceEnabled)
  game.setGamepadEnabled(settings.gamepadEnabled)
  game.setHapticsEnabled(settings.hapticsEnabled)
  game.setKeybindings(settings.keybindings)
  game.setObjectiveBalanceProfile(settings.objectiveBalanceProfile)
  game.setDifficulty(settings.difficulty)
  game.setColorblind(settings.colorblindMode)
  game.setLocale(getStrings(settings.language))
  game.setLanguage(settings.language)
  const isMuted = game.sound.isMuted()
  if (settings.muted !== isMuted) {
    game.sound.toggleMute()
  }
}

export default function GameCanvas({ onGameOver, onAchievementUnlocked, settings, mode = 'classic', seed, intro = false }: GameCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const rootRef = useRef<HTMLDivElement>(null)
  const gameRef = useRef<GameInstance | null>(null)
  const initialObjectiveProfileRef = useRef(settings.objectiveBalanceProfile)
  const seedRef = useRef(seed)
  // A cena rola o rio e consome o RNG do mundo: nunca numa partida com seed.
  const introRef = useRef(intro && seed == null)
  const [introStage, setIntroStage] = useState<IntroStage | null>(null)
  // Latest settings without forcing the engine to be recreated on every change.
  const settingsRef = useRef(settings)
  useEffect(() => {
    settingsRef.current = settings
  })

  const handleSwipePosition = useCallback((x: number | null, y: number | null) => {
    gameRef.current?.setTouchPosition(x, y)
  }, [])

  const handlePause = useCallback(() => {
    gameRef.current?.togglePause()
  }, [])

  const handleMute = useCallback(() => {
    gameRef.current?.sound.toggleMute()
  }, [])

  const handleFireDown = useCallback(() => {
    gameRef.current?.simulateKey(' ', true)
  }, [])

  const handleFireUp = useCallback(() => {
    gameRef.current?.simulateKey(' ', false)
  }, [])

  const handleOverdrive = useCallback(() => {
    gameRef.current?.activateOverdrive()
  }, [])

  const handleSkipIntro = useCallback(() => {
    gameRef.current?.skipIntro()
  }, [])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    let cancelled = false
    let game: GameInstance | null = null

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      if (gameRef.current) {
        gameRef.current.resize(window.innerWidth, window.innerHeight, dpr)
      } else {
        // Antes do Game existir, dimensiona em pixels CSS: o construtor usa
        // `canvas.width` para criar mundo, jogador e cenário, e não conhece o
        // DPR. Com pixels de dispositivo (2x num retina) o rio nascia centrado
        // no dobro da largura visível — fora da tela. O `resize()` logo após a
        // criação reaplica o DPR.
        canvas.width = Math.floor(window.innerWidth)
        canvas.height = Math.floor(window.innerHeight)
      }
    }

    resize()

    // O engine sai do chunk inicial do menu: só carrega quando uma partida
    // começa. A Promise também cobre o StrictMode, que monta/desmonta efeitos
    // duas vezes em desenvolvimento.
    const boot = async () => {
      const { Game } = await import('@/game/Game')
      if (cancelled) return

      const rng = seedRef.current != null ? createSeededRandom(seedRef.current) : Math.random
      const instance = new Game(canvas, rng, initialObjectiveProfileRef.current)
      game = instance
      instance.setGameMode(mode)
      gameRef.current = instance
      resize()
      applyGameSettings(instance, settingsRef.current)
      instance.setOnGameOver((score, highScore) => {
        onGameOver(score, highScore)
      })
      if (onAchievementUnlocked) {
        instance.setOnAchievementUnlocked(onAchievementUnlocked)
      }
      // O estágio da cinemática vira um atributo no container; o CSS esconde os
      // controles touch e o botão de pular só existe durante a cena.
      instance.setOnIntroStageChange((stage) => {
        // Depois que o jogador assume, recriar o jogo não repete a cena.
        if (stage !== 'cinematic') introRef.current = false
        setIntroStage(stage)
        const root = rootRef.current
        if (!root) return
        if (stage === 'done') delete root.dataset.intro
        else root.dataset.intro = stage
      })
      if (introRef.current) instance.playIntro()
      instance.start()

      window.addEventListener('resize', resize)
    }

    void boot()

    return () => {
      cancelled = true
      window.removeEventListener('resize', resize)
      game?.destroy()
      if (gameRef.current === game) gameRef.current = null
    }
  }, [onGameOver, onAchievementUnlocked, mode, settings.ghostReplay])

  useEffect(() => {
    if (!gameRef.current) return
    applyGameSettings(gameRef.current, settings)
  }, [settings])

  // Mesmo critério do CSS dos controles touch: sem teclado, o HUD não desenha
  // os atalhos — eles ficavam por baixo dos botões de pausa/mudo.
  useEffect(() => {
    const query = window.matchMedia('(pointer: coarse), (hover: none)')
    const apply = () => gameRef.current?.setTouchMode(query.matches)
    apply()
    query.addEventListener('change', apply)
    return () => query.removeEventListener('change', apply)
  }, [settings])

  const renderMobileControls = () => {
    switch (settings.mobileControlMode) {
      case 'joystick':
        return (
          <FloatingJoystick
            onMove={(vec) => gameRef.current?.setAnalogVector(vec.x, vec.y)}
            onFire={(firing) => gameRef.current?.setTouchShoot(firing)}
            onOverdrive={handleOverdrive}
            onPause={handlePause}
            onMute={handleMute}
          />
        )
      case 'dpad':
        return (
          <TouchControls
            onKey={(key, down) => gameRef.current?.simulateKey(key, down)}
            onPause={handlePause}
            onMute={handleMute}
          />
        )
      case 'swipe':
      default:
        return (
          <SwipeControls
            onSetPosition={handleSwipePosition}
            onPause={handlePause}
            onMute={handleMute}
            onFireDown={handleFireDown}
            onFireUp={handleFireUp}
            onOverdrive={handleOverdrive}
            fireLabel={getStrings(settings.language).menuLabelFire}
          />
        )
    }
  }

  return (
    <div ref={rootRef} className="game-root" style={{ position: 'relative', width: '100%', height: '100%' }}>
      <canvas
        ref={canvasRef}
        style={{ display: 'block', width: '100%', height: '100%' }}
      />
      <div className="game-controls-layer">{renderMobileControls()}</div>
      {introStage === 'cinematic' && (
        <button type="button" className="intro-skip" onClick={handleSkipIntro}>
          <span className="key-badge intro-skip-key">ENTER</span>
          {getStrings(settings.language).introSkip}
          <span className="intro-skip-arrows" aria-hidden="true">▸▸</span>
        </button>
      )}
    </div>
  )
}
