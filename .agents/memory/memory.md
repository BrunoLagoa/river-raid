# River Raid — Memória do Projeto

## Nome do projeto
River Raid

## Descrição
Clone moderno do clássico River Raid (Atari 2600). Vertical shooter com auto-scroll, movimentação horizontal, tiros, gerenciamento de combustível, power-ups, combo multiplier, ciclo dia/noite e conquistas persistentes. Publicado no GitHub Pages.

## Stack principal

| Camada | Tecnologia |
|--------|-----------|
| Runtime | Browser (Canvas 2D) |
| Framework UI | React 19 |
| Build | Vite 8 + `@vitejs/plugin-react` |
| Linguagem | TypeScript 6 |
| Testes | Vitest + jsdom + Testing Library |
| Lint | ESLint 9 + typescript-eslint (flat config) |
| Deploy | GitHub Pages (workflow `.github/workflows/deploy.yml`) |
| Engine | Pura — sem frameworks de jogo externos |

## Estrutura de pastas (alto nível)

```
src/
  game/           → engine modular em TypeScript puro
  components/     → GameCanvas.tsx (ponte React ↔ engine)
  App.tsx         → shell: menu / jogo / gameover
  main.tsx        → entry point React
.agents/
  memory/         → memória Memflow persistente
  skills/         → skills do projeto
```

## Módulos da engine (`src/game/`)

| Arquivo | Responsabilidade |
|---------|-----------------|
| `Game.ts` | Loop principal (rAF), orquestração, pause/mute/high-score |
| `Player.ts` | Avião: posição, movimento, tiro, estados |
| `EnemyManager.ts` | Spawn, tipos de inimigos (helicópteros, aviões, barcos, pontes), balas |
| `World.ts` | Geração procedural do rio: segmentos, curvas, margens |
| `FuelSystem.ts` | Dreno de combustível, coleta de tanques, fuel de pontes |
| `CollisionSystem.ts` | Detecção de colisão AABB |
| `Fx.ts` | Pool de partículas, popups de score, flash e shake de tela |
| `SoundManager.ts` | Web Audio API procedural, música, toggle mute |
| `UI.ts` | HUD in-canvas + minimapa |
| `Scenery.ts` | Objetos decorativos (árvores, casas, rochas) |
| `StorageService.ts` | Abstração de localStorage |
| `RankingService.ts` | Lógica de ranking de high scores |
| `utils.ts` | Utilitários compartilhados |

## Diretrizes principais

- React é apenas shell/menu/settings/gameover — toda gameplay fica em `src/game/*`
- Arquitetura híbrida: React UI + engine Canvas 2D pura
- Alias `@/*` → `src/*` configurado em `vite.config.ts` e `tsconfig.app.json` (manter sincronizados)
- Base Vite configurada para GitHub Pages: `base: '/river-raid/'`
- Cobertura de testes: thresholds 55% (statements/functions/lines), 35% (branches)
- Coverage inclui apenas: `Game`, `World`, `Player`, `EnemyManager`, `FuelSystem`, `CollisionSystem`
- Node: `.nvmrc` = 24, CI deploy = Node 22 (manter compatibilidade com ambos)

## Docs e specs

- `Readme.md` — visão geral e mecânicas
- `prd.md` — requisitos de produto por fases
- `spec.md` — especificação técnica
- `introducion.md` — spec detalhada canônica (nome intencionalmente errado)
- `plan.md` — notas de planejamento
- `sugest.md` — sugestões extras

## Sistema de comandos

- Diretório: resolvido pelo target ativo (via `_shared/target-adapter.md`)
- Status: Estável
- Frequência de mudança: Baixa

Regras:
- NÃO recarregar automaticamente
- NÃO reprocessar a cada execução
- Recarregar apenas se houver mudança explícita
