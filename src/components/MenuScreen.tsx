import type { Strings } from '../i18n'

interface MenuScreenProps {
  t: Strings
  onStart: () => void
  onTutorial: () => void
  onSettings: () => void
}

export default function MenuScreen({ t, onStart, onTutorial, onSettings }: MenuScreenProps) {
  return (
    <div className="screen-wrapper menu">
      <div className="menu-scanlines" aria-hidden="true" />

      <div className="panel menu-panel">
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
              <span className="key-badge">►</span>
              <span className="key-sep">/</span>
              <span className="key-badge">A</span>
              <span className="key-badge">D</span>
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
          <button className="menu-btn menu-btn--secondary" onClick={onTutorial}>{t.menuBtnTutorial}</button>
          <button className="menu-btn menu-btn--secondary" onClick={onSettings}>{t.menuBtnSettings}</button>
        </div>

        <p className="start-text">{t.menuPressEnter}</p>
      </div>
    </div>
  )
}
