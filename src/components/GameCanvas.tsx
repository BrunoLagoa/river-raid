import { useEffect, useRef } from 'react'
import { Game } from '@/game/Game'

interface GameCanvasProps {
  onGameOver: (score: number, highScore: number) => void
}

export default function GameCanvas({ onGameOver }: GameCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const gameRef = useRef<Game | null>(null)

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
      game.stop()
      gameRef.current = null
    }
  }, [onGameOver])

  return (
    <canvas
      ref={canvasRef}
      style={{ display: 'block', width: '100%', height: '100%' }}
    />
  )
}
