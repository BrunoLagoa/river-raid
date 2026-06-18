import { useEffect, useRef, useCallback } from 'react'
import { Game } from '@/game/Game'
import SwipeControls from './SwipeControls'
import type { GameSettings } from '@/game/SettingsService'
import type { AchievementId } from '@/game/AchievementService'
import { getStrings } from '@/i18n'

interface GameCanvasProps {
  onGameOver: (score: number, highScore: number) => void
  onAchievementUnlocked?: (id: AchievementId, title: string, description: string) => void
  settings: GameSettings
}

export default function GameCanvas({ onGameOver, onAchievementUnlocked, settings }: GameCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const gameRef = useRef<Game | null>(null)
  const initialObjectiveProfileRef = useRef(settings.objectiveBalanceProfile)

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

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const resize = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
      if (gameRef.current) {
        gameRef.current.resize(canvas.width, canvas.height)
      }
    }

    resize()

    const game = new Game(canvas, Math.random, initialObjectiveProfileRef.current)
    gameRef.current = game
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
  }, [onGameOver, onAchievementUnlocked])

  useEffect(() => {
    if (!gameRef.current) return
    gameRef.current.setReducedMotion(settings.reducedMotion)
    gameRef.current.setMasterVolume(settings.masterVolume)
    gameRef.current.setGamepadEnabled(settings.gamepadEnabled)
    gameRef.current.setObjectiveBalanceProfile(settings.objectiveBalanceProfile)
    gameRef.current.setDifficulty(settings.difficulty)
    gameRef.current.setColorblind(settings.colorblindMode)
    gameRef.current.setLocale(getStrings(settings.language))
    const isMuted = gameRef.current.sound.isMuted()
    if (settings.muted !== isMuted) {
      gameRef.current.sound.toggleMute()
    }
  }, [settings])

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      <canvas
        ref={canvasRef}
        style={{ display: 'block', width: '100%', height: '100%' }}
      />
      <SwipeControls
        onSetPosition={handleSwipePosition}
        onPause={handlePause}
        onMute={handleMute}
        onFireDown={handleFireDown}
        onFireUp={handleFireUp}
        fireLabel={getStrings(settings.language).menuLabelFire}
      />
    </div>
  )
}
