import type { Strings } from '../i18n'

interface MenuScreenProps {
  t: Strings
  onStart: () => void
  onDaily: () => void
  onModes?: () => void
  onTutorial: () => void
  onSettings: () => void
  onHangar?: () => void
  onStats?: () => void
  muted: boolean
  onToggleMute: () => void
  dailyBest: number
}

export default function MenuScreen({
  t,
  onStart,
  onDaily,
  onModes,
  onTutorial,
  onSettings,
  onHangar,
  onStats,
  muted,
  onToggleMute,
  dailyBest,
}: MenuScreenProps) {
  return (
    <div className="screen-wrapper menu">
      <div className="menu-scanlines" aria-hidden="true" />

      <div className="panel menu-panel">
        <button
          type="button"
          className={`menu-mute-btn ${muted ? 'is-muted' : ''}`}
          onClick={onToggleMute}
          aria-label={muted ? t.menuUnmute : t.menuMute}
          aria-pressed={muted}
          title={muted ? t.menuUnmute : t.menuMute}
        >
          {muted ? '🔇' : '🔊'}
        </button>

        <div className="menu-title-block">
          <div className="menu-subtitle">{t.menuSubtitle}</div>
          <h1 className="title menu-title-flicker">RIVER RAID</h1>
          <div className="menu-tagline">{t.menuTagline}</div>
        </div>

        <div className="divider menu-divider" />

        <div className="menu-controls-grid">
          <div className="control-card">
            <div className="control-card-label">{t.menuLabelMove}</div>
            <div className="control-card-keys">
              <span className="key-badge">◄</span>
              <span className="key-badge">▲</span>
              <span className="key-badge">▼</span>
              <span className="key-badge">►</span>
              <span className="key-sep">/</span>
              <span className="key-badge">WASD</span>
              <span className="key-sep">/</span>
              <span className="key-touch">TOUCH</span>
            </div>
          </div>
          <div className="control-card-divider" aria-hidden="true" />
          <div className="control-card">
            <div className="control-card-label">{t.menuLabelFire}</div>
            <div className="control-card-keys">
              <span className="key-badge key-badge--wide">SPACE</span>
            </div>
          </div>
        </div>

        <div className="menu-actions">
          <button className="menu-btn menu-btn--primary" onClick={onStart}>
            <span className="menu-btn-arrow">▶</span> {t.menuBtnStart}
          </button>
          <div className="menu-actions-row">
            <button className="menu-btn menu-btn--secondary" onClick={onModes}>🎮 {t.menuBtnModes}</button>
            <button className="menu-btn menu-btn--secondary" onClick={onHangar}>🛩️ {t.menuBtnHangar}</button>
          </div>
          <div className="menu-actions-row">
            <button className="menu-btn menu-btn--secondary" onClick={onStats}>📊 {t.menuBtnStats}</button>
            <button className="menu-btn menu-btn--secondary" onClick={onSettings}>{t.menuBtnSettings}</button>
          </div>
          <button className="menu-btn menu-btn--secondary" onClick={onTutorial}>{t.menuBtnTutorial}</button>
        </div>

        <button className="menu-btn menu-btn--daily" onClick={onDaily}>
          ☀ {t.menuBtnDaily}
        </button>
        {dailyBest > 0 && (
          <div className="menu-daily-best">
            {t.menuDailyBest}: {dailyBest.toString().padStart(6, '0')}
          </div>
        )}

        <p className="start-text">{t.menuPressEnter}</p>
      </div>
    </div>
  )
}
