import { useEffect, useRef, useCallback } from 'react'
import { Game } from '@/game/Game'
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
}

export default function GameCanvas({ onGameOver, onAchievementUnlocked, settings, mode = 'classic', seed }: GameCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const gameRef = useRef<Game | null>(null)
  const initialObjectiveProfileRef = useRef(settings.objectiveBalanceProfile)
  const seedRef = useRef(seed)

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

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

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

    const rng = seedRef.current != null ? createSeededRandom(seedRef.current) : Math.random
    const game = new Game(canvas, rng, initialObjectiveProfileRef.current)
    game.setGameMode(mode)
    game.setGhostReplayEnabled(settings.ghostReplay)
    gameRef.current = game
    resize()
    game.setOnGameOver((score, highScore) => {
      onGameOver(score, highScore)
    })
    if (onAchievementUnlocked) {
      game.setOnAchievementUnlocked(onAchievementUnlocked)
    }
    game.start()

    window.addEventListener('resize', resize)

    return () => {
      window.removeEventListener('resize', resize)
      game.destroy()
      gameRef.current = null
    }
  }, [onGameOver, onAchievementUnlocked, mode, settings.ghostReplay])

  useEffect(() => {
    if (!gameRef.current) return
    gameRef.current.setReducedMotion(settings.reducedMotion)
    gameRef.current.setWeatherEnabled(settings.weatherEffects)
    gameRef.current.setLightingEnabled(settings.dynamicLighting)
    gameRef.current.setGhostReplayEnabled(settings.ghostReplay)
    gameRef.current.setMasterVolume(settings.masterVolume)
    gameRef.current.setMusicVolume(settings.musicVolume)
    gameRef.current.setSfxVolume(settings.sfxVolume)
    gameRef.current.setVoiceVolume(settings.voiceVolume)
    gameRef.current.setVoiceEnabled(settings.voiceEnabled)
    gameRef.current.setGamepadEnabled(settings.gamepadEnabled)
    gameRef.current.setHapticsEnabled(settings.hapticsEnabled)
    gameRef.current.setKeybindings(settings.keybindings)
    gameRef.current.setObjectiveBalanceProfile(settings.objectiveBalanceProfile)
    gameRef.current.setDifficulty(settings.difficulty)
    gameRef.current.setColorblind(settings.colorblindMode)
    gameRef.current.setLocale(getStrings(settings.language))
    gameRef.current.setLanguage(settings.language)
    const isMuted = gameRef.current.sound.isMuted()
    if (settings.muted !== isMuted) {
      gameRef.current.sound.toggleMute()
    }
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
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      <canvas
        ref={canvasRef}
        style={{ display: 'block', width: '100%', height: '100%' }}
      />
      {renderMobileControls()}
    </div>
  )
}
