import { useCallback, useEffect, useRef, useState } from 'react'
import GameCanvas from './components/GameCanvas'
import { getStoredRanking, qualifiesForRanking, saveStoredRankingEntry, type RankingEntry } from './game/RankingService'

import './App.css'

type Screen = 'menu' | 'playing' | 'gameover'

export default function App() {
  const [screen, setScreen] = useState<Screen>('menu')
  const [finalScore, setFinalScore] = useState(0)
  const [highScore, setHighScore] = useState(0)
  const [ranking, setRanking] = useState<RankingEntry[]>(() => getStoredRanking())
  const [playerName, setPlayerName] = useState('ACE')
  const [needsRankingName, setNeedsRankingName] = useState(false)
  const [rankingSaved, setRankingSaved] = useState(false)
  const [currentEntryId, setCurrentEntryId] = useState<string | null>(null)

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
    setCurrentEntryId(id)
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

  const handleAction = useCallback(() => {
    if (screen === 'menu') {
      setScreen('playing')
    } else if (screen === 'gameover') {
      if (needsRankingName && !rankingSaved) {
        saveRanking()
      } else {
        setScreen('playing')
      }
    }
  }, [screen, needsRankingName, rankingSaved, saveRanking])

  useEffect(() => {
    if (screen === 'playing') return
    const handler = (e: KeyboardEvent) => {
      if (screen === 'gameover' && needsRankingName && !rankingSaved) {
        if (e.key === 'Enter') {
          e.preventDefault()
          handleAction()
        }
        return
      }
      if (e.key === 'Enter') {
        handleAction()
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [screen, needsRankingName, rankingSaved, handleAction])

  return (
    <div className="app-container">
      {screen === 'menu' && (
        <div className="screen-wrapper menu" onClick={handleAction} style={{ cursor: 'pointer' }}>
          <div className="panel menu-panel">
            <h1 className="title">RIVER RAID</h1>
            <div className="divider menu-divider" />
            
            <div className="controls-row">
              <div className="control-item">
                <div className="control-label">MOVE</div>
                <div className="control-key">{'<'} {'>'} / A D</div>
              </div>
              <div className="control-item">
                <div className="control-label">FIRE</div>
                <div className="control-key">SPACE</div>
              </div>
            </div>
            
            <p className="start-text">
              {'>'} TAP OR PRESS ENTER TO START {'<'}
            </p>
          </div>
        </div>
      )}

      {screen === 'playing' && <GameCanvas onGameOver={handleGameOver} />}

      {screen === 'gameover' && (
        <div className="screen-wrapper gameover">
          <div className="panel gameover-panel">
            <h1 className="gameover-title">GAME OVER</h1>
            
            <div className="divider gameover-divider" />
            
            <div className="label" style={{ marginBottom: 6 }}>FINAL SCORE</div>
            <div className="score" style={{ marginBottom: 12 }}>
              {finalScore.toString().padStart(6, '0')}
            </div>
            
            {highScore > 0 && (
              <div className="label" style={{ marginBottom: 4 }}>BEST</div>
            )}
            {highScore > 0 && (
              <div
                className="highscore"
                style={{ marginBottom: finalScore >= highScore && finalScore > 0 ? 8 : 24 }}
              >
                {highScore.toString().padStart(6, '0')}
              </div>
            )}
            
            {finalScore >= highScore && finalScore > 0 && (
              <div className="new-best">NEW BEST!</div>
            )}

            {needsRankingName && !rankingSaved && (
              <div style={{ marginBottom: 20 }}>
                <div className="label" style={{ marginBottom: 12, color: '#ffcc44' }}>
                  TOP 10 - ENTER YOUR NAME
                </div>
                <div className="input-container">
                  <input
                    type="text"
                    maxLength={10}
                    value={playerName}
                    onChange={(e) => setPlayerName(e.target.value.toUpperCase())}
                    autoFocus
                    className="name-input"
                  />
                  <button onClick={saveRanking} className="save-button">
                    SAVE
                  </button>
                </div>
              </div>
            )}

            {!needsRankingName && (
              <div className="ranking-container">
                <div style={{ fontSize: 12, color: '#88aacc', letterSpacing: 2, marginBottom: 10, textAlign: 'center' }}>
                  TOP 10
                </div>
                {ranking.length === 0 && (
                  <div style={{ fontSize: 12, color: '#778899', textAlign: 'center' }}>No records yet</div>
                )}
                {ranking.map((entry, index) => {
                  const isCurrent = rankingSaved && entry.id === currentEntryId
                  return (
                    <div
                      key={entry.id || `${entry.name}-${entry.score}-${entry.date}-${index}`}
                      className={`ranking-row ${isCurrent ? 'current' : ''}`}
                    >
                      <span className="ranking-name">
                        {String(index + 1).padStart(2, '0')}. {entry.name}
                      </span>
                      <span className="ranking-score">{entry.score.toString().padStart(6, '0')}</span>
                    </div>
                  )
                })}
              </div>
            )}

            <p className="restart-hint" onClick={handleAction} style={{ cursor: 'pointer' }}>
              {'>'} TAP OR PRESS ENTER TO RETRY {'<'}
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
