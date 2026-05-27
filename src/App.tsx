import { useCallback, useEffect, useState } from 'react'
import GameCanvas from './components/GameCanvas'
import { getStoredRanking, qualifiesForRanking, saveStoredRankingEntry, type RankingEntry } from './game/RankingService'
import { getStoredSettings, saveStoredSettings, type GameSettings } from './game/SettingsService'
import { getStoredAchievements, type AchievementId, type Achievement } from './game/AchievementService'

import './App.css'

type Screen = 'menu' | 'tutorial' | 'settings' | 'playing' | 'gameover'


export default function App() {
  const [screen, setScreen] = useState<Screen>('menu')
  const [finalScore, setFinalScore] = useState(0)
  const [highScore, setHighScore] = useState(0)
  const [ranking, setRanking] = useState<RankingEntry[]>(() => getStoredRanking())
  const [settings, setSettings] = useState<GameSettings>(() => {
    const stored = getStoredSettings()
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (prefersReduced && !stored.reducedMotion) {
      return saveStoredSettings({ ...stored, reducedMotion: true })
    }
    return stored
  })
  const [achievements, setAchievements] = useState(() => getStoredAchievements())
  const [newlyUnlocked, setNewlyUnlocked] = useState<Achievement[]>([])
  const [playerName, setPlayerName] = useState('ACE')
  const [needsRankingName, setNeedsRankingName] = useState(false)
  const [rankingSaved, setRankingSaved] = useState(false)
  const [currentEntryId, setCurrentEntryId] = useState<string | null>(null)

  const updateSettings = useCallback((patch: Partial<GameSettings>) => {
    setSettings((prev) => saveStoredSettings({ ...prev, ...patch }))
  }, [])

  const handleGameOver = useCallback((score: number, hs: number) => {
    setFinalScore(score)
    setHighScore(hs)
    setNeedsRankingName(qualifiesForRanking(score))
    setRankingSaved(false)
    setRanking(getStoredRanking())

    // Achievements are unlocked in-engine (Game.ts); sync stored state here
    setAchievements(getStoredAchievements())

    setScreen('gameover')
  }, [])

  const handleAchievementUnlocked = useCallback((_id: AchievementId, title: string, description: string) => {
    // Sincroniza estado React imediatamente ao desbloquear
    setAchievements(getStoredAchievements())
    // Acumula para exibir badge na tela de game over
    setNewlyUnlocked((prev) => {
      if (prev.some((a) => a.id === _id)) return prev
      return [...prev, { id: _id, title, description, unlocked: true, unlockedAt: new Date().toISOString() }]
    })
    // Ponto de extensão: analytics, notificações externas, etc.
    // Ex: analytics.track('achievement_unlocked', { id: _id })
  }, [])

  const saveRanking = useCallback(() => {
    const name = playerName.trim().slice(0, 10) || 'ACE'
    const id = crypto.randomUUID()
    const entry = { id, name, score: finalScore, date: new Date().toISOString() }
    setCurrentEntryId(id)
    const nextRanking = saveStoredRankingEntry(entry)
    setRanking(nextRanking)
    setRankingSaved(true)
    setNeedsRankingName(false)
  }, [finalScore, playerName])

  const handleAction = useCallback(() => {
    if (screen === 'menu') {
      setNewlyUnlocked([])
      setScreen('playing')
    } else if (screen === 'gameover') {
      if (needsRankingName && !rankingSaved) {
        saveRanking()
      } else {
        setNewlyUnlocked([])
        setScreen('playing')
      }
    }
  }, [screen, needsRankingName, rankingSaved, saveRanking])


  useEffect(() => {
    if (screen === 'playing' || screen === 'settings' || screen === 'tutorial') return
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
        <div className="screen-wrapper menu">
          <div className="panel menu-panel">
            <h1 className="title">RIVER RAID</h1>
            <div className="divider menu-divider" />

            <div className="controls-row">
              <div className="control-item">
                <div className="control-label">MOVE</div>
                <div className="control-key">{'<'} {'>'} / A D / TOUCH MOBILE</div>
              </div>
              <div className="control-item">
                <div className="control-label">FIRE</div>
                <div className="control-key">SPACE</div>
              </div>
            </div>

            <div className="menu-actions">
              <button className="save-button" onClick={handleAction}>START</button>
              <button className="save-button" onClick={() => setScreen('tutorial')}>TUTORIAL</button>
              <button className="save-button" onClick={() => setScreen('settings')}>SETTINGS</button>
            </div>

            <p className="start-text">{'>'} TAP OR PRESS ENTER TO START {'<'}</p>
          </div>
        </div>
      )}

      {screen === 'tutorial' && (
        <div className="screen-wrapper menu">
          <div className="panel menu-panel" style={{ maxWidth: 680 }}>
            <h1 className="title" style={{ fontSize: 32, letterSpacing: 4 }}>HOW TO PLAY</h1>
            <div className="divider menu-divider" />
            <p>Stay inside the river, destroy enemies and bridges, and keep fuel above 0%.</p>
            <p>Controls: Arrow keys / A D, SPACE to shoot, P to pause, M to mute.</p>
            <p>Gamepad: Left stick to move, A to shoot, START to pause.</p>
            <div className="menu-actions">
              <button className="save-button" onClick={() => setScreen('playing')}>START GAME</button>
              <button className="save-button" onClick={() => setScreen('menu')}>BACK</button>
            </div>
          </div>
        </div>
      )}

      {screen === 'settings' && (
        <div className="screen-wrapper menu">
          <div className="panel menu-panel" style={{ maxWidth: 680, textAlign: 'left' }}>
            <h1 className="title" style={{ fontSize: 32, letterSpacing: 4, textAlign: 'center' }}>SETTINGS</h1>
            <div className="divider menu-divider" />

            <label style={{ display: 'block', marginBottom: 12 }}>
              Master Volume: {Math.round(settings.masterVolume * 100)}%
              <input
                type="range"
                min={0}
                max={100}
                value={Math.round(settings.masterVolume * 100)}
                onChange={(e) => updateSettings({ masterVolume: Number(e.target.value) / 100 })}
                style={{ width: '100%' }}
              />
            </label>

            <label style={{ display: 'block', marginBottom: 10 }}>
              <input type="checkbox" checked={settings.muted} onChange={(e) => updateSettings({ muted: e.target.checked })} /> Mute by default
            </label>
            <label style={{ display: 'block', marginBottom: 10 }}>
              <input type="checkbox" checked={settings.reducedMotion} onChange={(e) => updateSettings({ reducedMotion: e.target.checked })} /> Reduced motion
            </label>
            <label style={{ display: 'block', marginBottom: 16 }}>
              <input type="checkbox" checked={settings.gamepadEnabled} onChange={(e) => updateSettings({ gamepadEnabled: e.target.checked })} /> Enable gamepad
            </label>

            <label style={{ display: 'block', marginBottom: 16 }}>
              Objective Profile
              <select
                value={settings.objectiveBalanceProfile}
                onChange={(e) => updateSettings({ objectiveBalanceProfile: e.target.value as GameSettings['objectiveBalanceProfile'] })}
                style={{ width: '100%', marginTop: 6 }}
              >
                <option value="conservative">Conservative</option>
                <option value="aggressive">Aggressive</option>
              </select>
            </label>

            <div className="label" style={{ marginBottom: 8 }}>ACHIEVEMENTS</div>
            <div className="ranking-container" style={{ width: '100%', marginBottom: 16 }}>
              {achievements.map((a) => (
                <div key={a.id} className="ranking-row">
                  <span className="ranking-name">{a.title}</span>
                  <span className="ranking-score">{a.unlocked ? 'UNLOCKED' : 'LOCKED'}</span>
                </div>
              ))}
            </div>

            <div className="menu-actions" style={{ marginTop: 24 }}>
              <button className="save-button" onClick={() => setScreen('menu')}>BACK</button>
              <button className="save-button" onClick={() => setScreen('playing')}>PLAY</button>
            </div>
          </div>
        </div>
      )}

      {screen === 'playing' && <GameCanvas onGameOver={handleGameOver} onAchievementUnlocked={handleAchievementUnlocked} settings={settings} />}

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

            {newlyUnlocked.length > 0 && (
              <div className="achievement-unlocked-section">
                <div className="achievement-unlocked-header">CONQUISTAS DESBLOQUEADAS</div>
                {newlyUnlocked.map((a) => (
                  <div key={a.id} className="achievement-unlocked-badge">
                    <span className="achievement-unlocked-star">&#9733;</span>
                    <div className="achievement-unlocked-text">
                      <span className="achievement-unlocked-title">{a.title}</span>
                      <span className="achievement-unlocked-desc">{a.description}</span>
                    </div>
                  </div>
                ))}
              </div>
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
