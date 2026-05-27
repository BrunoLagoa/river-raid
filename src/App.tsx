import { useCallback, useEffect, useMemo, useState } from 'react'
import GameCanvas from './components/GameCanvas'
import MenuScreen from './components/MenuScreen'
import TutorialScreen from './components/TutorialScreen'
import SettingsScreen from './components/SettingsScreen'
import { getStoredRanking, qualifiesForRanking, saveStoredRankingEntry, type RankingEntry } from './game/RankingService'
import { getStoredSettings, saveStoredSettings, type GameSettings } from './game/SettingsService'
import { getStoredAchievements, type AchievementId, type Achievement } from './game/AchievementService'
import { getStrings } from './i18n'

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

  const t = useMemo(() => getStrings(settings.language), [settings.language])

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
        <MenuScreen
          t={t}
          onStart={handleAction}
          onTutorial={() => setScreen('tutorial')}
          onSettings={() => setScreen('settings')}
        />
      )}

      {screen === 'tutorial' && (
        <TutorialScreen
          t={t}
          onStartGame={() => { setNewlyUnlocked([]); setScreen('playing') }}
          onBack={() => setScreen('menu')}
        />
      )}

      {screen === 'settings' && (
        <SettingsScreen
          t={t}
          settings={settings}
          achievements={achievements}
          onUpdate={updateSettings}
          onBack={() => setScreen('menu')}
          onPlay={() => { setNewlyUnlocked([]); setScreen('playing') }}
        />
      )}

      {screen === 'playing' && <GameCanvas onGameOver={handleGameOver} onAchievementUnlocked={handleAchievementUnlocked} settings={settings} />}

      {screen === 'gameover' && (
        <div className="screen-wrapper gameover">
          <div className="panel gameover-panel">
            <h1 className="gameover-title">{t.gameoverTitle}</h1>

            <div className="divider gameover-divider" />

            <div className="label" style={{ marginBottom: 6 }}>{t.gameoverLabelScore}</div>
            <div className="score" style={{ marginBottom: 12 }}>
              {finalScore.toString().padStart(6, '0')}
            </div>

            {highScore > 0 && (
              <div className="label" style={{ marginBottom: 4 }}>{t.gameoverLabelBest}</div>
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
              <div className="new-best">{t.gameoverNewBest}</div>
            )}

            {newlyUnlocked.length > 0 && (
              <div className="achievement-unlocked-section">
                <div className="achievement-unlocked-header">{t.gameoverAchievementsHeader}</div>
                {newlyUnlocked.map((a, index) => (
                  <div
                    key={a.id}
                    className="achievement-unlocked-badge"
                    style={{ animationDelay: `${index * 0.12}s` }}
                  >
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
                  {t.gameoverEnterName}
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
                    {t.gameoverBtnSave}
                  </button>
                </div>
              </div>
            )}

            {!needsRankingName && (
              <div className="ranking-container">
                <div style={{ fontSize: 12, color: '#88aacc', letterSpacing: 2, marginBottom: 10, textAlign: 'center' }}>
                  {t.gameoverTop10}
                </div>
                {ranking.length === 0 && (
                  <div style={{ fontSize: 12, color: '#778899', textAlign: 'center' }}>{t.gameoverNoRecords}</div>
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
              {t.gameoverPressEnter}
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
