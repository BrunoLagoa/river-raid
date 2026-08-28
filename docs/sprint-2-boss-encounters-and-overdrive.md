# Sprint 02: Batalhas de Chefe & Sistema Overdrive

## 🎯 Objetivo da Sprint
Aprofundar a camada de combate e clímax da gameplay através de:
1. **Batalhas com Chefes Multi-Fase (Boss Battles)**: Introduzir o *Dreadnought Naval* (encouraçado blindado que surge como evento especial após cruzar biomas ou pontes estratégicas), com torres destrutíveis e padrões de ataque únicos.
2. **Sistema de Especial Overdrive**: Barra de carga preenchida ao abater inimigos e realizar manobras arriscadas (*Near Miss*), permitindo disparar um super-ataque tático (Laser Contínuo ou Pulso Eletromagnético EMP).
3. **HUD do Chefe e Overdrive**: Barra de vida animada do chefe no topo da tela e medidor de Overdrive no HUD.

---

## 📋 Mapeamento de Tarefas Detalhadas

### ✅ Task 2.1: Constantes e Modelagem de Dados do Boss & Overdrive [CONCLUÍDA]
- **Arquivos impactados:**
  - [constants.ts](file:///Users/bruno/Dev/pocs/river-raid/src/game/constants.ts)
  - [EnemyManager.ts](file:///Users/bruno/Dev/pocs/river-raid/src/game/EnemyManager.ts)
- **Sub-etapas:**
  1. [x] Definir constantes de balanceamento em `constants.ts` (`OVERDRIVE_MAX`, `OVERDRIVE_KILL_GAIN`, `BOSS_DREADNOUGHT_HP`, `BOSS_TURRET_HP`, `BOSS_POINTS`).
  2. [x] Adicionar novos tipos e interfaces para o Boss e Torres.
  3. [x] Atualizar tipos de colisões e entidades.
- **Critérios de Aceite:**
  - Tipos compilam estritamente no TypeScript (`npm run typecheck`).

---

### ✅ Task 2.2: Sistema de Overdrive (`OverdriveSystem.ts`) [CONCLUÍDA]
- **Arquivos impactados:**
  - [OverdriveSystem.ts](file:///Users/bruno/Dev/pocs/river-raid/src/game/OverdriveSystem.ts) [NEW]
  - [OverdriveSystem.test.ts](file:///Users/bruno/Dev/pocs/river-raid/src/game/OverdriveSystem.test.ts) [NEW]
  - [Player.ts](file:///Users/bruno/Dev/pocs/river-raid/src/game/Player.ts)
- **Sub-etapas:**
  1. [x] Criar `OverdriveSystem` com medição de energia, ativação e timer de decaimento.
  2. [x] Integrar com o disparo do jogador em `Player.ts` com o feixe contínuo de Overdrive Laser e EMP Shockwave inicial.
  3. [x] Escrever testes unitários em `OverdriveSystem.test.ts` cobrindo ganho de energia, ativação, expiração e cooldown.
- **Critérios de Aceite:**
  - Overdrive não ativa sem energia máxima (100%).
  - Duração de 6 segundos esgota a barra com decaimento suave.

---

### ✅ Task 2.3: IA e Padrões de Ataque do Chefe Dreadnought (`BossDreadnought.ts`) [CONCLUÍDA]
- **Arquivos impactados:**
  - [BossDreadnought.ts](file:///Users/bruno/Dev/pocs/river-raid/src/game/BossDreadnought.ts) [NEW]
  - [BossDreadnought.test.ts](file:///Users/bruno/Dev/pocs/river-raid/src/game/BossDreadnought.test.ts) [NEW]
  - [EnemyManager.ts](file:///Users/bruno/Dev/pocs/river-raid/src/game/EnemyManager.ts)
- **Sub-etapas:**
  1. [x] Implementar a classe `BossDreadnought` com 3 fases dinâmicas (Fase 1: Torres, Fase 2: Núcleo reator, Fase 3: Desespero & propulsores).
  2. [x] Integrar geração e spawn do Boss em `EnemyManager.ts` e controle de velocidade no loop do jogo.
  3. [x] Adicionar testes unitários detalhados de dano, destruição de torres e transição de fases.
- **Critérios de Aceite:**
  - Cada torre tem sua própria caixa de colisão AABB e barra de dano.
  - Ao ser derrotado, o rio volta à velocidade normal e concede pontuação de 5000 pts.

---

### ✅ Task 2.4: Renderização de Alta Qualidade do Chefe (`BossRenderer.ts`) [CONCLUÍDA]
- **Arquivos impactados:**
  - [BossRenderer.ts](file:///Users/bruno/Dev/pocs/river-raid/src/game/BossRenderer.ts) [NEW]
  - [BossRenderer.test.ts](file:///Users/bruno/Dev/pocs/river-raid/src/game/BossRenderer.test.ts) [NEW]
  - [Fx.ts](file:///Users/bruno/Dev/pocs/river-raid/src/game/Fx.ts)
- **Sub-etapas:**
  1. [x] Desenhar a carcaça blindada pixel-art do Dreadnought (placas de metal, chaminés com fumaça, canhões rotativos que miram na direção do jogador).
  2. [x] Adicionar feedback de dano (flash branco quando uma torre ou núcleo é atingido).
  3. [x] Criar efeito de explosão massiva multifásica ao abater o chefe.
  4. [x] Testes de renderização em `BossRenderer.test.ts`.
- **Critérios de Aceite:**
  - Visual consistente com a estética retrô-moderna de 60 FPS.
  - Zero queda de FPS durante a animação de destruição.

---

### ✅ Task 2.5: HUD do Chefe, Barra de Overdrive & Teclas de Gatilho [CONCLUÍDA]
- **Arquivos impactados:**
  - [UI.ts](file:///Users/bruno/Dev/pocs/river-raid/src/game/UI.ts)
  - [GameCanvas.tsx](file:///Users/bruno/Dev/pocs/river-raid/src/components/GameCanvas.tsx)
  - [SwipeControls.tsx](file:///Users/bruno/Dev/pocs/river-raid/src/components/SwipeControls.tsx)
  - [SwipeControls.css](file:///Users/bruno/Dev/pocs/river-raid/src/components/SwipeControls.css)
  - [i18n.ts](file:///Users/bruno/Dev/pocs/river-raid/src/i18n.ts)
- **Sub-etapas:**
  1. [x] Renderizar no topo do canvas: Barra de Vida do Chefe estilizada com nome ("DREADNOUGHT MK-I") e marcadores de fase.
  2. [x] Renderizar no HUD inferior: Barra de Overdrive neon pulsante.
  3. [x] Mapear gatilho no teclado (`Shift` / `X`), gamepad (botão `B`) e botão touch dedicado no mobile (`⚡`).
  4. [x] Atualizar textos em `i18n.ts`.
- **Critérios de Aceite:**
  - Barra de chefe só aparece durante o encontro.
  - Botão de Overdrive no mobile acende com brilho quando carregado a 100%.

---

## 🧪 Status de Verificação da Sprint 02
- **Testes Automatizados:** `npm run typecheck && npm test && npm run test:coverage && npm run lint` — **100% Aprovado**.
- **Cobertura Final**: 83.13% Stmts, 77.68% Branch, 81.02% Funcs, 84.03% Lines (Superando os portões de cobertura).
- **Status da Sprint**: ✅ **Finalizada e Entregue**.
1. **Testes Automatizados:**
   ```bash
   npm run typecheck
   npm test
   npm run lint
   ```
2. **Validação de Gameplay no Navegador:**
   - Abater inimigos e realizar Near Miss até encher a barra de Overdrive.
   - Pressionar `Shift` / `X` e validar o Laser Contínuo e o pulso EMP limpando a tela.
   - Chegar ao confronto do Boss, destruir as 4 torres e em seguida destruir o núcleo.
