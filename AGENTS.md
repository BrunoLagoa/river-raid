# AGENTS.md

## Fast facts
- Single-package Vite + React + TypeScript project (not a monorepo).
- Main runtime wiring: `src/main.tsx` -> `src/App.tsx` -> `src/components/GameCanvas.tsx` -> `src/game/Game.ts`.
- Game loop and gameplay live in `src/game/*`; React is shell/menu/settings/gameover UI only.

## Working agreement for agents
- Only edit what is requested; avoid broad refactors in `src/game/*` when a UI-only change is asked.
- Prefer minimal, targeted changes and keep public behavior stable unless the request explicitly asks for behavior changes.
- When adding gameplay features, update tests in the same engine area (`src/game/*.test.ts`) in the same change.
- If a new core gameplay file should count for coverage gates, also update coverage include config in `vite.config.ts`.

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
1. Run `npm run typecheck` after code edits.
2. Run focused tests (for touched files) with `npm test`.
3. Run `npm run build` before finishing larger changes.

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

## Link-first references
- Product overview: [Readme.md](Readme.md)
- Product requirements: [prd.md](prd.md)
- Implementation spec: [spec.md](spec.md)
- Planning notes: [plan.md](plan.md)
- Extra suggestions: [sugest.md](sugest.md)

---

# context-mode — MANDATORY routing rules

context-mode MCP tools available. Rules protect context window from flooding. One unrouted command dumps 56 KB into context.

## Think in Code — MANDATORY

Analyze/count/filter/compare/search/parse/transform data: **write code** via `context-mode_ctx_execute(language, code)`, `console.log()` only the answer. Do NOT read raw data into context. PROGRAM the analysis, not COMPUTE it. Pure JavaScript — Node.js built-ins only (`fs`, `path`, `child_process`). `try/catch`, handle `null`/`undefined`. One script replaces ten tool calls.

## BLOCKED — do NOT attempt

### curl / wget — BLOCKED
Shell `curl`/`wget` intercepted and blocked. Do NOT retry.
Use: `context-mode_ctx_fetch_and_index(url, source)` or `context-mode_ctx_execute(language: "javascript", code: "const r = await fetch(...)")`

### Inline HTTP — BLOCKED
`fetch('http`, `requests.get(`, `requests.post(`, `http.get(`, `http.request(` — intercepted. Do NOT retry.
Use: `context-mode_ctx_execute(language, code)` — only stdout enters context

### Direct web fetching — BLOCKED
Use: `context-mode_ctx_fetch_and_index(url, source)` then `context-mode_ctx_search(queries)`

## REDIRECTED — use sandbox

### Shell (>20 lines output)
Shell ONLY for: `git`, `mkdir`, `rm`, `mv`, `cd`, `ls`, `npm install`, `pip install`.
Otherwise: `context-mode_ctx_batch_execute(commands, queries)` or `context-mode_ctx_execute(language: "shell", code: "...")`

### File reading (for analysis)
Reading to **edit** → reading correct. Reading to **analyze/explore/summarize** → `context-mode_ctx_execute_file(path, language, code)`.

### grep / search (large results)
Use `context-mode_ctx_execute(language: "shell", code: "grep ...")` in sandbox.

## Tool selection

0. **MEMORY**: `context-mode_ctx_search(sort: "timeline")` — after resume, check prior context before asking user.
1. **GATHER**: `context-mode_ctx_batch_execute(commands, queries)` — runs all commands, auto-indexes, returns search. ONE call replaces 30+. Each command: `{label: "header", command: "..."}`.
2. **FOLLOW-UP**: `context-mode_ctx_search(queries: ["q1", "q2", ...])` — all questions as array, ONE call (default relevance mode).
3. **PROCESSING**: `context-mode_ctx_execute(language, code)` | `context-mode_ctx_execute_file(path, language, code)` — sandbox, only stdout enters context.
4. **WEB**: `context-mode_ctx_fetch_and_index(url, source)` then `context-mode_ctx_search(queries)` — raw HTML never enters context.
5. **INDEX**: `context-mode_ctx_index(content, source)` — store in FTS5 for later search.

## Parallel I/O batches

For multi-URL fetches or multi-API calls, **always** include `concurrency: N` (1-8):

- `context-mode_ctx_batch_execute(commands: [3+ network commands], concurrency: 5)` — gh, curl, dig, docker inspect, multi-region cloud queries
- `context-mode_ctx_fetch_and_index(requests: [{url, source}, ...], concurrency: 5)` — multi-URL batch fetch

**Use concurrency 4-8** for I/O-bound work (network calls, API queries). **Keep concurrency 1** for CPU-bound (npm test, build, lint) or commands sharing state (ports, lock files, same-repo writes).

GitHub API rate-limit: cap at 4 for `gh` calls.

## Output

Write artifacts to FILES — never inline. Return: file path + 1-line description.
Descriptive source labels for `search(source: "label")`.

## Session Continuity

Skills, roles, and decisions persist for the entire session. Do not abandon them as the conversation grows.

## Memory

Session history is persistent and searchable. On resume, search BEFORE asking the user:

| Need | Command |
|------|---------|
| What did we decide? | `context-mode_ctx_search(queries: ["decision"], source: "decision", sort: "timeline")` |
| What constraints exist? | `context-mode_ctx_search(queries: ["constraint"], source: "constraint")` |

DO NOT ask "what were we working on?" — SEARCH FIRST.
If search returns 0 results, proceed as a fresh session.

## ctx commands

| Command | Action |
|---------|--------|
| `ctx stats` | Call `stats` MCP tool, display full output verbatim |
| `ctx doctor` | Call `doctor` MCP tool, run returned shell command, display as checklist |
| `ctx upgrade` | Call `upgrade` MCP tool, run returned shell command, display as checklist |
| `ctx purge` | Call `purge` MCP tool with confirm: true. Warns before wiping knowledge base. |

After /clear or /compact: knowledge base and session stats preserved. Use `ctx purge` to start fresh.
