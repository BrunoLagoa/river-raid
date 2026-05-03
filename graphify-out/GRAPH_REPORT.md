# Graph Report - .  (2026-04-23)

## Corpus Check
- 65 files · ~60,170 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 461 nodes · 735 edges · 23 communities detected
- Extraction: 81% EXTRACTED · 19% INFERRED · 0% AMBIGUOUS · INFERRED: 137 edges (avg confidence: 0.81)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- [[_COMMUNITY_Docs & Services Index|Docs & Services Index]]
- [[_COMMUNITY_Game Loop & FX|Game Loop & FX]]
- [[_COMMUNITY_Collision System|Collision System]]
- [[_COMMUNITY_Enemy Manager|Enemy Manager]]
- [[_COMMUNITY_Achievement & Ranking|Achievement & Ranking]]
- [[_COMMUNITY_Objective System|Objective System]]
- [[_COMMUNITY_Game Lifecycle|Game Lifecycle]]
- [[_COMMUNITY_Atmosphere & Visuals|Atmosphere & Visuals]]
- [[_COMMUNITY_Object Pool & Reset|Object Pool & Reset]]
- [[_COMMUNITY_Fuel System|Fuel System]]
- [[_COMMUNITY_World  River Generation|World / River Generation]]
- [[_COMMUNITY_Debug Panel|Debug Panel]]
- [[_COMMUNITY_Scenery|Scenery]]
- [[_COMMUNITY_Audio Mocks|Audio Mocks]]
- [[_COMMUNITY_Enemy Renderer|Enemy Renderer]]
- [[_COMMUNITY_Scoring & Combo|Scoring & Combo]]
- [[_COMMUNITY_HUD  UI|HUD / UI]]
- [[_COMMUNITY_Build & Coverage Config|Build & Coverage Config]]
- [[_COMMUNITY_Agent & Docs Rationale|Agent & Docs Rationale]]
- [[_COMMUNITY_Canvas Test Helpers|Canvas Test Helpers]]
- [[_COMMUNITY_Visual Polish Notes|Visual Polish Notes]]
- [[_COMMUNITY_Spec Current State|Spec Current State]]
- [[_COMMUNITY_Spec Architecture Overview|Spec Architecture Overview]]

## God Nodes (most connected - your core abstractions)
1. `Game` - 44 edges
2. `EnemyManager` - 34 edges
3. `ObjectiveSystem` - 24 edges
4. `SoundManager` - 20 edges
5. `World` - 19 edges
6. `Fx` - 16 edges
7. `Player` - 16 edges
8. `DebugPanel` - 16 edges
9. `Scenery` - 14 edges
10. `FuelSystem` - 11 edges

## Surprising Connections (you probably didn't know these)
- `HUD: Fuel Bar (top-right, green bar at 42%)` --conceptually_related_to--> `FuelSystem.ts: Fuel Drain, Pickups, Bridge Drops`  [INFERRED]
  public/preview.png → spec.md
- `HUD: Score Display (top-left, green text)` --conceptually_related_to--> `ScoringSystem.ts: Score and Combo Logic (extracted from Game.ts)`  [INFERRED]
  public/preview.png → spec.md
- `index.html SPA Entry Point` --references--> `Favicon SVG: Purple Lightning Bolt Icon (OpenCode brand purple)`  [EXTRACTED]
  index.html → public/favicon.svg
- `Technical Architecture Stack (React+Vite+TS+Canvas)` --conceptually_related_to--> `Tech Stack: React 19 + Vite 8 + TypeScript 6 + Canvas + Vitest 4`  [INFERRED]
  prd.md → Readme.md
- `Combo Multiplier System (1x-4x, decay, miss penalty)` --conceptually_related_to--> `ScoringSystem.ts: Score and Combo Logic (extracted from Game.ts)`  [INFERRED]
  Readme.md → spec.md

## Hyperedges (group relationships)
- **Core Game Engine Modules** — game_ts, player_ts, enemy_manager_ts, world_ts, collision_system_ts, fuel_system_ts [EXTRACTED 0.95]
- **Modules Extracted via Refactoring B** — scoring_system_ts, game_state_ts, object_pool_ts, enemy_renderer_ts, constants_ts, spatial_grid_ts [EXTRACTED 1.00]
- **React Shell Components** — main_tsx, app_tsx, game_canvas_tsx [EXTRACTED 1.00]
- **Persistent Storage Modules** — ranking_service_ts, storage_service_ts, settings_service_ts, achievement_service_ts [INFERRED 0.85]
- **PRD Roadmap Implementation Phases 1-4** — prd_roadmap, spec_improvement_approach_a, spec_improvement_approach_b, spec_improvement_approach_c, spec_improvement_approach_d [INFERRED 0.80]

## Communities

### Community 0 - "Docs & Services Index"
Cohesion: 0.04
Nodes (65): AchievementService.ts: Achievement Unlock & Storage, Runtime Wiring: main.tsx→App.tsx→GameCanvas.tsx→Game.ts, App.tsx: Shell, Screen Management (menu/game/gameover/ranking), Atmosphere.ts: Day/Night Cycle, Clouds, CRT Scanlines, CollisionSystem.ts: AABB Collision with Spatial Grid Broad-Phase, constants.ts: Shared Game Balance Parameters, EnemyManager.ts: AI and Spawn of 4 Enemy Types, EnemyRenderer.ts: Dedicated Enemy Render (extracted from EnemyManager) (+57 more)

### Community 1 - "Game Loop & FX"
Cohesion: 0.06
Nodes (2): Game, GameState

### Community 2 - "Collision System"
Cohesion: 0.11
Nodes (3): CollisionSystem, Fx, SpatialGrid

### Community 3 - "Enemy Manager"
Cohesion: 0.11
Nodes (1): EnemyManager

### Community 4 - "Achievement & Ranking"
Cohesion: 0.13
Nodes (21): getStoredAchievements(), resetAchievements(), unlockAchievement(), isObjectiveBalanceProfile(), getStoredRanking(), qualifiesForRanking(), saveStoredRankingEntry(), getStoredSettings() (+13 more)

### Community 5 - "Objective System"
Cohesion: 0.19
Nodes (1): ObjectiveSystem

### Community 6 - "Game Lifecycle"
Cohesion: 0.17
Nodes (1): SoundManager

### Community 7 - "Atmosphere & Visuals"
Cohesion: 0.16
Nodes (10): Atmosphere, lerpN(), lerpPaletteRaw(), lerpRGB(), lerpRGBA(), makeCloud(), rawToPalette(), smoothstep() (+2 more)

### Community 8 - "Object Pool & Reset"
Cohesion: 0.11
Nodes (2): ObjectPool, Player

### Community 9 - "Fuel System"
Cohesion: 0.1
Nodes (3): FuelSystem, PowerUpSystem, compactArray()

### Community 10 - "World / River Generation"
Cohesion: 0.2
Nodes (1): World

### Community 11 - "Debug Panel"
Cohesion: 0.16
Nodes (1): DebugPanel

### Community 12 - "Scenery"
Cohesion: 0.19
Nodes (2): pickType(), Scenery

### Community 13 - "Audio Mocks"
Cohesion: 0.18
Nodes (7): FakeAudioBuffer, FakeAudioContext, FakeAudioParam, FakeBiquadFilterNode, FakeBufferSourceNode, FakeGainNode, FakeOscillatorNode

### Community 14 - "Enemy Renderer"
Cohesion: 0.39
Nodes (1): EnemyRenderer

### Community 15 - "Scoring & Combo"
Cohesion: 0.33
Nodes (1): ScoringSystem

### Community 16 - "HUD / UI"
Cohesion: 0.47
Nodes (1): UI

### Community 17 - "Build & Coverage Config"
Cohesion: 0.5
Nodes (3): Coverage Config: 55% thresholds, explicit include list in vite.config.ts, AGENTS.md: Architecture Fast Facts & Agent Working Agreement, Approach A: Stabilization & Quality (tests, lint, coverage thresholds)

### Community 18 - "Agent & Docs Rationale"
Cohesion: 0.5
Nodes (4): Rationale: React Shell + Pure Canvas Engine Separation (no framework in game loop), Game Engine: src/game/* Pure TypeScript Modules, DebugPanel Implementation (FPS, frame time, entity count, toggle via D key), Sugest: Improvement Areas (tests, mobile, performance, accessibility, debug, polish)

### Community 20 - "Canvas Test Helpers"
Cohesion: 1.0
Nodes (2): createMockCanvas(), createMockContext2D()

### Community 47 - "Visual Polish Notes"
Cohesion: 1.0
Nodes (1): Visual Polish: Screen Shake, Smoke Trail, Parallax Clouds, CRT Scanlines

### Community 48 - "Spec Current State"
Cohesion: 1.0
Nodes (1): Spec: Current Project State (~4130 LOC, 16 modules, phases 1-4 done)

### Community 49 - "Spec Architecture Overview"
Cohesion: 1.0
Nodes (1): Spec: Architecture Overview (God class Game.ts, EnemyManager, CollisionSystem)

## Knowledge Gaps
- **37 isolated node(s):** `FakeAudioParam`, `FakeGainNode`, `FakeOscillatorNode`, `FakeBufferSourceNode`, `FakeBiquadFilterNode` (+32 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **Thin community `Game Loop & FX`** (46 nodes): `.updateMetrics()`, `.flash()`, `.smokeTrail()`, `Game`, `.bindGlobalInput()`, `.comboAnimTimer()`, `.comboLevelTimer()`, `.comboMultiplier()`, `.consecutiveHits()`, `.constructor()`, `.decayCombo()`, `.gameTime()`, `.getHighScore()`, `.handleAliveState()`, `.handlePlayerDeath()`, `.lives()`, `.pollGamepad()`, `.registerMiss()`, `.renderSmokeTrail()`, `.resolveGameplayCollisions()`, `.saveHighScore()`, `.score()`, `.scrollSpeed()`, `.setGamepadEnabled()`, `.setObjectiveBalanceProfile()`, `.setOnGameOver()`, `.setReducedMotion()`, `.simulateKey()`, `.slowMotionTimer()`, `.togglePause()`, `.triggerGameOver()`, `.update()`, `.updateDebugMetrics()`, `.updateFrameState()`, `.updateGameplaySystems()`, `.updateNonInteractiveStates()`, `.updateWorldAndPlayer()`, `GameState`, `.getEnvDt()`, `.reset()`, `.updateSpeed()`, `.updateTime()`, `.explode()`, `.updateEngine()`, `Game.ts`, `GameState.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Enemy Manager`** (35 nodes): `EnemyManager`, `.activeBulletCount()`, `.activeEnemyCount()`, `.bullets()`, `.canSpawnAnyMore()`, `.chooseLaneIntent()`, `.clampToSafeBounds()`, `.constructor()`, `.countByType()`, `.enemies()`, `.getActiveEnemyCap()`, `.getLaneTargetX()`, `.getMaxSpawnsPerCycle()`, `.getNextLaneCooldown()`, `.getSafeBounds()`, `.getSpawnRisk()`, `.getTierAmplitudeMult()`, `.getTierBulletSpeedMult()`, `.getTierCenterSteer()`, `.getTierLaneWeight()`, `.getTierOriginRecenter()`, `.getTierPhaseSpeedMult()`, `.getTierRecoverPush()`, `.getTierShootIntervalMult()`, `.getTierShootRandomMult()`, `.getTypeCap()`, `.hasSpawnSpace()`, `.render()`, `.resolveAiTier()`, `.resolveLaneFromX()`, `.setCanvasHeight()`, `.spawn()`, `.update()`, `.acquire()`, `EnemyManager.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Objective System`** (24 nodes): `ObjectiveSystem`, `.completeCurrentObjective()`, `.constructor()`, `.createBridgeObjective()`, `.createComboObjective()`, `.createEnemyKillObjective()`, `.createFuelPickupObjective()`, `.createObjective()`, `.createRiverSurvivalObjective()`, `.createScoreTargetObjective()`, `.createTimedEnemyObjective()`, `.failCurrentObjective()`, `.formatProgressText()`, `.getHudData()`, `.onEnemyDestroyed()`, `.onFuelCollected()`, `.onRiverFrame()`, `.onScoreGained()`, `.pickWeightedObjective()`, `.randomInt()`, `.randomRange()`, `.reset()`, `.setProfile()`, `.update()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Game Lifecycle`** (24 nodes): `.reset()`, `.destroy()`, `.restart()`, `.setMasterVolume()`, `.start()`, `.stop()`, `.attachInput()`, `.detachInput()`, `SoundManager`, `.destroy()`, `.ensureCtx()`, `.gameOver()`, `.init()`, `.lowFuelBeep()`, `.playMusicStep()`, `.resume()`, `.setVolume()`, `.shoot()`, `.startEngine()`, `.startMusic()`, `.stopEngine()`, `.stopMusic()`, `.toggleMute()`, `SoundManager.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Object Pool & Reset`** (21 nodes): `.reset()`, `.setTouchPosition()`, `ObjectPool`, `.activeItems()`, `.all()`, `.constructor()`, `.resetAll()`, `Player`, `.bullets()`, `.constructor()`, `.render()`, `.renderExplosion()`, `.renderShield()`, `.renderShip()`, `.reset()`, `.resize()`, `.respawn()`, `.setTouchTarget()`, `.update()`, `ObjectPool.ts`, `Player.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `World / River Generation`** (20 nodes): `World.ts`, `World`, `.advanceGenState()`, `.beginHold()`, `.beginTransition()`, `.clampToRiver()`, `.constructor()`, `.fastSin()`, `.generateInitialSegments()`, `.getBoundsAtY()`, `.initWaveCache()`, `.isOutOfBounds()`, `.makeSegment()`, `.pickNewTarget()`, `.rebuildVisibleSegmentsCache()`, `.rebuildWaveSamples()`, `.render()`, `.reset()`, `.stepBanks()`, `.update()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Debug Panel`** (16 nodes): `DebugPanel`, `.endFrame()`, `.endRender()`, `.endUpdate()`, `.getAverage()`, `.getMax()`, `.getMin()`, `.isEnabled()`, `.onKeyDown()`, `.render()`, `.reset()`, `.startFrame()`, `.startRender()`, `.startUpdate()`, `.toggle()`, `DebugPanel.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Scenery`** (16 nodes): `pickType()`, `Scenery`, `.activeCount()`, `.constructor()`, `.render()`, `.renderBush()`, `.renderFuelTank()`, `.renderHouse()`, `.renderPalm()`, `.renderRock()`, `.renderTree()`, `.reset()`, `.setCanvasHeight()`, `.spawn()`, `.update()`, `Scenery.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Enemy Renderer`** (9 nodes): `EnemyRenderer`, `.render()`, `.renderBoat()`, `.renderBridge()`, `.renderGunboat()`, `.renderHelicopter()`, `.renderPlane()`, `.renderTank()`, `EnemyRenderer.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Scoring & Combo`** (7 nodes): `ScoringSystem`, `.decayCombo()`, `.registerHit()`, `.registerMiss()`, `.reset()`, `.update()`, `ScoringSystem.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `HUD / UI`** (6 nodes): `UI.ts`, `UI`, `.drawMiniPlane()`, `.render()`, `.renderMinimap()`, `.resize()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Canvas Test Helpers`** (3 nodes): `createMockCanvas()`, `createMockContext2D()`, `canvas.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Visual Polish Notes`** (1 nodes): `Visual Polish: Screen Shake, Smoke Trail, Parallax Clouds, CRT Scanlines`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Spec Current State`** (1 nodes): `Spec: Current Project State (~4130 LOC, 16 modules, phases 1-4 done)`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Spec Architecture Overview`** (1 nodes): `Spec: Architecture Overview (God class Game.ts, EnemyManager, CollisionSystem)`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `Game` connect `Game Loop & FX` to `Collision System`, `Game Lifecycle`, `Atmosphere & Visuals`, `Object Pool & Reset`, `Fuel System`?**
  _High betweenness centrality (0.253) - this node is a cross-community bridge._
- **Why does `ObjectiveSystem` connect `Objective System` to `Achievement & Ranking`?**
  _High betweenness centrality (0.056) - this node is a cross-community bridge._
- **What connects `FakeAudioParam`, `FakeGainNode`, `FakeOscillatorNode` to the rest of the system?**
  _37 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Docs & Services Index` be split into smaller, more focused modules?**
  _Cohesion score 0.04 - nodes in this community are weakly interconnected._
- **Should `Game Loop & FX` be split into smaller, more focused modules?**
  _Cohesion score 0.06 - nodes in this community are weakly interconnected._
- **Should `Collision System` be split into smaller, more focused modules?**
  _Cohesion score 0.11 - nodes in this community are weakly interconnected._
- **Should `Enemy Manager` be split into smaller, more focused modules?**
  _Cohesion score 0.11 - nodes in this community are weakly interconnected._