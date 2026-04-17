# AGENTS.md

## Fast facts
- Single-package Vite + React + TypeScript project (not a monorepo).
- Main runtime wiring: `src/main.tsx` -> `src/App.tsx` -> `src/components/GameCanvas.tsx` -> `src/game/Game.ts`.
- Game loop and gameplay live in `src/game/*`; React is shell/menu/settings/gameover UI only.

## Verified commands
- Install: `npm install`
- Dev server: `npm run dev`
- Build (typecheck + bundle): `npm run build`
- Typecheck only: `npm run typecheck`
- Lint: `npm run lint`
- Tests once: `npm test`
- Tests watch: `npm run test:watch`
- Coverage: `npm run test:coverage`
- Preview prod build: `npm run preview`

## Tooling quirks that matter
- Node version drift exists: `.nvmrc` says `24`, GitHub Actions deploy uses Node `22` (`.github/workflows/deploy.yml`). Keep changes compatible with both unless intentionally updating runtime policy.
- Vite base path is hardcoded to GitHub Pages repo path: `base: '/river-raid/'` in `vite.config.ts`.
- Deploy workflow copies `dist/index.html` to `dist/404.html` for SPA fallback; preserve this if touching deploy/build flow.
- Path alias `@/*` -> `src/*` is configured in both `vite.config.ts` and `tsconfig.app.json`; keep both in sync.

## Testing and coverage specifics
- Vitest config is inside `vite.config.ts` (no separate `vitest.config.*`).
- Test environment is `jsdom` with `globals: true`.
- Coverage thresholds are enforced (55 statements/functions/lines, 35 branches).
- Coverage include list is explicit and limited to core engine files (`Game`, `World`, `Player`, `EnemyManager`, `FuelSystem`, `CollisionSystem`); new files are not auto-included unless added there.

## Lint/typecheck specifics
- ESLint uses flat config (`eslint.config.js`) with TS + React Hooks + React Refresh rules.
- ESLint globally ignores `dist` and `coverage`.
- TypeScript project references are used (`tsconfig.json` references app + node configs); `npm run build` runs `tsc -b` before Vite build.

## Docs and spec sources
- Product/spec docs are `Readme.md`, `prd.md`, `spec.md`, and `introducion.md`.
- `introducion.md` filename is intentionally misspelled; use that exact name when searching/editing.
