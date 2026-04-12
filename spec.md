# River Raid — Spec de Evolução

> Documento gerado a partir da análise do código real do projeto (Fases 1–4 + extras implementados).
> Serve como roadmap e referência para próximas implementações.

---

## Estado Atual (concluído)

### Módulos implementados

| Módulo | Arquivo | Responsabilidade |
|--------|---------|------------------|
| Game | `src/game/Game.ts` | Loop principal (RAF), orquestra sistemas, pause/mute/high-score |
| Player | `src/game/Player.ts` | Aeronave: posição, movimento, tiro, estados (alive/exploding/dead) |
| EnemyManager | `src/game/EnemyManager.ts` | Spawn, 4 tipos de inimigos, balas inimigas, dificuldade progressiva |
| World | `src/game/World.ts` | Rio procedural: segmentos, curvas, variação de largura, colisão com margens |
| FuelSystem | `src/game/FuelSystem.ts` | Dreno de combustível, pickups, fuel drop de pontes |
| CollisionSystem | `src/game/CollisionSystem.ts` | Detecção AABB |
| Fx | `src/game/Fx.ts` | Pool de partículas, score popups, flash de tela |
| Scenery | `src/game/Scenery.ts` | Objetos decorativos nas margens (palmeiras, árvores, casas, arbustos, rochas, tanques) |
| SoundManager | `src/game/SoundManager.ts` | Sons procedurais via Web Audio API (tiro, explosão, fuel, enemy hit, game over) |
| UI | `src/game/UI.ts` | HUD in-canvas: score, fuel bar, ícone mute, overlay pause |

### React shell

| Arquivo | Responsabilidade |
|---------|------------------|
| `src/App.tsx` | Telas: menu, playing, gameover (com high score + NEW BEST!) |
| `src/components/GameCanvas.tsx` | Monta canvas, lifecycle do engine |

### Features já funcionais

- Movimento horizontal + tiro (arrow keys + space)
- Auto-scroll com velocidade dinâmica (120→200)
- 4 tipos de inimigos com IA distinta (helicóptero, avião, barco, ponte)
- Inimigos atiram (helicópteros 50%, aviões 60%)
- Combustível com dreno + pickups + fuel drop de pontes
- Rio procedural com curvas graduais
- Colisão AABB completa (player↔enemy, player↔bank, bullet↔enemy, player↔fuel, player↔enemy bullets)
- Score em tempo real + high score (localStorage)
- Pause (P/ESC) + Mute (M)
- Efeitos visuais: explosões com partículas, score popups, flash de tela
- Cenário nas margens: 6 tipos de objetos decorativos
- Sons procedurais (tiro, explosão, fuel, enemy hit, game over)
- Dificuldade progressiva (mais inimigos ao longo do tempo)

---

## Eixos de Evolução

---

### Eixo A — Mobile / Touch

> Bloqueio de maior impacto para jogabilidade real. PRD menciona mobile como "future goal".

#### A1 — Controles touch (D-pad virtual + botão de tiro) (concluído)

- Overlay de controles em canvas ou div React
- D-pad no canto inferior esquerdo, botão de tiro no canto inferior direito
- Detecção de touch events separados para cada controle
- Responsividade: canvas adapta ao viewport do dispositivo

**Complexidade:** Média
**Arquivos afetados:** Novo módulo `TouchControls.ts` ou div React, `GameCanvas.tsx`, `Player.ts` (input touch)
**Risco:** Baixo — não afeta gameplay keyboard

#### A2 — Swipe horizontal para mover + tap para atirar (concluído)

- Swipe/drag horizontal controla posição X do avião diretamente (posicionamento 1:1)
- Tap rápido (duração < 200ms, movimento < 15px) dispara tiro
- Movimento suave com interpolação (speed-limited lerp) para evitar teleporte
- Overlay transparente full-screen com botões pause/mute no topo
- Ativado automaticamente em dispositivos touch (`@media (pointer: coarse)`)

**Complexidade:** Média
**Arquivos afetados:** `Player.ts` (touchTargetX), `Game.ts` (bridge), `SwipeControls.tsx` (gestos), `SwipeControls.css`, `GameCanvas.tsx`
**Risco:** Baixo — não afeta gameplay keyboard, fallback natural

#### A3 — Combinação A1 + A2 com detecção automática de dispositivo

- Desktop: keyboard
- Mobile: D-pad + tiro (A1)
- Opção de swipe como alternativa (A2)

**Complexidade:** Média-Alta
**Arquivos afetados:** Mesmos + lógica de detecção
**Risco:** Baixo

---

### Eixo B — Vidas e Checkpoints

> Original River Raid tinha vidas múltiplas. Atualmente 1 hit = game over.

#### B1 — Sistema de 3 vidas (concluído) (recomendado)

- Player tem 3 vidas
- Ao morrer: respawn na posição atual com invincibility frames (2s)
- HUD mostra vidas restantes (ícones de avião)
- Game over só quando vidas = 0
- Invincibility: sprite pisca (alpha alternado)

**Complexidade:** Baixa
**Arquivos afetados:** `Player.ts` (estado de vida), `Game.ts` (triggerGameOver só quando vidas=0), `UI.ts` (ícones de vida)
**Risco:** Baixo — lógica simples, poucos arquivos

#### B2 — Vidas + continues limitados

- 3 vidas + 2 continues
- Continue: reseta vidas para 3 mas score é multiplicado por 0.5
- Tela de "CONTINUE?" com countdown de 5s

**Complexidade:** Média
**Arquivos afetados:** Mesmos de B1 + `App.tsx` (nova tela de continue)
**Risco:** Médio — UX flow mais complexo

#### B3 — Apenas vidas, sem continues

- Igual B1 mas sem continues
- Mais próximo do original Atari

**Complexidade:** Baixa
**Arquivos afetados:** Mesmos de B1
**Risco:** Baixo

---

### Eixo C — Efeitos Visuais Avançados

> Atualmente: sprites retangulares simples, shimmer mínimo na água, flash de tela.

#### C1 — Screen shake + trail de fumaça + ondas no rio (concluído) (recomendado)

- **Screen shake:** ao explodir inimigo ou morrer, canvas desloca 3-5px por 0.3s
  - Implementação: `ctx.translate(randomShake, randomShake)` no render
- **Trail de fumaça:** partículas cinza saindo atrás do avião continuamente
  - Usa pool existente em `Fx.ts`, tipo novo "trail"
- **Ondas no rio:** linhas horizontais com offset senoidal animado sobre a água azul
  - Modificação em `World.ts` render

**Complexidade:** Média
**Arquivos afetados:** `Fx.ts` (trail), `Game.ts` (shake), `World.ts` (ondas)
**Risco:** Baixo — performance mitigável com toggle

#### C2 — C1 + filtro CRT scanline + nuvens parallax (concluído)

- Scanline overlay sutil (linhas horizontais semi-transparentes)
- Nuvens passando em camada acima do verde mas abaixo do HUD
- Camada de nuvens: 2-3 nuvens grandes, velocidade menor que scroll

**Complexidade:** Média-Alta
**Arquivos afetados:** Mesmos de C1 + novo render pass para scanlines + nuvens
**Risco:** Baixo — camadas não interagem com gameplay

#### C3 — C2 + variação dia/noite progressiva (concluído)

- Cores do rio/verde/HUD mudam gradualmente ao longo do tempo
- Ciclo: dia → entardecer → noite → amanhecer (~3 min cada)
- Tons de azul mais escuros à noite, laranja no entardecer
- HUD adapta contraste automaticamente

**Complexidade:** Alta
**Arquivos afetados:** Todos os módulos de render
**Risco:** Médio — impacto em legibilidade do HUD

---

### Eixo D — Gameplay Profundo

> Replayability e profundidade mecânica.

#### D1 — Score multiplier / combo (concluído) (recomendado)

- Combo sobe a cada kill seguido sem miss (errar tiro)
- Multiplicador: x1 → x2 → x3 → x4 (máximo)
- Reseta ao errar tiro (bullet sai da tela sem hit)
- HUD mostra multiplicador atual com animação ao subir
- Visual: texto do combo cresce e diminui ao mudar

**Complexidade:** Baixa
**Arquivos afetados:** `Game.ts` (estado de combo), `UI.ts` (render combo), `Player.ts` (detectar miss)
**Risco:** Baixo — estado simples

#### D2 — Power-ups (concluído)

- Inimigos especiais (marcados visualmente) dropam power-ups ao morrer
- Tipos de power-up:
  - **Tiro duplo** — 2 balas simultâneas por 10s
  - **Escudo** — absorve 1 hit, indicador visual ao redor do avião
  - **Slow-motion** — scrollSpeed reduz 50% por 5s
- Power-ups flutuam no rio como fuel tanks, player coleta passando por cima
- Drop chance: 15% em inimigos marcados, 5% em qualquer inimigo

**Complexidade:** Alta
**Arquivos afetados:** Novo módulo `PowerUpSystem.ts`, `Game.ts`, `Player.ts`, `CollisionSystem.ts`, `UI.ts`, `EnemyManager.ts`
**Risco:** Médio — balanceamento necessário

#### D3 — Ranking top 10 no localStorage

- Estrutura: array de `{ name: string, score: number, date: string }`
- Tela de game over mostra top 10
- Se score entrou no ranking: input inline para nome (sem prompt)
- Armazenado em `localStorage('river-raid-ranking')`

**Complexidade:** Baixa
**Arquivos afetados:** `Game.ts` (get/save ranking), `App.tsx` (tela de ranking), novo tipo `RankingEntry`
**Risco:** Baixo

---

### Eixo E — Polimento de Áudio e HUD (concluído)

#### E1 — Som ambiente (motor do avião + rio) (concluído)

- Loop procedural de motor: oscilador contínuo com variação de pitch por velocidade
- Som de rio: ruído branco filtrado em lowpass, volume baixo
- Motor muda pitch quando veloz vs lento
- Tudo mutado pelo mesmo toggle M

**Complexidade:** Baixa
**Arquivos afetados:** `SoundManager.ts` (novos métodos, loop contínuo), `Game.ts` (start/stop ambient)
**Risco:** Baixo — pode ser repetitivo, mitigado com variação

#### E2 — Ranking top 10 visual na tela de game over (concluído)

- Lista com posições numeradas, highlight na entrada do jogador
- Scroll automático se necessário
- Nome do jogador coletado inline (campo de texto)

**Complexidade:** Baixa
**Arquivos afetados:** `App.tsx`, `Game.ts`
**Risco:** Baixo

#### E3 — Minimap no canto (concluído)

- Mini-retângulo no canto superior direito mostrando próximos 3-4 segmentos do rio
- Posição do jogador indicada por ponto
- Inimigos como pontos vermelhos
- Fuel tanks como pontos verdes

**Complexidade:** Média
**Arquivos afetados:** `UI.ts` (render minimap), `Game.ts` (passar dados)
**Risco:** Baixo — visual apenas

---

## Priorização Recomendada

| Ordem | Eixo | Esforço | Impacto | Risco |
|-------|-------|---------|---------|-------|
| 1 | B1 — 3 vidas | Baixo | Alto (retenção) | Baixo |
| 2 | D1 — Combo multiplier | Baixo | Alto (replayability) | Baixo |
| 3 | C1 — Screen shake + trail + ondas | Médio | Alto (visual) | Baixo |
| 4 | A1 — Controles touch | Médio | Alto (mobile) | Baixo |
| 5 | D3 — Ranking top 10 | Baixo | Médio (engajamento) | Baixo |
| 6 | E1 — Som ambiente | Baixo | Médio (imersão) | Baixo |
| 7 | C2 — CRT scanlines + nuvens | Médio | Médio (polimento) | Baixo |
| 8 | D2 — Power-ups | Alto | Alto (gameplay) | Médio |
| 9 | E3 — Minimap | Médio | Baixo | Baixo |
| 10 | C3 — Dia/noite | Alto | Médio | Médio |

---

## Notas Técnicas

- Todos os eixos respeitam a arquitetura: React shell + pure TS engine em `src/game/`
- React nunca chama lógica de jogo durante render
- Novos sistemas seguem o padrão existente: classe com `update(dt)` + `render(ctx)` + `reset()`
- Performance: manter 60 FPS. Evitar alocações no hot loop. Usar object pools.
- Canvas-only para gameplay. React só para shell (menu, gameover, ranking).
- TypeScript strict. ESM only.
