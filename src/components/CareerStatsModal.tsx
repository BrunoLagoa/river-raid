import React, { useState } from 'react'
import { CareerStatsService, type CareerStats } from '../game/CareerStatsService'
import type { Strings } from '../i18n'

interface CareerStatsModalProps {
  isOpen: boolean
  onClose: () => void
  locale: Strings
}

const CareerStatsModalContent: React.FC<Omit<CareerStatsModalProps, 'isOpen'>> = ({
  onClose,
  locale,
}) => {
  const [statsService] = useState(() => new CareerStatsService())
  const [stats, setStats] = useState<CareerStats>(() => statsService.getStats())
  const [confirmReset, setConfirmReset] = useState(false)

  const handleReset = (): void => {
    if (!confirmReset) {
      setConfirmReset(true)
      return
    }
    statsService.resetStats()
    setStats(statsService.getStats())
    setConfirmReset(false)
  }

  const accuracy = statsService.getAccuracyPercentage()
  const flightTime = statsService.getFormattedFlightTime()
  const totalKills = statsService.getTotalEnemiesDestroyed()

  const mainStats = [
    { label: locale.statsTotalFlightTime, value: flightTime, color: '#00e5ff' },
    { label: locale.statsTotalScore, value: stats.totalScoreAccumulated.toLocaleString(), color: '#facc15' },
    { label: locale.statsTotalRuns, value: stats.totalRuns.toLocaleString(), color: '#38bdf8' },
    { label: locale.statsTotalFuel, value: stats.totalFuelPickedUp.toLocaleString(), color: '#4ade80' },
    { label: locale.statsAccuracy, value: `${accuracy}%`, color: '#f472b6' },
    { label: locale.statsHighestCombo, value: `${stats.highestComboEver}x`, color: '#fb923c' },
    { label: locale.statsShotsFired, value: stats.totalShotsFired.toLocaleString(), color: '#94a3b8' },
    { label: locale.statsShotsHit, value: stats.totalShotsHit.toLocaleString(), color: '#a78bfa' },
  ]

  const killsBreakdown = [
    { label: locale.statsHelicoptersKilled, count: stats.enemiesKilled.helicopter, icon: '🚁' },
    { label: locale.statsPlanesKilled, count: stats.enemiesKilled.plane, icon: '✈️' },
    { label: locale.statsBoatsKilled, count: stats.enemiesKilled.boat, icon: '⛵' },
    { label: locale.statsGunboatsKilled, count: stats.enemiesKilled.gunboat, icon: '🚤' },
    { label: locale.statsTanksKilled, count: stats.enemiesKilled.tank, icon: '🛡️' },
    { label: locale.statsBridgesKilled, count: stats.enemiesKilled.bridge, icon: '🌉' },
    { label: locale.statsBossesKilled, count: stats.enemiesKilled.boss, icon: '👑' },
  ]

  return (
    <div
      data-testid="career-stats-backdrop"
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(5, 10, 20, 0.88)',
        backdropFilter: 'blur(6px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        padding: '20px',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '560px',
          backgroundColor: '#0c1424',
          border: '2px solid #00e5ff',
          borderRadius: '12px',
          boxShadow: '0 0 30px rgba(0, 229, 255, 0.25)',
          color: '#e2f1ff',
          fontFamily: "'Courier New', Courier, monospace",
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          maxHeight: '90vh',
        }}
      >
        {/* Header */}
        <div style={{ padding: '16px 20px', borderBottom: '1px solid rgba(0, 229, 255, 0.2)', textAlign: 'center' }}>
          <h2 style={{ margin: 0, fontSize: '20px', letterSpacing: '2px', color: '#00e5ff', textShadow: '0 0 10px rgba(0,229,255,0.5)' }}>
            {locale.statsTitle}
          </h2>
          <div style={{ fontSize: '11px', color: '#7ba0c0', letterSpacing: '1px', marginTop: '4px' }}>
            {locale.statsSubtitle}
          </div>
        </div>

        {/* Scrollable Content */}
        <div style={{ padding: '16px 20px', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Main Highlights Grid */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(2, 1fr)',
              gap: '10px',
            }}
          >
            {mainStats.map((item) => (
              <div
                key={item.label}
                style={{
                  backgroundColor: 'rgba(255, 255, 255, 0.03)',
                  border: '1px solid rgba(0, 229, 255, 0.1)',
                  borderRadius: '8px',
                  padding: '10px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '4px',
                }}
              >
                <span style={{ fontSize: '11px', color: '#94a3b8', letterSpacing: '0.5px' }}>{item.label}</span>
                <span style={{ fontSize: '18px', fontWeight: 'bold', color: item.color }}>{item.value}</span>
              </div>
            ))}
          </div>

          {/* Enemies Destroyed Breakdown */}
          <div
            style={{
              backgroundColor: 'rgba(0, 15, 30, 0.5)',
              border: '1px solid rgba(0, 229, 255, 0.15)',
              borderRadius: '8px',
              padding: '12px',
            }}
          >
            <div
              style={{
                fontSize: '12px',
                fontWeight: 'bold',
                color: '#00e5ff',
                letterSpacing: '1px',
                marginBottom: '10px',
                display: 'flex',
                justifyContent: 'space-between',
              }}
            >
              <span>{locale.statsTotalKills}</span>
              <span style={{ color: '#f87171' }}>{totalKills.toLocaleString()}</span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px' }}>
              {killsBreakdown.map((k) => (
                <div
                  key={k.label}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    fontSize: '12px',
                    color: '#cbd5e1',
                    padding: '4px 8px',
                    backgroundColor: 'rgba(255, 255, 255, 0.02)',
                    borderRadius: '4px',
                  }}
                >
                  <span>{k.icon} {k.label}</span>
                  <span style={{ fontWeight: 'bold', color: '#ffffff' }}>{k.count.toLocaleString()}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Confirm Reset Alert */}
          {confirmReset && (
            <div
              style={{
                backgroundColor: 'rgba(239, 68, 68, 0.15)',
                border: '1px solid #ef4444',
                borderRadius: '8px',
                padding: '10px 14px',
                fontSize: '12px',
                color: '#fca5a5',
                textAlign: 'center',
              }}
            >
              {locale.statsResetConfirm}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div
          style={{
            padding: '14px 20px',
            borderTop: '1px solid rgba(0, 229, 255, 0.2)',
            display: 'flex',
            justifyContent: 'space-between',
            gap: '12px',
          }}
        >
          <button
            type="button"
            data-testid="stats-reset-btn"
            onClick={handleReset}
            style={{
              padding: '10px 16px',
              fontSize: '12px',
              fontFamily: 'inherit',
              fontWeight: 'bold',
              letterSpacing: '1px',
              backgroundColor: confirmReset ? '#ef4444' : 'rgba(255, 70, 70, 0.15)',
              color: confirmReset ? '#ffffff' : '#ff6666',
              border: '1px solid rgba(255, 70, 70, 0.4)',
              borderRadius: '6px',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
          >
            {confirmReset ? 'CONFIRM RESET' : locale.statsBtnReset}
          </button>

          <button
            type="button"
            data-testid="stats-close-btn"
            onClick={onClose}
            style={{
              padding: '10px 24px',
              fontSize: '13px',
              fontFamily: 'inherit',
              fontWeight: 'bold',
              letterSpacing: '1px',
              backgroundColor: '#00e5ff',
              color: '#05101a',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              boxShadow: '0 0 15px rgba(0, 229, 255, 0.4)',
            }}
          >
            {locale.statsBtnClose}
          </button>
        </div>
      </div>
    </div>
  )
}

export const CareerStatsModal: React.FC<CareerStatsModalProps> = (props) => {
  if (!props.isOpen) return null
  return <CareerStatsModalContent {...props} />
}
