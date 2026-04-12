import { useEffect, useRef, useCallback } from 'react'
import { Game } from '@/game/Game'
import SwipeControls from './SwipeControls'

interface GameCanvasProps {
  onGameOver: (score: number, highScore: number) => void
}

export default function GameCanvas({ onGameOver }: GameCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const gameRef = useRef<Game | null>(null)

  const handleSwipePosition = useCallback((x: number | null) => {
    gameRef.current?.setTouchPosition(x)
  }, [])

  const handlePause = useCallback(() => {
    gameRef.current?.togglePause()
  }, [])

  const handleMute = useCallback(() => {
    gameRef.current?.sound.toggleMute()
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

    const game = new Game(canvas)
    gameRef.current = game
    game.setOnGameOver((score, highScore) => {
      onGameOver(score, highScore)
    })
    game.start()

    window.addEventListener('resize', resize)

    return () => {
      window.removeEventListener('resize', resize)
      game.destroy()
      gameRef.current = null
    }
  }, [onGameOver])

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
      />
    </div>
  )
}
