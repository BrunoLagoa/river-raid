# AGENTS.md

## Fast facts
- Single-package Vite + React + TypeScript project (not a monorepo).
- Main runtime wiring: `src/main.tsx` -> `src/App.tsx` -> `src/components/GameCanvas.tsx` -> `src/game/Game.ts`.
- Game loop and gameplay live in `src/game/*`; React is shell/menu/settings/gameover UI only.

## Working agreement for agents
- Only edit what is requested; avoid broad refactors in `src/game/*` when a UI-only change is asked.
- Prefer minimal, targeted changes and keep public behavior stable unless the request explicitly asks for behavior changes.
- When adding gameplay features, update tests in the same engine area (`src/game/*.test.ts`) in the same change.
- Coverage includes all of `src/**`, so new engine files are gated automatically; keep them tested instead of adding exclusions.
- **Zero TypeScript Errors Mandatory**: Always analyze all created and modified `.ts`/`.tsx` files. Run `npm run typecheck` and `npm run build` (`tsc -b`) to ensure 100% type safety and strict compliance before completing any task.

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

## Suggested task flow
1. Run `npm run typecheck` and `npm run lint` after code edits.
2. Run focused tests (for touched files) with `npm test -- <path>` or `npx vitest run <path>`.
3. Run `npm run test:coverage` when touching engine code or coverage thresholds.
4. Run `npm run build` (`tsc -b` + vite build) before finishing any task to guarantee 0 TypeScript errors.

## Tooling quirks that matter
- Node version drift exists: `.nvmrc` says `24`, while both GitHub Actions workflows (`.github/workflows/ci.yml` and `deploy.yml`) use Node `22`. Keep changes compatible with both unless intentionally updating runtime policy.
- Vite base path is hardcoded to the GitHub Pages repo path: `base: '/river-raid/'` in `vite.config.ts`.
- `deploy.yml` copies `dist/index.html` to `dist/404.html` for the Pages SPA fallback; preserve this if touching deploy/build flow.
- `__BUILD_VERSION__` is injected by Vite `define` and used both in the service-worker registration URL and its cache name. A new deploy must change that value or the old cache can keep serving the previous build.
- Path alias `@/*` -> `src/*` is configured in both `vite.config.ts` and `tsconfig.app.json`; keep both in sync.

## Testing and coverage specifics
- Vitest config is inside `vite.config.ts` (no separate `vitest.config.*`).
- Test environment is `jsdom` with `globals: true`; `test.setupFiles` loads `src/test/setup.ts`, which stubs canvas 2D context for components.
- Coverage is measured over the whole source tree (`src/**/*.{ts,tsx}`), excluding tests, `src/game/test-helpers/**`, `src/test/**`, `src/main.tsx`, `src/globals.d.ts` and `src/i18n.ts`.
- Coverage thresholds are enforced at 82 statements, 75 branches, 75 functions and 82 lines.
- Engine tests use helpers in `src/game/test-helpers/` (`canvas.ts`, `time.ts`, `audio.ts`); component tests use Testing Library.

## Lint/typecheck specifics
- ESLint uses flat config (`eslint.config.js`) with TS + React Hooks + React Refresh rules.
- ESLint globally ignores `dist` and `coverage`.
- TypeScript project references are used (`tsconfig.json` references app + node configs); `npm run build` runs `tsc -b` before the Vite build.
- The engine is lazy-loaded from `GameCanvas.tsx` (`import('@/game/Game')`), keeping it out of the initial menu chunk.

## Docs and spec sources
- Product overview: `Readme.md`.
- Sprint roadmap and status: `docs/README.md`.
- Per-sprint implementation notes: `docs/sprint-*.md`.
- Agent architecture guide: `AGENTS.md` (this file); `CLAUDE.md` is a short pointer to it.

## Link-first references
- Product overview: [Readme.md](Readme.md)
- Roadmap and sprint index: [docs/README.md](docs/README.md)
- Latest completed sprint: [docs/sprint-9-intro-cinematic.md](docs/sprint-9-intro-cinematic.md)
- CI workflow: [.github/workflows/ci.yml](.github/workflows/ci.yml)
- Deploy workflow: [.github/workflows/deploy.yml](.github/workflows/deploy.yml)
