import type { Strings } from '../i18n'

interface TutorialScreenProps {
  t: Strings
  onStartGame: () => void
  onBack: () => void
}

export default function TutorialScreen({ t, onStartGame, onBack }: TutorialScreenProps) {
  return (
    <div className="screen-wrapper menu">
      <div className="menu-scanlines" aria-hidden="true" />

      <div className="panel menu-panel tutorial-panel">
        <div className="tutorial-header">
          <div className="menu-subtitle">{t.tutorialSubtitle}</div>
          <h1 className="title tutorial-title">{t.tutorialTitle}</h1>
        </div>

        <div className="divider menu-divider" />

        <div className="tutorial-objective">
          {t.tutorialObjective}
        </div>

        <div className="tutorial-cards">
          <div className="tutorial-card">
            <div className="tutorial-card-icon">◄ ►</div>
            <div className="tutorial-card-title">{t.tutorialCardNavigate}</div>
            <ul className="tutorial-card-list">
              <li>{t.tutorialNavigate1}</li>
              <li>{t.tutorialNavigate2}</li>
              <li>{t.tutorialNavigate3}</li>
            </ul>
          </div>

          <div className="tutorial-card">
            <div className="tutorial-card-icon">✦</div>
            <div className="tutorial-card-title">{t.tutorialCardCombat}</div>
            <ul className="tutorial-card-list">
              <li>{t.tutorialCombat1}</li>
              <li>{t.tutorialCombat2}</li>
              <li>{t.tutorialCombat3}</li>
            </ul>
          </div>

          <div className="tutorial-card">
            <div className="tutorial-card-icon">▲</div>
            <div className="tutorial-card-title">{t.tutorialCardSurvive}</div>
            <ul className="tutorial-card-list">
              <li>{t.tutorialSurvive1}</li>
              <li>{t.tutorialSurvive2}</li>
              <li>{t.tutorialSurvive3}</li>
            </ul>
          </div>
        </div>

        <div className="menu-actions tutorial-actions">
          <button className="menu-btn menu-btn--primary" onClick={onStartGame}>
            <span className="menu-btn-arrow">▶</span> {t.tutorialBtnStart}
          </button>
          <button className="menu-btn menu-btn--ghost" onClick={onBack}>{t.tutorialBtnBack}</button>
        </div>
      </div>
    </div>
  )
}
