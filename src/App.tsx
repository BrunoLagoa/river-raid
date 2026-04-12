import { useCallback, useEffect, useRef, useState } from 'react'
import GameCanvas from './components/GameCanvas'
import { getStoredRanking, qualifiesForRanking, saveStoredRankingEntry, type RankingEntry } from './game/Game'

type Screen = 'menu' | 'playing' | 'gameover'

const retroStyle: React.CSSProperties = {
  fontFamily: '"Courier New", "Lucida Console", monospace',
  color: '#fff',
  userSelect: 'none',
}

export default function App() {
  const [screen, setScreen] = useState<Screen>('menu')
  const [finalScore, setFinalScore] = useState(0)
  const [highScore, setHighScore] = useState(0)
  const [ranking, setRanking] = useState<RankingEntry[]>(() => getStoredRanking())
  const [playerName, setPlayerName] = useState('ACE')
  const [needsRankingName, setNeedsRankingName] = useState(false)
  const [rankingSaved, setRankingSaved] = useState(false)
  const currentEntryId = useRef<string | null>(null)

  const handleGameOver = useCallback((score: number, hs: number) => {
    setFinalScore(score)
    setHighScore(hs)
    setNeedsRankingName(qualifiesForRanking(score))
    setRankingSaved(false)
    setRanking(getStoredRanking())
    setScreen('gameover')
  }, [])

  const saveRanking = useCallback(() => {
    const name = playerName.trim().slice(0, 10) || 'ACE'
    const id = crypto.randomUUID()
    currentEntryId.current = id
    const nextRanking = saveStoredRankingEntry({
      id,
      name,
      score: finalScore,
      date: new Date().toISOString(),
    })
    setRanking(nextRanking)
    setRankingSaved(true)
    setNeedsRankingName(false)
  }, [finalScore, playerName])

  useEffect(() => {
    if (screen === 'playing') return
    const handler = (e: KeyboardEvent) => {
      if (screen === 'gameover' && needsRankingName && !rankingSaved) {
        if (e.key === 'Enter') {
          e.preventDefault()
          saveRanking()
        }
        return
      }
      if (e.key === 'Enter') {
        setScreen('playing')
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [needsRankingName, rankingSaved, saveRanking, screen])

  return (
    <div
      style={{
        width: '100vw',
        height: '100vh',
        overflow: 'hidden',
        backgroundColor: '#0a0a12',
        position: 'relative',
        ...retroStyle,
      }}
    >
      {screen === 'menu' && (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100%',
            backgroundImage: 'radial-gradient(ellipse at 50% 40%, #0d1a2a 0%, #0a0a12 70%)',
          }}
        >
          <div
            style={{
              border: '2px solid #334466',
              padding: '60px 80px',
              textAlign: 'center',
              backgroundColor: 'rgba(10, 15, 30, 0.8)',
              boxShadow: '0 0 40px rgba(50, 100, 200, 0.15), inset 0 0 30px rgba(50, 100, 200, 0.05)',
            }}
          >
            <h1
              style={{
                fontSize: 52,
                margin: '0 0 8px 0',
                letterSpacing: 8,
                color: '#44aaff',
                textShadow: '0 0 20px rgba(68, 170, 255, 0.4), 0 2px 0 #1a5588',
              }}
            >
              RIVER RAID
            </h1>
            <div
              style={{
                width: '100%',
                height: 1,
                backgroundColor: '#334466',
                margin: '12px 0 24px 0',
              }}
            />
            <div style={{ display: 'flex', gap: 32, justifyContent: 'center', marginBottom: 32 }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 11, color: '#667799', marginBottom: 4, letterSpacing: 2 }}>MOVE</div>
                <div
                  style={{
                    fontSize: 14,
                    padding: '4px 12px',
                    border: '1px solid #445566',
                    color: '#8899bb',
                    backgroundColor: 'rgba(40, 50, 70, 0.4)',
                  }}
                >
                  {'<'} {'>'}
                </div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 11, color: '#667799', marginBottom: 4, letterSpacing: 2 }}>FIRE</div>
                <div
                  style={{
                    fontSize: 14,
                    padding: '4px 12px',
                    border: '1px solid #445566',
                    color: '#8899bb',
                    backgroundColor: 'rgba(40, 50, 70, 0.4)',
                  }}
                >
                  SPACE
                </div>
              </div>
            </div>
            <p
              style={{
                fontSize: 16,
                color: '#88aacc',
                animation: 'pulse 1.5s ease-in-out infinite',
              }}
            >
              {'>'} PRESS ENTER TO START {'<'}
            </p>
          </div>
          <style>{`
            @keyframes pulse {
              0%, 100% { opacity: 1; }
              50% { opacity: 0.4; }
            }
          `}</style>
        </div>
      )}

      {screen === 'playing' && <GameCanvas onGameOver={handleGameOver} />}

      {screen === 'gameover' && (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100%',
            backgroundImage: 'radial-gradient(ellipse at 50% 40%, #1a0a0a 0%, #0a0a12 70%)',
          }}
        >
          <div
            style={{
              border: '2px solid #663333',
              padding: '50px 70px',
              textAlign: 'center',
              backgroundColor: 'rgba(20, 10, 10, 0.8)',
              boxShadow: '0 0 40px rgba(200, 50, 50, 0.15), inset 0 0 30px rgba(200, 50, 50, 0.05)',
            }}
          >
            <h1
              style={{
                fontSize: 44,
                margin: '0 0 8px 0',
                letterSpacing: 6,
                color: '#ff4444',
                textShadow: '0 0 20px rgba(255, 68, 68, 0.4), 0 2px 0 #881a1a',
              }}
            >
              GAME OVER
            </h1>
            <div
              style={{
                width: '100%',
                height: 1,
                backgroundColor: '#663333',
                margin: '16px 0 24px 0',
              }}
            />
            <div style={{ fontSize: 12, color: '#667799', letterSpacing: 2, marginBottom: 6 }}>
              FINAL SCORE
            </div>
            <div
              style={{
                fontSize: 36,
                color: '#ffcc44',
                textShadow: '0 0 12px rgba(255, 204, 68, 0.3)',
                fontFamily: '"Courier New", monospace',
                marginBottom: 12,
              }}
            >
              {finalScore.toString().padStart(6, '0')}
            </div>
            {highScore > 0 && (
              <div style={{ fontSize: 12, color: '#667799', letterSpacing: 2, marginBottom: 4 }}>
                BEST
              </div>
            )}
            {highScore > 0 && (
              <div
                style={{
                  fontSize: 18,
                  color: '#44aaff',
                  fontFamily: '"Courier New", monospace',
                  marginBottom: finalScore >= highScore && finalScore > 0 ? 8 : 24,
                }}
              >
                {highScore.toString().padStart(6, '0')}
              </div>
            )}
            {finalScore >= highScore && finalScore > 0 && (
              <div
                style={{
                  fontSize: 16,
                  color: '#ffcc44',
                  letterSpacing: 4,
                  marginBottom: 24,
                  textShadow: '0 0 12px rgba(255, 204, 68, 0.5)',
                }}
              >
                NEW BEST!
              </div>
            )}
            {needsRankingName && !rankingSaved && (
              <div style={{ marginBottom: 20 }}>
                <div style={{ fontSize: 12, color: '#88aacc', marginBottom: 8, letterSpacing: 2 }}>
                  TOP 10 - ENTER YOUR NAME
                </div>
                <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
                  <input
                    value={playerName}
                    onChange={(e) => setPlayerName(e.target.value.toUpperCase())}
                    maxLength={10}
                    style={{
                      width: 120,
                      padding: '8px 10px',
                      background: '#120c0c',
                      color: '#ffcc44',
                      border: '1px solid #663333',
                      fontFamily: '"Courier New", monospace',
                      textAlign: 'center',
                    }}
                  />
                  <button
                    onClick={saveRanking}
                    style={{
                      padding: '8px 12px',
                      background: '#441818',
                      color: '#ffffff',
                      border: '1px solid #884444',
                      fontFamily: '"Courier New", monospace',
                      cursor: 'pointer',
                    }}
                  >
                    SAVE
                  </button>
                </div>
              </div>
            )}
            <div
              style={{
                width: 260,
                margin: '0 auto 20px auto',
                padding: '12px 14px',
                border: '1px solid #4a2a2a',
                backgroundColor: 'rgba(8, 4, 4, 0.55)',
                textAlign: 'left',
              }}
            >
              <div style={{ fontSize: 12, color: '#88aacc', letterSpacing: 2, marginBottom: 10, textAlign: 'center' }}>
                TOP 10
              </div>
              {ranking.length === 0 && (
                <div style={{ fontSize: 12, color: '#778899', textAlign: 'center' }}>No records yet</div>
              )}
              {ranking.map((entry, index) => {
                const isCurrent = rankingSaved && entry.id === currentEntryId.current
                return (
                  <div
                    key={entry.id || `${entry.name}-${entry.score}-${entry.date}-${index}`}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      fontSize: 12,
                      color: isCurrent ? '#ffcc44' : '#d5d9e0',
                      marginBottom: 4,
                    }}
                  >
                    <span>{String(index + 1).padStart(2, '0')}. {entry.name}</span>
                    <span>{entry.score.toString().padStart(6, '0')}</span>
                  </div>
                )
              })}
            </div>
            <p
              style={{
                fontSize: 16,
                color: '#88aacc',
                animation: 'pulse 1.5s ease-in-out infinite',
              }}
            >
              {'>'} PRESS ENTER TO RETRY {'<'}
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
