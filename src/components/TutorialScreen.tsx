interface TutorialScreenProps {
  onStartGame: () => void
  onBack: () => void
}

export default function TutorialScreen({ onStartGame, onBack }: TutorialScreenProps) {
  return (
    <div className="screen-wrapper menu">
      <div className="menu-scanlines" aria-hidden="true" />

      <div className="panel menu-panel tutorial-panel">
        <div className="tutorial-header">
          <div className="menu-subtitle">— MISSION BRIEFING —</div>
          <h1 className="title tutorial-title">HOW TO PLAY</h1>
        </div>

        <div className="divider menu-divider" />

        <div className="tutorial-objective">
          Fly down the river. Destroy enemies and bridges. Keep your fuel above 0%.
        </div>

        <div className="tutorial-cards">
          <div className="tutorial-card">
            <div className="tutorial-card-icon">◄ ►</div>
            <div className="tutorial-card-title">NAVIGATE</div>
            <ul className="tutorial-card-list">
              <li>Arrow keys or A / D</li>
              <li>Touch controls on mobile</li>
              <li>Left stick (gamepad)</li>
            </ul>
          </div>

          <div className="tutorial-card">
            <div className="tutorial-card-icon">✦</div>
            <div className="tutorial-card-title">COMBAT</div>
            <ul className="tutorial-card-list">
              <li>SPACE to shoot</li>
              <li>A button (gamepad)</li>
              <li>Destroy enemies &amp; bridges</li>
            </ul>
          </div>

          <div className="tutorial-card">
            <div className="tutorial-card-icon">▲</div>
            <div className="tutorial-card-title">SURVIVE</div>
            <ul className="tutorial-card-list">
              <li>Collect fuel depots</li>
              <li>Stay inside the river</li>
              <li>P to pause · M to mute</li>
            </ul>
          </div>
        </div>

        <div className="menu-actions tutorial-actions">
          <button className="menu-btn menu-btn--primary" onClick={onStartGame}>
            <span className="menu-btn-arrow">▶</span> START MISSION
          </button>
          <button className="menu-btn menu-btn--ghost" onClick={onBack}>BACK</button>
        </div>
      </div>
    </div>
  )
}
