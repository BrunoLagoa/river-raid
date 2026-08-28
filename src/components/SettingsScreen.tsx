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
          {/* Audio Channels */}
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

          <div className="settings-row settings-row--slider">
            <div className="settings-row-label">
              {t.settingsLabelMusicVolume}
              <span className="settings-value">{Math.round(settings.musicVolume * 100)}%</span>
            </div>
            <input
              type="range"
              min={0}
              max={100}
              value={Math.round(settings.musicVolume * 100)}
              onChange={(e) => onUpdate({ musicVolume: Number(e.target.value) / 100 })}
              className="settings-slider"
              style={{ '--val': `${Math.round(settings.musicVolume * 100)}` } as React.CSSProperties}
            />
          </div>

          <div className="settings-row settings-row--slider">
            <div className="settings-row-label">
              {t.settingsLabelSfxVolume}
              <span className="settings-value">{Math.round(settings.sfxVolume * 100)}%</span>
            </div>
            <input
              type="range"
              min={0}
              max={100}
              value={Math.round(settings.sfxVolume * 100)}
              onChange={(e) => onUpdate({ sfxVolume: Number(e.target.value) / 100 })}
              className="settings-slider"
              style={{ '--val': `${Math.round(settings.sfxVolume * 100)}` } as React.CSSProperties}
            />
          </div>

          <div className="settings-row settings-row--slider">
            <div className="settings-row-label">
              {t.settingsLabelVoiceVolume}
              <span className="settings-value">{Math.round(settings.voiceVolume * 100)}%</span>
            </div>
            <input
              type="range"
              min={0}
              max={100}
              value={Math.round(settings.voiceVolume * 100)}
              onChange={(e) => onUpdate({ voiceVolume: Number(e.target.value) / 100 })}
              className="settings-slider"
              style={{ '--val': `${Math.round(settings.voiceVolume * 100)}` } as React.CSSProperties}
            />
          </div>

          <div className="settings-divider" />

          {/* Toggles */}
          <div className="settings-toggles">
            <label className="settings-toggle">
              <input
                type="checkbox"
                checked={settings.voiceEnabled}
                onChange={(e) => onUpdate({ voiceEnabled: e.target.checked })}
                className="settings-checkbox"
              />
              <span className="settings-toggle-track" />
              <span className="settings-toggle-label">{t.settingsLabelVoiceEnabled}</span>
            </label>

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
                checked={settings.weatherEffects}
                onChange={(e) => onUpdate({ weatherEffects: e.target.checked })}
                className="settings-checkbox"
              />
              <span className="settings-toggle-track" />
              <span className="settings-toggle-label">{t.settingsLabelWeather}</span>
            </label>

            <label className="settings-toggle">
              <input
                type="checkbox"
                checked={settings.dynamicLighting}
                onChange={(e) => onUpdate({ dynamicLighting: e.target.checked })}
                className="settings-checkbox"
              />
              <span className="settings-toggle-track" />
              <span className="settings-toggle-label">{t.settingsLabelLighting}</span>
            </label>

            <label className="settings-toggle">
              <input
                type="checkbox"
                checked={settings.colorblindMode}
                onChange={(e) => onUpdate({ colorblindMode: e.target.checked })}
                className="settings-checkbox"
              />
              <span className="settings-toggle-track" />
              <span className="settings-toggle-label">{t.settingsLabelColorblind}</span>
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
              <div className="settings-select-label">{t.settingsLabelDifficulty}</div>
              <select
                value={settings.difficulty}
                onChange={(e) => onUpdate({ difficulty: e.target.value as GameSettings['difficulty'] })}
                className="settings-select"
              >
                <option value="easy">{t.difficultyEasy}</option>
                <option value="normal">{t.difficultyNormal}</option>
                <option value="hard">{t.difficultyHard}</option>
              </select>
            </div>

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
                <span className="settings-achievement-name">{t.achievementCatalog[a.id]?.title ?? a.title}</span>
                <span className="settings-achievement-hint">
                  <span className="settings-achievement-hint-icon">ⓘ</span>
                  <span className="settings-achievement-tooltip">
                    <span className="settings-achievement-tooltip-section">
                      <span className="settings-achievement-tooltip-label">{t.settingsTooltipHowTo}</span>
                      <span className="settings-achievement-tooltip-text">{t.achievementCatalog[a.id]?.description ?? a.description}</span>
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
