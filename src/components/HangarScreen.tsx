import React, { useState, useEffect, useRef } from 'react'
import { SkinService, type SkinId, type SkinDef } from '../game/SkinService'
import { PlayerSkinRenderer } from '../game/PlayerSkinRenderer'
import type { Strings } from '../i18n'

interface HangarScreenProps {
  onBack: () => void
  locale: Strings
  unlockedAchievements?: string[]
  highScore?: number
  onSkinChanged?: (skinId: SkinId) => void
}

export const HangarScreen: React.FC<HangarScreenProps> = ({
  onBack,
  locale,
  unlockedAchievements = [],
  highScore = 0,
  onSkinChanged,
}) => {
  const [skinService] = useState(() => new SkinService())
  const [skins] = useState<SkinDef[]>(() => skinService.getAllSkins())
  const [selectedIndex, setSelectedIndex] = useState(() => {
    const equipped = skinService.getEquippedSkinId()
    const idx = skins.findIndex(s => s.id === equipped)
    return idx >= 0 ? idx : 0
  })
  const [equippedId, setEquippedId] = useState<SkinId>(() => skinService.getEquippedSkinId())

  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const rendererRef = useRef(new PlayerSkinRenderer())
  const animFrameRef = useRef(0)

  const selectedSkin = skins[selectedIndex] ?? skins[0]
  const isUnlocked = skinService.isSkinUnlocked(selectedSkin.id, unlockedAchievements, highScore)
  const isEquipped = equippedId === selectedSkin.id

  // Mini canvas animation loop
  useEffect(() => {
    let rafId: number
    let lastTime = performance.now()

    const loop = (time: number): void => {
      if (time - lastTime > 120) {
        animFrameRef.current = (animFrameRef.current + 1) % 4
        lastTime = time
      }

      const canvas = canvasRef.current
      if (canvas) {
        const ctx = canvas.getContext('2d')
        if (ctx) {
          ctx.clearRect(0, 0, canvas.width, canvas.height)

          // Draw faint radar grid background
          ctx.strokeStyle = 'rgba(0, 229, 255, 0.12)'
          ctx.lineWidth = 1
          ctx.beginPath()
          ctx.arc(canvas.width / 2, canvas.height / 2, 45, 0, Math.PI * 2)
          ctx.arc(canvas.width / 2, canvas.height / 2, 80, 0, Math.PI * 2)
          ctx.moveTo(canvas.width / 2, 10)
          ctx.lineTo(canvas.width / 2, canvas.height - 10)
          ctx.moveTo(10, canvas.height / 2)
          ctx.lineTo(canvas.width - 10, canvas.height / 2)
          ctx.stroke()

          // Draw the aircraft skin in 3x scaled style
          ctx.save()
          ctx.translate(canvas.width / 2, canvas.height / 2)
          ctx.scale(2.4, 2.4)
          rendererRef.current.render(ctx, 0, 0, selectedSkin.id, animFrameRef.current, 0)
          ctx.restore()
        }
      }

      rafId = requestAnimationFrame(loop)
    }

    rafId = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(rafId)
  }, [selectedSkin.id])

  const handlePrev = (): void => {
    setSelectedIndex((prev) => (prev > 0 ? prev - 1 : skins.length - 1))
  }

  const handleNext = (): void => {
    setSelectedIndex((prev) => (prev < skins.length - 1 ? prev + 1 : 0))
  }

  const handleEquip = (): void => {
    if (!isUnlocked) return
    const success = skinService.setEquippedSkin(selectedSkin.id, unlockedAchievements, highScore)
    if (success) {
      setEquippedId(selectedSkin.id)
      onSkinChanged?.(selectedSkin.id)
    }
  }

  const getSkinName = (skin: SkinDef): string => {
    const key = skin.nameKey as keyof Strings
    return (locale[key] as string) ?? skin.id
  }

  const getSkinDesc = (skin: SkinDef): string => {
    const key = skin.descKey as keyof Strings
    return (locale[key] as string) ?? ''
  }

  const getRequirementDesc = (skin: SkinDef): string => {
    const key = skin.requirementDescKey as keyof Strings
    return (locale[key] as string) ?? ''
  }

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: '#050a14',
        backgroundImage: 'radial-gradient(ellipse at center, #0f1c33 0%, #050a14 100%)',
        color: '#e2f1ff',
        fontFamily: "'Courier New', Courier, monospace",
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
        zIndex: 100,
      }}
    >
      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: '20px' }}>
        <h1
          style={{
            margin: 0,
            fontSize: '28px',
            letterSpacing: '3px',
            color: '#00e5ff',
            textShadow: '0 0 15px rgba(0, 229, 255, 0.6)',
          }}
        >
          {locale.hangarTitle}
        </h1>
        <div style={{ fontSize: '13px', color: '#7ba0c0', letterSpacing: '2px', marginTop: '6px' }}>
          {locale.hangarSubtitle}
        </div>
      </div>

      {/* Main Hangar Display Card */}
      <div
        style={{
          width: '100%',
          maxWidth: '520px',
          backgroundColor: '#0c1424',
          border: `2px solid ${isEquipped ? '#00e5ff' : 'rgba(0, 229, 255, 0.3)'}`,
          borderRadius: '16px',
          boxShadow: isEquipped
            ? '0 0 35px rgba(0, 229, 255, 0.3)'
            : '0 0 20px rgba(0, 0, 0, 0.6)',
          padding: '24px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '16px',
          position: 'relative',
        }}
      >
        {/* Carousel Navigation Top Bar */}
        <div
          style={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <button
            type="button"
            data-testid="hangar-prev-btn"
            onClick={handlePrev}
            style={{
              background: 'rgba(0, 229, 255, 0.1)',
              border: '1px solid #00e5ff',
              color: '#00e5ff',
              fontSize: '20px',
              padding: '8px 16px',
              borderRadius: '8px',
              cursor: 'pointer',
              fontWeight: 'bold',
            }}
          >
            ‹
          </button>

          <div style={{ textAlign: 'center' }}>
            <h2
              style={{
                margin: 0,
                fontSize: '20px',
                color: isUnlocked ? '#ffffff' : '#94a3b8',
                letterSpacing: '1.5px',
              }}
            >
              {getSkinName(selectedSkin)}
            </h2>
            <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>
              {selectedIndex + 1} / {skins.length}
            </div>
          </div>

          <button
            type="button"
            data-testid="hangar-next-btn"
            onClick={handleNext}
            style={{
              background: 'rgba(0, 229, 255, 0.1)',
              border: '1px solid #00e5ff',
              color: '#00e5ff',
              fontSize: '20px',
              padding: '8px 16px',
              borderRadius: '8px',
              cursor: 'pointer',
              fontWeight: 'bold',
            }}
          >
            ›
          </button>
        </div>

        {/* Aircraft Preview Canvas */}
        <div
          style={{
            position: 'relative',
            width: '200px',
            height: '200px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: 'rgba(0, 10, 25, 0.7)',
            borderRadius: '12px',
            border: '1px solid rgba(0, 229, 255, 0.2)',
          }}
        >
          <canvas
            ref={canvasRef}
            width={200}
            height={200}
            data-testid="hangar-preview-canvas"
            style={{ width: '200px', height: '200px', imageRendering: 'pixelated' }}
          />

          {!isUnlocked && (
            <div
              style={{
                position: 'absolute',
                inset: 0,
                backgroundColor: 'rgba(5, 10, 20, 0.75)',
                borderRadius: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '32px',
              }}
            >
              🔒
            </div>
          )}
        </div>

        {/* Description & Requirements */}
        <div style={{ textAlign: 'center', width: '100%', minHeight: '60px' }}>
          <p style={{ margin: '0 0 8px 0', fontSize: '13px', color: '#93c5fd', lineHeight: '1.4' }}>
            {getSkinDesc(selectedSkin)}
          </p>

          <div
            style={{
              fontSize: '12px',
              fontWeight: 'bold',
              color: isUnlocked ? '#4ade80' : '#f87171',
              backgroundColor: isUnlocked ? 'rgba(74, 222, 128, 0.1)' : 'rgba(248, 113, 113, 0.1)',
              padding: '6px 12px',
              borderRadius: '6px',
              border: `1px solid ${isUnlocked ? 'rgba(74, 222, 128, 0.3)' : 'rgba(248, 113, 113, 0.3)'}`,
            }}
          >
            {isUnlocked ? '✓ ' + locale.settingsAchievementUnlocked : '🔒 ' + getRequirementDesc(selectedSkin)}
          </div>
        </div>

        {/* Equip / Status Button */}
        <button
          type="button"
          data-testid="hangar-equip-btn"
          onClick={handleEquip}
          disabled={!isUnlocked || isEquipped}
          style={{
            width: '100%',
            padding: '12px',
            fontSize: '14px',
            fontWeight: 'bold',
            letterSpacing: '1.5px',
            fontFamily: 'inherit',
            borderRadius: '8px',
            cursor: !isUnlocked || isEquipped ? 'default' : 'pointer',
            backgroundColor: isEquipped
              ? 'rgba(0, 229, 255, 0.15)'
              : isUnlocked
              ? '#00e5ff'
              : '#334155',
            color: isEquipped ? '#00e5ff' : isUnlocked ? '#05101a' : '#64748b',
            border: isEquipped ? '1px solid #00e5ff' : 'none',
            boxShadow: isUnlocked && !isEquipped ? '0 0 20px rgba(0, 229, 255, 0.4)' : 'none',
            transition: 'all 0.2s ease',
          }}
        >
          {isEquipped
            ? `★ ${locale.hangarBtnEquipped}`
            : isUnlocked
            ? locale.hangarBtnEquip
            : locale.hangarBtnLocked}
        </button>
      </div>

      {/* Back Button */}
      <button
        type="button"
        data-testid="hangar-back-btn"
        onClick={onBack}
        style={{
          marginTop: '20px',
          padding: '10px 28px',
          fontSize: '13px',
          fontWeight: 'bold',
          letterSpacing: '1.5px',
          fontFamily: 'inherit',
          backgroundColor: 'transparent',
          color: '#94a3b8',
          border: '1px solid rgba(148, 163, 184, 0.3)',
          borderRadius: '8px',
          cursor: 'pointer',
          transition: 'all 0.15s ease',
        }}
      >
        {locale.hangarBtnBack}
      </button>
    </div>
  )
}
