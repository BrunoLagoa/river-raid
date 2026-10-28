import React, { useState } from 'react'
import type { GameSettings } from '../game/SettingsService'
import type { Strings } from '../i18n'
import type { Achievement } from '../game/AchievementService'
import { KeybindingModal } from './KeybindingModal'

interface SettingsScreenProps {
  settings: GameSettings
  achievements: Achievement[]
  t: Strings
  onUpdate: (patch: Partial<GameSettings>) => void
  onBack: () => void
  onPlay: () => void
}

interface SettingsSliderProps {
  id: string
  label: string
  value: number
  onChange: (value: number) => void
}

/**
 * Slider row with a real `<label for>` association. The percentage used to be
 * a plain sibling div, so assistive tech announced four anonymous sliders.
 */
function SettingsSlider({ id, label, value, onChange }: SettingsSliderProps) {
  const percent = Math.round(value * 100)

  return (
    <div className="settings-row settings-row--slider">
      <label className="settings-row-label" htmlFor={id}>
        {label}
        <span className="settings-value">{percent}%</span>
      </label>
      <input
        id={id}
        type="range"
        min={0}
        max={100}
        value={percent}
        onChange={(e) => onChange(Number(e.target.value) / 100)}
        className="settings-slider"
        style={{ '--val': `${percent}` } as React.CSSProperties}
      />
    </div>
  )
}

export default function SettingsScreen({ settings, achievements, t, onUpdate, onBack, onPlay }: SettingsScreenProps) {
  const [isKeybindOpen, setIsKeybindOpen] = useState(false)

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
          <section className="settings-section">
            <h2 className="settings-section-title">{t.settingsSectionAudio}</h2>
          <SettingsSlider
            id="settings-master-volume"
            label={t.settingsLabelVolume}
            value={settings.masterVolume}
            onChange={(masterVolume) => onUpdate({ masterVolume })}
          />

          <SettingsSlider
            id="settings-music-volume"
            label={t.settingsLabelMusicVolume}
            value={settings.musicVolume}
            onChange={(musicVolume) => onUpdate({ musicVolume })}
          />

          <SettingsSlider
            id="settings-sfx-volume"
            label={t.settingsLabelSfxVolume}
            value={settings.sfxVolume}
            onChange={(sfxVolume) => onUpdate({ sfxVolume })}
          />

          <SettingsSlider
            id="settings-voice-volume"
            label={t.settingsLabelVoiceVolume}
            value={settings.voiceVolume}
            onChange={(voiceVolume) => onUpdate({ voiceVolume })}
          />

          </section>

          <section className="settings-section">
            <h2 className="settings-section-title">{t.settingsSectionGameplay}</h2>
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

            <label className="settings-toggle">
              <input
                type="checkbox"
                checked={settings.hapticsEnabled}
                onChange={(e) => onUpdate({ hapticsEnabled: e.target.checked })}
                className="settings-checkbox"
              />
              <span className="settings-toggle-track" />
              <span className="settings-toggle-label">{t.settingsLabelHaptics}</span>
            </label>

            <label className="settings-toggle">
              <input
                type="checkbox"
                checked={settings.ghostReplay}
                onChange={(e) => onUpdate({ ghostReplay: e.target.checked })}
                className="settings-checkbox"
              />
              <span className="settings-toggle-track" />
              <span className="settings-toggle-label">{t.settingsLabelGhostReplay}</span>
            </label>

            <label className="settings-toggle">
              <input
                type="checkbox"
                checked={settings.introCinematic}
                onChange={(e) => onUpdate({ introCinematic: e.target.checked })}
                className="settings-checkbox"
              />
              <span className="settings-toggle-track" />
              <span className="settings-toggle-label">{t.settingsLabelIntro}</span>
            </label>
          </div>

          </section>

          <section className="settings-section">
            <h2 className="settings-section-title">{t.settingsLabelControls}</h2>

          <div className="settings-row settings-row--inline">
            <span className="settings-row-title">{t.settingsLabelKeyboard}</span>
            <button
              type="button"
              onClick={() => setIsKeybindOpen(true)}
              className="menu-btn menu-btn--ghost menu-btn--compact"
            >
              ⌨ {t.settingsBtnConfigureKeys}
            </button>
          </div>

          <div className="settings-selects">
            <div className="settings-select-group">
              <label className="settings-select-label" htmlFor="settings-mobile-control">{t.settingsLabelMobileControl}</label>
              <select
                id="settings-mobile-control"
                value={settings.mobileControlMode}
                onChange={(e) => onUpdate({ mobileControlMode: e.target.value as GameSettings['mobileControlMode'] })}
                className="settings-select"
              >
                <option value="joystick">{t.mobileControlJoystick}</option>
                <option value="dpad">{t.mobileControlDpad}</option>
                <option value="swipe">{t.mobileControlSwipe}</option>
              </select>
            </div>

            <div className="settings-select-group">
              <label className="settings-select-label" htmlFor="settings-difficulty">{t.settingsLabelDifficulty}</label>
              <select
                id="settings-difficulty"
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
              <label className="settings-select-label" htmlFor="settings-objective-profile">{t.settingsLabelObjectiveProfile}</label>
              <select
                id="settings-objective-profile"
                value={settings.objectiveBalanceProfile}
                onChange={(e) => onUpdate({ objectiveBalanceProfile: e.target.value as GameSettings['objectiveBalanceProfile'] })}
                className="settings-select"
              >
                <option value="conservative">{t.settingsProfileConservative}</option>
                <option value="aggressive">{t.settingsProfileAggressive}</option>
              </select>
            </div>

            <div className="settings-select-group">
              <label className="settings-select-label" htmlFor="settings-language">{t.settingsLabelLanguage}</label>
              <select
                id="settings-language"
                value={settings.language}
                onChange={(e) => onUpdate({ language: e.target.value as GameSettings['language'] })}
                className="settings-select"
              >
                <option value="en">{t.settingsLangEn}</option>
                <option value="pt-BR">{t.settingsLangPt}</option>
              </select>
            </div>
          </div>

          </section>

          <section className="settings-section">
            <h2 className="settings-section-title">{t.settingsLabelAchievements}</h2>
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
          </section>
        </div>

        <div className="menu-actions settings-actions">
          <button className="menu-btn menu-btn--ghost" onClick={onBack}>{t.settingsBtnBack}</button>
          <button className="menu-btn menu-btn--primary" onClick={onPlay}>
            <span className="menu-btn-arrow">▶</span>{t.settingsBtnPlay}
          </button>
        </div>
      </div>

      <KeybindingModal
        isOpen={isKeybindOpen}
        onClose={() => setIsKeybindOpen(false)}
        currentBindings={settings.keybindings}
        onSave={(keybindings) => onUpdate({ keybindings })}
        locale={t}
      />
    </div>
  )
}
