# River Raid — Levantamento de Melhorias

> Gerado em 12/04/2026 via análise automatizada do código-fonte (Serena MCP + inspeção direta).

---

## Estado Atual do Projeto

- **LOC:** ~4130 linhas (src/)
- **Módulos:** 16 módulos TS em `src/game/` + 3 componentes React em `src/components/`
- **Build:** Limpo (246 KB gzipped: 75 KB)
- **Typecheck:** Sem erros
- **Lint:** sem erros
- **Testes:** 7 arquivos de teste / 18 testes passando + cobertura ativa (`npm run test:coverage`)
- **Fase do PRD:** Fases 1-4 implementadas + extras (power-ups, atmosfera, scenery, ranking, touch/swipe)

---

## Visão Geral da Arquitetura

```
src/
  game/
    Game.ts              → God class: game loop, score, combo, lives, slow-mo, respawn, high-score
    Player.ts            → Aircraft entity: movement, shooting, states, shield, double-shot
    EnemyManager.ts      → Spawn + update + render de 4 tipos + bullets (tudo em 1 classe)
    World.ts             → Rio procedural: segmentos, curvas, largura variável
    FuelSystem.ts        → Dreno de combustível, pickups, bridge fuel drops
    CollisionSystem.ts   → AABB: 6 tipos de colisão em 1 método (137 linhas)
    Fx.ts                → Pool de partículas, score popups, flash, shake
    SoundManager.ts      → Web Audio API: sons procedurais + música + engine
    UI.ts                → HUD in-canvas: score, fuel, minimap, power-ups, combo, pause
    Scenery.ts           → Objetos decorativos nas margens
    Atmosphere.ts        → Ciclo dia/noite com paletas, nuvens, scanlines CRT
    PowerUpSystem.ts     → Double-shot, shield, slow-motion
    StorageService.ts    → Obfuscation + localStorage
    RankingService.ts    → Ranking com nome + score + data
    utils.ts             → compactArray (swap-remove in-place)
    utils.test.ts        → 3 testes para compactArray
  components/
    GameCanvas.tsx       → Monta canvas, instancia Game, lifecycle bridge
    TouchControls.tsx    → Botões touch para mobile
    SwipeControls.tsx    → Swipe + tap para mobile
  App.tsx                → Shell: menu/game/gameover + ranking
```

---

## Problemas Detectados

### Críticos

| Problema | Local | Impacto |
|----------|-------|---------|
| Cobertura de testes quase zero | Todo `src/game/` | **Resolvido** em 12/04/2026 (Abordagem A) |
| Lint error pendente | `SoundManager.ts:68` | **Resolvido** em 12/04/2026 (Abordagem A/B) |

### Estruturais

| Problema | Local | Impacto |
|----------|-------|---------|
| God class (`Game.ts`) | `Game.ts` | **Parcialmente resolvido** (extração de `ScoringSystem` + `GameState`) |
| Render + lógica acoplados | `EnemyManager.ts` | **Resolvido** (extração para `EnemyRenderer`) |
| CollisionResolver monolítico | `CollisionSystem.ts` | **Resolvido** (métodos especializados + broad-phase grid) |
| Alocação no hot loop | `Player.ts`, `EnemyManager.ts` | **Parcialmente resolvido** (pooling aplicado; manter monitoramento) |
| `.filter()` no render | `Game.ts:386-390` | **Resolvido** em 12/04/2026 (Abordagem C) |
| Magic numbers espalhados | Vários arquivos | **Parcialmente resolvido** (`constants.ts` criado e adotado em módulos principais) |
| `Date.now()` no render | `EnemyManager.ts:312` | **Resolvido** (usa `gameTime`) |

---

## Abordagens de Melhoria

### A. Estabilização e Qualidade (prioridade alta)

**Foco:** testes, correção de lint, eliminação de bugs

- Corrigir lint error (`_speedRatio` não usado no `SoundManager.ts:68`)
- Criar testes unitários para os módulos críticos: `CollisionSystem`, `EnemyManager`, `FuelSystem`, `Player`, `World`
- Criar testes de integração para o game loop (`Game.ts`)
- Adicionar `npm run test:coverage` com threshold mínimo

**Prós:** Base sólida para refactoring futuro, regressões detectadas automaticamente
**Contras:** Não agrega valor visível ao jogador, esforço alto (16 módulos sem teste)
**Complexidade:** Média

---

### B. Refactoring Arquitetural (prioridade média)

**Foco:** reduzir acoplamento, SRP, object pooling

- Extrair `Game.ts` em subsistemas: `GameLoop`, `SystemCoordinator`
- Object pool para bullets (Player) e enemies (EnemyManager) — atualmente `push()` aloca a cada frame
- Extrair render de cada entidade para uma `Renderer` separada (EnemyManager tem `renderHelicopter`, `renderPlane`, etc. misturados com lógica de jogo)
- Extrair `CollisionSystem.resolveCollisions` (137 linhas) em métodos por tipo de colisão
- Mover magic numbers para constants (`src/game/constants.ts`)
- Eliminar `Date.now()` no render do helicóptero — usar `gameTime` consistente

**Prós:** Manutenibilidade, performance, testabilidade
**Contras:** Risco de quebrar gameplay, muito esforço, sem UX visível
**Complexidade:** Alta

---

### C. Performance e Otimização (prioridade média)

**Foco:** 60fps estável em devices fracos

- [x] Object pooling para bullets, enemies, particles (pooling aplicado em Player/EnemyManager; `Fx` já possuía)
- [x] Eliminar `.filter()` no render do `Game.ts` (minimap)
- [x] Spatial hashing/grid para collision detection (broad-phase com `SpatialGrid`)
- [x] Cache de `Math.sin/cos` para water waves no `World.render` (LUT + `fastSin`)
- [x] Eliminar `Date.now()` em render (usar `gameTime`) *(concluído no item B)*
- [x] Pré-calcular paths/dados de render quando possível (`visibleSegmentsCache` no `World`)

**Prós:** FPS estável, menos GC pressure
**Contras:** Premature optimization se já roda a 60fps
**Complexidade:** Média-Alta

---

### D. Features de Polish (prioridade baixa-média)

**Foco:** UX, gameplay, retenção

- Tela de tutorial/controles (como jogar)
- Tela de configurações (volume, controles)
- Sistema de achievements (primeiro bridge, combo máximo, etc.)
- Mais enemy types (tanques, navios)
- Dificuldade progressiva mais sofisticada (biomas/temas visuais por zona)
- Leaderboard online (substituir localStorage)
- Suporte a gamepad (Gamepad API)
- `prefers-reduced-motion` — desabilitar partículas/shake

**Prós:** Experiência de jogador muito melhor, diferencial
**Contras:** Feature creep, esforço variável por item
**Complexidade:** Variável (baixa a alta por item)

---

### E. Accessibility e Responsividade (prioridade baixa)

**Foco:** inclusão e multi-device

- `prefers-reduced-motion` para desabilitar FX
- ARIA labels nos controles React fora do canvas
- Navegação por teclado completa nos menus
- Scaling responsivo do canvas (atualmente fullscreen fixo)
- Detecção de mobile com UI adaptativa
- High contrast mode

**Prós:** Alcance maior de público
**Contras:** Baixo impacto para o público-alvo atual (desktop gamers)
**Complexidade:** Baixa a Média

---

## Matriz de Complexidade

| Abordagem | Complexidade | Impacto Técnico | Impacto UX |
|-----------|-------------|-----------------|------------|
| A. Estabilização | Média | Alto | Nenhum |
| B. Refactoring | Alta | Alto | Nenhum |
| C. Performance | Média-Alta | Médio | Baixo |
| D. Polish | Variável | Baixo | Alto |
| E. Accessibility | Baixa-Média | Baixo | Médio |

---

## Riscos

- **B (Refactoring):** Risco alto de regressão sem testes (abordagem A é pré-requisito). O `Game.ts` é o coração — qualquer mudança pode quebrar gameplay.
- **C (Performance):** Se o jogo já roda a 60fps, é otimização prematura. Precisa medir antes (adicionar FPS counter ou profiler).
- **D (Polish):** Feature creep se não houver priorização clara.
- **Lint error existente** (`SoundManager.ts:68`): baixo risco mas indica possível bug no `updateEngine` que recebe `speedRatio` e não usa.

---

## Aderência ao Projeto

- **`.agents` / `AGENTS.md`:** Todas as abordagens respeitam o princípio de "React shell + Canvas 2D puro, sem frameworks externas". Nenhuma proposta introduz dependências proibidas.
- **Specs (`introducion.md`, `prd.md`):** Abordagem D alinha com Fase 4 (Polish) e Fase 5 (Extras). Abordagem A alinha com a meta de "TypeScript strict".
- **Código atual:** Estrutura real corresponde ao spec. Lint error confirmado. Magic numbers e falta de pooling observados diretamente.

---

## Recomendação

**Ordem sugerida: D (seletivo) → E (acessibilidade) [A, B e C já concluídas]**

1. **A primeiro** — sem testes, qualquer refactoring é perigoso. Corrigir o lint error imediatamente (1 linha). Criar testes para `CollisionSystem` e `EnemyManager` (maior risco de bugs).

2. **C parcial** — object pooling para bullets/enemies (impacto real em GC) e eliminar `.filter()` no render (simples, ganho imediato). Medir FPS antes/depois.

3. **D seletivo** — escolher 2-3 features de maior impacto para o jogador (ex: tutorial + gamepad support + achievements).

B (refactoring arquitetural) pode ser feito incrementalmente depois, com segurança pelos testes.

---

## Confiança na Recomendação

**Alta** — análise baseada em leitura direta de todos os 16 módulos do engine via Serena, validação de lint/typecheck/build em tempo real, e correspondência confirmada entre specs e implementação real.

---

## Execução Concluída — Refactoring Arquitetural (Item B)

Status: **Concluído em 12/04/2026**

### Itens implementados

- [x] Extrair `Game.ts` em subsistemas
  - Criado `src/game/ScoringSystem.ts` para score/combo
  - Criado `src/game/GameState.ts` para estado temporal/velocidade/slow-motion
  - `src/game/Game.ts` agora delega responsabilidades para os dois módulos

- [x] Object pool para bullets (Player) e enemies (EnemyManager)
  - Criado `src/game/ObjectPool.ts`
  - `src/game/Player.ts` usa pool para bullets
  - `src/game/EnemyManager.ts` usa pool para enemies e enemy bullets

- [x] Extrair render de entidades para renderer separado
  - Criado `src/game/EnemyRenderer.ts`
  - `EnemyManager` delega render para `EnemyRenderer`

- [x] Extrair `CollisionSystem.resolveCollisions` em métodos por tipo
  - `src/game/CollisionSystem.ts` refatorado com métodos privados especializados

- [x] Mover magic numbers para constants
  - Criado `src/game/constants.ts`
  - Módulos principais atualizados para usar constantes compartilhadas

- [x] Eliminar `Date.now()` no render do helicóptero
  - Render do rotor passa a usar `gameTime` do engine

- [x] Corrigir lint pendente
  - `src/game/SoundManager.ts` ajustado (remoção de parâmetro não usado)

### Validação pós-implementação

- Typecheck: **OK** (`npx tsc --noEmit`)
- Lint: **OK** (`npm run lint`)
- Testes: **OK** (3/3 passando, `npm run test`)
- Build: **OK** (`npm run build`)

### Arquivos criados

- `src/game/constants.ts`
- `src/game/ObjectPool.ts`
- `src/game/EnemyRenderer.ts`
- `src/game/ScoringSystem.ts`
- `src/game/GameState.ts`

### Arquivos alterados

- `src/game/Game.ts`
- `src/game/Player.ts`
- `src/game/EnemyManager.ts`
- `src/game/CollisionSystem.ts`
- `src/game/FuelSystem.ts`
- `src/game/PowerUpSystem.ts`
- `src/game/SoundManager.ts`

### Observações

- Refactoring foi feito preservando compatibilidade com o shell React (`App.tsx` / `GameCanvas.tsx`).
- Não foram adicionadas dependências externas.
- Estrutura continua aderente ao `AGENTS.md` (Canvas 2D puro + engine modular).

---

## Execução Concluída — Estabilização e Qualidade (Item A)

Status: **Concluído em 12/04/2026**

### Itens implementados

- [x] Corrigir lint error (`_speedRatio` não usado no `SoundManager.ts:68`)
- [x] Criar testes unitários para módulos críticos
  - `src/game/CollisionSystem.test.ts`
  - `src/game/EnemyManager.test.ts`
  - `src/game/FuelSystem.test.ts`
  - `src/game/Player.test.ts`
  - `src/game/World.test.ts`
- [x] Criar testes de integração para `Game.ts`
  - `src/game/Game.test.ts`
- [x] Adicionar `npm run test:coverage` com threshold mínimo
  - Script adicionado em `package.json`
  - Configuração de coverage adicionada em `vite.config.ts`
  - Provider `@vitest/coverage-v8` adicionado

### Suporte de testes criado

- `src/game/test-helpers/canvas.ts`
- `src/game/test-helpers/time.ts`
- `src/game/test-helpers/audio.ts`

### Validação pós-implementação

- Typecheck: **OK** (`npx tsc --noEmit`)
- Lint: **OK** (`npm run lint`)
- Testes: **OK** (18/18 passando, `npm run test`)
- Cobertura: **OK** (`npm run test:coverage`)
- Build: **OK** (`npm run build`)

### Arquivos alterados

- `package.json`
- `package-lock.json`
- `vite.config.ts`
- `eslint.config.js`

### Observações

- O threshold foi configurado como baseline inicial para os módulos-alvo da abordagem A.
- Configuração de lint foi ajustada para ignorar artefatos de `coverage/`.

---

## Execução Concluída — Performance e Otimização (Item C)

Status: **Concluído em 12/04/2026**

### Itens implementados

- [x] Eliminar `.filter()` no minimap de `Game.ts`
- [x] Spatial hashing/grid no `CollisionSystem` (broad-phase)
  - Criado `src/game/SpatialGrid.ts`
  - Integração em `checkPlayerVsEnemies`, `checkPlayerVsEnemyBullets`, `checkBulletsVsEnemies`
- [x] Cache de `Math.sin/cos` para ondas em `World.render`
  - LUT (`SIN_LUT_SIZE`) + `fastSin()`
  - amostras pré-calculadas (`waveX`, `waveBase`)
- [x] Pré-cálculo de dados de render quando aplicável
  - `visibleSegmentsCache` no `World`

### Arquivos criados

- `src/game/SpatialGrid.ts`

### Arquivos alterados

- `src/game/Game.ts`
- `src/game/CollisionSystem.ts`
- `src/game/World.ts`

### Validação pós-implementação

- Typecheck: **OK** (`npx tsc --noEmit`)
- Lint: **OK** (`npm run lint`)
- Testes: **OK** (18/18 passando, `npm run test`)
- Cobertura: **OK** (`npm run test:coverage`)
- Build: **OK** (`npm run build`)

### Observações

- AABB foi mantido como narrow-phase para preservar precisão de colisão.
- Otimizações focadas em reduzir alocação e custo no hot path, preservando o comportamento funcional.
