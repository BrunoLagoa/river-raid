import type { GameSettings } from '../game/SettingsService'
import type { Strings } from '../i18n'
import type { Achievement } from '../game/AchievementService'

interface SettingsScreenProps {
  settings: GameSettings
  achievements: Achievement[]
  t: Strings
  onUpdate: (patch: Partial<GameSettings>) => void
  onBack: () => void
  onPlay: () => void
}

export default function SettingsScreen({ settings, achievements, t, onUpdate, onBack, onPlay }: SettingsScreenProps) {
  return (
    <div className="screen-wrapper menu">
      <div className="menu-scanlines" aria-hidden="true" />

      <div className="panel menu-panel settings-panel">
        <div className="menu-title-block">
          <div className="menu-subtitle">{t.settingsSubtitle}</div>
          <h1 className="title settings-title">{t.settingsTitle}</h1>
        </div>

        <div className="divider menu-divider" />

        <div className="settings-body">
          {/* Volume */}
          <div className="settings-row settings-row--slider">
            <div className="settings-row-label">
              {t.settingsLabelVolume}
              <span className="settings-value">{Math.round(settings.masterVolume * 100)}%</span>
            </div>
            <input
              type="range"
              min={0}
              max={100}
              value={Math.round(settings.masterVolume * 100)}
              onChange={(e) => onUpdate({ masterVolume: Number(e.target.value) / 100 })}
              className="settings-slider"
              style={{ '--val': `${Math.round(settings.masterVolume * 100)}` } as React.CSSProperties}
            />
          </div>

          <div className="settings-divider" />

          {/* Toggles */}
          <div className="settings-toggles">
            <label className="settings-toggle">
              <input
                type="checkbox"
                checked={settings.muted}
                onChange={(e) => onUpdate({ muted: e.target.checked })}
                className="settings-checkbox"
              />
              <span className="settings-toggle-track" />
              <span className="settings-toggle-label">{t.settingsLabelMute}</span>
            </label>

            <label className="settings-toggle">
              <input
                type="checkbox"
                checked={settings.reducedMotion}
                onChange={(e) => onUpdate({ reducedMotion: e.target.checked })}
                className="settings-checkbox"
              />
              <span className="settings-toggle-track" />
              <span className="settings-toggle-label">{t.settingsLabelReducedMotion}</span>
            </label>

            <label className="settings-toggle">
              <input
                type="checkbox"
                checked={settings.gamepadEnabled}
                onChange={(e) => onUpdate({ gamepadEnabled: e.target.checked })}
                className="settings-checkbox"
              />
              <span className="settings-toggle-track" />
              <span className="settings-toggle-label">{t.settingsLabelGamepad}</span>
            </label>
          </div>

          <div className="settings-divider" />

          {/* Selects row */}
          <div className="settings-selects">
            <div className="settings-select-group">
              <div className="settings-select-label">{t.settingsLabelObjectiveProfile}</div>
              <select
                value={settings.objectiveBalanceProfile}
                onChange={(e) => onUpdate({ objectiveBalanceProfile: e.target.value as GameSettings['objectiveBalanceProfile'] })}
                className="settings-select"
              >
                <option value="conservative">{t.settingsProfileConservative}</option>
                <option value="aggressive">{t.settingsProfileAggressive}</option>
              </select>
            </div>

            <div className="settings-select-group">
              <div className="settings-select-label">{t.settingsLabelLanguage}</div>
              <select
                value={settings.language}
                onChange={(e) => onUpdate({ language: e.target.value as GameSettings['language'] })}
                className="settings-select"
              >
                <option value="en">{t.settingsLangEn}</option>
                <option value="pt-BR">{t.settingsLangPt}</option>
              </select>
            </div>
          </div>

          <div className="settings-divider" />

          {/* Achievements */}
          <div className="settings-achievements-label">{t.settingsLabelAchievements}</div>
          <div className="settings-achievements">
            {achievements.map((a) => (
              <div key={a.id} className={`settings-achievement-row ${a.unlocked ? 'unlocked' : 'locked'}`}>
                <span className={`settings-achievement-icon ${a.unlocked ? 'unlocked-pulse' : ''}`}>
                  {a.unlocked ? '★' : '☆'}
                </span>
                <span className="settings-achievement-name">{a.title}</span>
                <span className="settings-achievement-hint">
                  <span className="settings-achievement-hint-icon">ⓘ</span>
                  <span className="settings-achievement-tooltip">
                    <span className="settings-achievement-tooltip-section">
                      <span className="settings-achievement-tooltip-label">{t.settingsTooltipHowTo}</span>
                      <span className="settings-achievement-tooltip-text">{a.description}</span>
                    </span>
                    <span className="settings-achievement-tooltip-divider" />
                    <span className="settings-achievement-tooltip-section">
                      <span className="settings-achievement-tooltip-label">{t.settingsTooltipLore}</span>
                      <span className="settings-achievement-tooltip-text settings-achievement-tooltip-lore">
                        {t.achievementLore[a.id] ?? ''}
                      </span>
                    </span>
                  </span>
                </span>
                <span className="settings-achievement-status">
                  {a.unlocked ? t.settingsAchievementUnlocked : t.settingsAchievementLocked}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="menu-actions settings-actions">
          <button className="menu-btn menu-btn--ghost" onClick={onBack}>{t.settingsBtnBack}</button>
          <button className="menu-btn menu-btn--primary" onClick={onPlay}>
            <span className="menu-btn-arrow">▶</span>{t.settingsBtnPlay}
          </button>
        </div>
      </div>
    </div>
  )
}
