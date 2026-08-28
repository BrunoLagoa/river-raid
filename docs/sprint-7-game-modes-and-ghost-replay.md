# Sprint 07: Novos Modos de Jogo & Ghost Replay

## 🎯 Objetivo da Sprint
Expandir as formas de jogar e enriquecer a competição pessoal através de:
1. **Modos de Jogo Alternativos**:
   - **Modo Boss Rush**: Sequência contínua de encontros com chefes em alta velocidade.
   - **Modo Hardcore / Iron Man**: 1 única vida, combustível drena mais rápido e sem radar de auxílio.
   - **Modo Prática Zen**: Sem combustível e sem Game Over para relaxar e treinar reflexos de desvio.
2. **Sistema de Avião Fantasma (Ghost Replay)**: Gravação leve da trajetória do melhor score do jogador (coordenadas $x, y$, inclinação e tiros) e renderização de uma projeção holográfica translúcida competindo lado a lado na run atual.

---

## 📋 Mapeamento de Tarefas Detalhadas

### Task 7.1: Arquitetura de Modos de Jogo (`GameMode.ts`)
- **Arquivos impactados:**
  - `src/game/GameMode.ts` [NEW]
  - `src/game/GameMode.test.ts` [NEW]
  - [constants.ts](file:///Users/bruno/Dev/pocs/river-raid/src/game/constants.ts)
  - [Game.ts](file:///Users/bruno/Dev/pocs/river-raid/src/game/Game.ts)
- **Sub-etapas:**
  1. Definir tipo `export type GameModeId = 'classic' | 'daily' | 'boss_rush' | 'hardcore' | 'zen'`.
  2. Implementar perfis de configuração por modo:
     - `classic`: Regras padrão do jogo.
     - `daily`: Semente determinística do dia com ranking diário.
     - `boss_rush`: Spawna chefes a cada 45s com drops generosos de fuel.
     - `hardcore`: `lives = 1`, `fuelDrainMultiplier = 1.3`, `minimapDisabled = true`.
     - `zen`: `lives = Infinity`, `fuelDrainMultiplier = 0`.
  3. Atualizar construtor e loop do `Game.ts` para receber e aplicar as regras do modo selecionado.
  4. Testes unitários em `GameMode.test.ts`.
- **Critérios de Aceite:**
  - O modo selecionado aplica todas as regras específicas sem alterar o comportamento do modo clássico.

---

### Task 7.2: Motor de Gravação de Replay Fantasma (`GhostReplaySystem.ts`)
- **Arquivos impactados:**
  - `src/game/GhostReplaySystem.ts` [NEW]
  - `src/game/GhostReplaySystem.test.ts` [NEW]
  - [StorageService.ts](file:///Users/bruno/Dev/pocs/river-raid/src/game/StorageService.ts)
- **Sub-etapas:**
  1. Criar gravador leve com amostragem a 10 Hz (uma amostra a cada 100ms) com interpolação cúbica/linear no playback:
     ```ts
     export interface GhostSample {
       t: number // timestamp em segundos
       x: number
       y: number
       bank: number // inclinação lateral
       shooting: boolean
     }
     ```
  2. Implementar compressão e serialização em string Base64 para armazenar a melhor run no `localStorage`.
  3. Se a pontuação final da run atual superar o recorde, a gravação substitui o fantasma salvo.
  4. Testes unitários em `GhostReplaySystem.test.ts`.
- **Critérios de Aceite:**
  - O arquivo de replay consome menos de 40 KB de memória para uma partida de 5 minutos.

---

### Task 7.3: Renderização Holográfica do Avião Fantasma
- **Arquivos impactados:**
  - `src/game/GhostRenderer.ts` [NEW]
  - `src/game/GhostRenderer.test.ts` [NEW]
  - [Game.ts](file:///Users/bruno/Dev/pocs/river-raid/src/game/Game.ts)
- **Sub-etapas:**
  1. Renderizar o avião fantasma no canvas com efeito holográfico:
     - `ctx.globalAlpha = 0.35`.
     - Silhueta ciano neon brilhante com linhas horizontais de interferência holográfica.
     - Indicador com texto sutil "BEST RUN" flutuando acima da cauda.
  2. Permitir ativar/desativar o avião fantasma nas configurações.
  3. Testes de interpolação e render em `GhostRenderer.test.ts`.
- **Critérios de Aceite:**
  - O fantasma não colide com nada e serve puramente como referência visual de ritmo e posição.

---

### Task 7.4: Seleção de Modos no Menu React & Game Over
- **Arquivos impactados:**
  - [MenuScreen.tsx](file:///Users/bruno/Dev/pocs/river-raid/src/components/MenuScreen.tsx)
  - [App.tsx](file:///Users/bruno/Dev/pocs/river-raid/src/App.tsx)
  - [i18n.ts](file:///Users/bruno/Dev/pocs/river-raid/src/i18n.ts)
- **Sub-etapas:**
  1. Adicionar seletor de modo no menu principal com badges distintos (ex: "👑 DIÁRIO", "⚡ BOSS RUSH", "💀 HARDCORE").
  2. Ajustar a tela de Game Over para exibir o recorde específico de cada modo.
  3. Atualizar traduções de todos os modos em `i18n.ts`.
- **Critérios de Aceite:**
  - Fácil alternância entre modos com feedback sonoro e visual.

---

## 🧪 Plano de Verificação e Resultados da Sprint 07
1. **Testes Automatizados:**
   - `npm run typecheck`: **0 erros (Strict TypeScript)**.
   - `npm test`: **610 testes passando (49 arquivos de teste)**.
   - `npm run lint`: **0 warnings / 0 erros (ESLint Flat Config)**.
   - `npm run test:coverage`:
     - Statements: **84.79%** (meta >= 82%)
     - Branches: **77.08%** (meta >= 75%)
     - Functions: **82.77%** (meta >= 75%)
     - Lines: **85.86%** (meta >= 82%)
   - `npm run build`: Bundle de produção gerado com sucesso em **97ms**.

2. **Validação Funcional:**
   - Seleção de modos via `ModeSelectModal.tsx` suportando **Patrulha Clássica**, **Desafio Diário**, **Boss Rush (chefes a cada 35s)**, **Iron Man / Hardcore (1 vida, sem radar, +35% fuel drain)** e **Voo Zen (vidas e combustível infinitos)**.
   - Gravação contínua do replay a 10 Hz via `GhostReplaySystem.ts` com substituição automática apenas quando um novo recorde de pontuação é atingido.
   - Renderização holográfica de alta precisão via `GhostRenderer.ts` com interpolação linear, silhueta em ciano neon, scanlines holográficas e etiqueta flutuante `[RECORD]`.
   - Toggle nas Configurações para ativar/desativar o avião fantasma (`ghostReplay`).
   - Badges temáticos no Game Over discriminando o modo disputado e suporte a internacionalização completa (`en` e `pt-BR`).

---

## 🏁 Status: CONCLUÍDO (100% Entregue)

