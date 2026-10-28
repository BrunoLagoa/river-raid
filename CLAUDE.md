# CLAUDE.md

Guia curto para agentes de IA. A fonte de verdade é [`AGENTS.md`](AGENTS.md); o
roadmap e o detalhamento por sprint ficam em [`docs/README.md`](docs/README.md)
e `docs/sprint-*.md`.

## Comandos

```bash
npm install
npm run dev            # Vite dev server
npm run typecheck      # tsc -b --force
npm run lint           # ESLint flat config
npm test               # vitest run
npm run test:watch
npm run test:coverage  # thresholds em vite.config.ts
npm run build          # tsc -b + vite build
npm run preview
```

Teste único/filtrado:

```bash
npx vitest run src/game/Player.test.ts
npx vitest run src/game/Game.test.ts -t "respawn"
```

`.nvmrc` pede Node 24; os workflows de CI/CD usam Node 22. Mantenha
compatibilidade com ambos.

## Arquitetura em uma tela

`src/main.tsx` → `src/App.tsx` → `src/components/GameCanvas.tsx` → `src/game/Game.ts`.

- React cuida de shell, menus, configurações e overlays. A engine é carregada
  sob demanda por `import('@/game/Game')` em `GameCanvas.tsx`.
- `GameCanvas` é a única ponte: cria o `Game` uma vez e propaga preferências por
  setters imperativos. Nenhum estado React participa do loop de 60 FPS.
- `Game` orquestra subsistemas. O loop é `loop → update(dt) → render()`.
- `dt` é o tempo real; `envDt` aplica slow motion ao mundo/inimigos/cenário.
  Escolha explicitamente qual dos dois um sistema novo consome.
- `CollisionSystem` é estático e recebe um `CollisionContext` com subsistemas e
  callbacks; não acessa `Game` diretamente.
- Hot paths não alocam por frame: `ObjectPool` (lista ativa O(1)), `SpatialGrid`,
  buffers e payloads de HUD reutilizados.
- Números de gameplay vivem em `src/game/constants.ts`.
- Persistência passa por `StorageService` (envelope versionado, ofuscação XOR e
  checksum FNV-1a; é integridade local, não criptografia). O fantasma usa
  `removeSecure` para limpar a chave.
- RNG é injetado (`RandomSource`); não use `Math.random()` em gameplay, ou o
  desafio diário e os testes seedados quebram.
- i18n fica em `src/i18n.ts` (`en`, `pt-BR`). Não hardcode texto de jogador em
  `src/game/`.
- Timers de respawn/game over usam `GameTimers`, que congela os prazos enquanto
  o jogo está pausado.
- Modais compartilham `src/components/Modal.tsx`: `role="dialog"`,
  `aria-modal`, Escape, foco inicial e focus trap.

## Testes e cobertura

- Configuração Vitest dentro de `vite.config.ts` (jsdom, `globals: true`).
- `test.setupFiles` carrega `src/test/setup.ts`, que substitui o contexto 2D do
  canvas no jsdom.
- Cobertura cobre `src/**/*.{ts,tsx}`; thresholds atuais: statements 82,
  branches 75, functions 75, lines 82.
- Helpers da engine: `test-helpers/canvas.ts`, `time.ts` e `audio.ts`.
- Ao mexer em um sistema de `src/game/`, atualize o `*.test.ts` correspondente na
  mesma mudança.

## Convenções

- Alias `@/*` → `src/*` em `vite.config.ts` e `tsconfig.app.json` (manter em
  sincronia).
- `base: '/river-raid/'` no Vite para GitHub Pages.
- `__BUILD_VERSION__` versiona o service worker e o cache; não remova.
- Mudanças de UI não devem refatorar `src/game/*`, e vice-versa.
- Comentários e docs misturam pt-BR e inglês; siga o idioma predominante do
  arquivo em edição.
