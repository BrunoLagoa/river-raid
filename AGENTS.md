# AGENTS.md

## Repo State

- Scaffolded Vite + React + TypeScript project. Full game engine implemented (Phases 1–3) + visual effects, sound, difficulty progression, pause/mute, high score persistence.
- `package.json`, `vite.config.ts`, `tsconfig.json` present. `src/game/` contains all engine modules.
- ESLint configured via `eslint.config.js`.
- No test framework configured yet. No CI yet.

## Source Of Truth

- `introducion.md` — detailed spec with module boundaries, gameplay mechanics, and code structure. This is the canonical reference for file names and module responsibilities.
- `prd.md` — product-level spec with phases, acceptance criteria, and architecture overview. Aligns with `introducion.md` on stack and scope.
- Both agree on: React + Vite + TypeScript + HTML5 Canvas.
- **Naming conflict:** `introducion.md` uses `Game.ts` for the main loop; `prd.md` uses `GameEngine.ts`. Follow `introducion.md` as canonical for module names.
- The root spec filename is misspelled as `introducion.md` (missing 'ç'). Account for this when searching.

## Intended Architecture

### Core Principle

React shell + modular game engine. Gameplay logic lives in pure TypeScript modules under `src/game/`. React only hosts the canvas element and renders the HUD overlay. Never put game loop or entity logic inside React render paths.

### Module Map (from `introducion.md`)

```
src/
  game/
    Game.ts              → main loop (requestAnimationFrame), orchestrates all systems, pause/mute/high-score
    Player.ts            → aircraft entity: position, movement, shooting, states (alive/exploding/dead)
    EnemyManager.ts      → spawn logic, enemy types (helicopters, planes, boats, bridges), difficulty scaling, enemy bullets
    World.ts             → procedural river generation: segments, curves, width variation, bank collision
    FuelSystem.ts        → fuel drain over time, fuel tank pickups, bridge fuel drops, UI data feed
    CollisionSystem.ts   → AABB collision detection (player↔enemies, player↔banks, bullets↔enemies, player↔fuel, player↔enemy bullets)
    Fx.ts                → particle pool, score popups, screen flash effects
    SoundManager.ts      → Web Audio API procedural sounds (shoot, explosion, fuel, enemy hit, game over), mute toggle
    UI.ts                → in-canvas HUD rendering (score, fuel bar, mute icon, pause overlay)
  components/
    GameCanvas.tsx        → mounts <canvas>, instantiates Game engine, bridges React ↔ engine lifecycle
  App.tsx                 → app shell: start screen, game screen, game-over screen (with high score + NEW BEST!), restart flow
```

### Data Flow

```
App.tsx (screen state: menu/playing/gameover, shows high score + NEW BEST!)
  └→ GameCanvas.tsx (canvas ref, engine lifecycle)
       └→ Game.ts (pure TS, owns requestAnimationFrame loop)
            ├→ World.ts      (river segments, scroll offset, dynamic speed)
            ├→ Player.ts     (input → position → bullets)
            ├→ EnemyManager  (spawn → update → cull, enemy bullets, dynamic speed)
            ├→ FuelSystem    (drain → check pickups, bridge fuel drops)
            ├→ CollisionSystem (AABB checks)
            ├→ Fx.ts         (particle explosions, score popups, screen flash)
            └→ UI.ts         (draw score, fuel bar, pause overlay, mute icon on canvas)
```

React never calls game methods during render. All communication is via the Game class instance methods called in effects or event handlers.

## Gameplay Spec Summary

- **Genre:** Vertical shooter (River Raid clone). Auto-scroll forward, horizontal movement, shooting, fuel management.
- **Player:** Aircraft moves horizontally within river banks. States: alive → exploding → dead.
- **Enemies:** Helicopters (lateral drift), enemy planes (straight), boats (slow), bridges (static obstacles). Progressive spawn with increasing difficulty.
- **Fuel:** Constant drain. Fuel tanks spawn on map. Player must fly over them to collect (do NOT shoot them).
- **Collision:** AABB. Player↔enemy = death. Player↔bank = death. Bullet↔enemy = destroy. Player↔fuel = collect.
- **Score:** Points for destroying enemies and bridges. Display in real time.
- **Game Over:** Collision or empty fuel. Restart without page reload.
- **Platforms:** Desktop browser (keyboard). Mobile browser support is a future goal, not MVP-blocking.

## Implementation Phases (from PRD)

### Phase 1 — Technical Base (scaffold)
- `npm create vite` with React + TypeScript template
- `vite.config.ts` with `@vitejs/plugin-react`
- Basic `App.tsx` shell with canvas mount point
- `GameCanvas.tsx` with canvas ref and resize handling
- `Game.ts` with requestAnimationFrame loop (empty update/render)
- `Player.ts` with keyboard input handling (arrow keys + space)

### Phase 2 — Playable MVP
- Player movement (horizontal within river bounds)
- Auto-scrolling world (vertical offset)
- Shooting system (bullets array, update, render)
- Basic AABB collision detection
- Initial HUD (score counter, fuel bar)

### Phase 3 — Complete Gameplay
- Enemy types and spawn system with difficulty scaling
- Fuel system (drain + tank pickups)
- Full scoring system
- Game over + restart flow
- Procedural river generation (varying width, curves, banks)

### Phase 4 — Polish (post-MVP)
- Sound effects (shoot, explosion, fuel collect)
- Explosion animations
- Pixel art sprites (or improved placeholders)
- Difficulty curve tuning

### Phase 5 — Extras (future)
- localStorage ranking
- Power-ups
- Improved mobile/touch support

## Tech Constraints

- **Canvas only** for gameplay rendering. React renders only the surrounding shell (menu, game-over overlay).
- **No heavy dependencies.** No Phaser, no PixiJS, no game framework. Pure Canvas 2D API.
- **Target 60 FPS.** Keep render and update logic lean. Avoid allocations in the hot loop.
- **TypeScript strict.** All game modules must be typed.
- **ESM only.** Vite config must use `vite.config.ts`, not `.js`.

## Repo-Local Skills

Load these skills when working on the corresponding tasks:

- **Scaffolding / Vite config:** load `vite` skill from `.agents/skills/vite/`
- **React components / HUD:** load `vercel-react-best-practices` skill from `.agents/skills/vercel-react-best-practices/`
- **UI visual design (start screen, game-over, menus):** load `frontend-design` skill from `.agents/skills/frontend-design/`
- **MCP Context7:** use for up-to-date Vite, React, and TypeScript docs when needed.

## Commands

```bash
# Dev
npm run dev

# Build
npm run build

# Preview
npm run preview

# Lint
npm run lint

# Typecheck
npx tsc -b
```

## Key Risks

1. **React↔Engine coupling** — PRD explicitly warns about this. Keep Game.ts framework-agnostic. React should only call `game.start()`, `game.stop()`, `game.restart()`.
2. **Procedural river generation** — most complex algorithmic challenge. Start simple (straight segments with width variation) before adding curves.
3. **Performance on weak devices** — avoid object allocation in the game loop; use object pools for bullets and particles.

## Practical Gotchas

- `introducion.md` is misspelled (missing 'ç'). Search for both `introducion` and `introdução`.
