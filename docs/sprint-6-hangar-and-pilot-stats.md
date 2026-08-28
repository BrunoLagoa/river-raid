# Sprint 06: Hangar de Aeronaves & Estatísticas de Carreira

## 🎯 Objetivo da Sprint
Aumentar o valor de replay e a sensação de conquista a longo prazo através de:
1. **Hangar de Aeronaves (Skins Customizáveis)**: Desbloqueio e escolha de skins estéticas para o caça do jogador (ex: *Classic 2600*, *Stealth F-117 Nighthawk*, *Biplano Vintage*, *Neon Cyber-Viper*), com requisitos baseados em conquistas e marcos de pontuação.
2. **Diário de Bordo do Piloto (Career Stats Tracker)**: Registro cumulativo de dados de voo (total de horas voadas, combustível reabastecido, inimigos destruídos por classe, taxa média de acerto e maior combo histórico).
3. **Interface de Exibição no Menu**: Aba dedicada no menu com preview interativo do avião em pixel-art 360° e estatísticas detalhadas.

---

## 📋 Mapeamento de Tarefas Detalhadas

### Task 6.1: Sistema de Skins e Desbloqueios (`SkinService.ts`)
- **Arquivos impactados:**
  - `src/game/SkinService.ts` [NEW]
  - `src/game/SkinService.test.ts` [NEW]
  - [StorageService.ts](file:///Users/bruno/Dev/pocs/river-raid/src/game/StorageService.ts)
- **Sub-etapas:**
  1. Definir catálogo de skins:
     - `classic`: Caça amarelo clássico Atari (Desbloqueado por padrão).
     - `stealth`: Caça preto angular com chamas roxas (Desbloqueado com a conquista *Sharpshooter*).
     - `biplane`: Biplano vintage com hélice rotativa (Desbloqueado com a conquista *Bridge Breaker*).
     - `cyber_neon`: Caça ciano/magenta com rastro de luz neon (Desbloqueado ao atingir 25.000 pontos).
  2. Implementar verificação de desbloqueio sincronizada com `AchievementService` e recordes.
  3. Salvar skin equipada no `localStorage` via `StorageService`.
  4. Testes unitários em `SkinService.test.ts`.
- **Critérios de Aceite:**
  - Skins bloqueadas exibem claramente os requisitos de desbloqueio.

---

### Task 6.2: Renderização Especializada das Skins no Canvas
- **Arquivos impactados:**
  - `src/game/PlayerSkinRenderer.ts` [NEW]
  - `src/game/PlayerSkinRenderer.test.ts` [NEW]
  - [Player.ts](file:///Users/bruno/Dev/pocs/river-raid/src/game/Player.ts)
- **Sub-etapas:**
  1. Criar desenhadores pixel-art dedicados para cada fuselagem:
     - Asas, cockpits, turbinas e efeito de inclinação lateral (*banking animation*).
  2. Customizar as cores do rastro de exaustão (*Smoke Trail*) de acordo com a skin selecionada.
  3. Testes de renderização em `PlayerSkinRenderer.test.ts`.
- **Critérios de Aceite:**
  - As dimensões da caixa de colisão física (hitbox) permanecem rigorosamente idênticas para todas as skins (apenas cosmético).

---

### Task 6.3: Registro de Estatísticas de Carreira (`CareerStatsService.ts`)
- **Arquivos impactados:**
  - `src/game/CareerStatsService.ts` [NEW]
  - `src/game/CareerStatsService.test.ts` [NEW]
  - [Game.ts](file:///Users/bruno/Dev/pocs/river-raid/src/game/Game.ts)
- **Sub-etapas:**
  1. Criar estrutura de dados de carreira:
     ```ts
     export interface CareerStats {
       totalFlightTimeSeconds: number
       totalScoreAccumulated: number
       totalRuns: number
       totalFuelPickedUp: number
       enemiesKilled: {
         helicopter: number
         plane: number
         boat: number
         gunboat: number
         tank: number
         bridge: number
         boss: number
       }
       totalShotsFired: number
       totalShotsHit: number
       highestComboEver: number
     }
     ```
  2. Injetar pontos de atualização em `Game.ts` ao final de cada partida para incrementar as métricas cumulativas.
  3. Criptografar/proteger os dados com checksum FNV-1a em `StorageService`.
  4. Testes unitários em `CareerStatsService.test.ts`.
- **Critérios de Aceite:**
  - Estatísticas persistem confiavelmente entre sessões.

---

### Task 6.4: Telas de Hangar e Estatísticas no React Shell
- **Arquivos impactados:**
  - `src/components/HangarScreen.tsx` [NEW]
  - `src/components/CareerStatsModal.tsx` [NEW]
  - [App.tsx](file:///Users/bruno/Dev/pocs/river-raid/src/App.tsx)
  - [MenuScreen.tsx](file:///Users/bruno/Dev/pocs/river-raid/src/components/MenuScreen.tsx)
  - [i18n.ts](file:///Users/bruno/Dev/pocs/river-raid/src/i18n.ts)
- **Sub-etapas:**
  1. Criar tela `HangarScreen`:
     - Carrossel de seleção de aeronaves com mini-canvas interativo para inspecionar a skin e animação do caça.
     - Botão "Equipar" / "Bloqueado (Requer X)".
  2. Criar modal `CareerStatsModal`:
     - Grid estilizado de badges e números (ex: "Precisão Geral: 78.4%", "Pontes Demolidas: 42").
  3. Integrar navegação no `App.tsx` e `MenuScreen.tsx`.
  4. Suporte a traduções em `i18n.ts`.
- **Critérios de Aceite:**
  - Navegação fluida com teclado e touch.

---

## 🧪 Plano de Verificação e Resultados da Sprint 06
1. **Testes Automatizados:**
   - `npm run typecheck`: **0 erros** (Strict TypeScript).
   - `npm test`: **595 testes passando (45 arquivos de teste)**.
   - `npm run lint`: **0 warnings / 0 erros** (ESLint Flat Config).
   - `npm run test:coverage`:
     - Statements: **84.74%** (meta >= 82%)
     - Branches: **77.38%** (meta >= 75%)
     - Functions: **83.16%** (meta >= 75%)
     - Lines: **85.84%** (meta >= 82%)
   - `npm run build`: Bundle de produção gerado com sucesso em **98ms**.

2. **Validação Funcional:**
   - Hangar interativo com mini-canvas `HangarScreen.tsx` exibindo as 4 aeronaves animadas com rotação de radar.
   - Renderizador especializado `PlayerSkinRenderer.ts` com sprites dedicados, banking lateral e rastros de fumaça cromáticos.
   - Diário de bordo `CareerStatsModal.tsx` com precisão %, tempo total, contagem detalhada de abates e persistência com checksum via `CareerStatsService.ts`.
   - Botões de acesso rápido no Menu principal com localização completa (`pt-BR` e `en`).

---

## 🏁 Status: CONCLUÍDO (100% Entregue)

