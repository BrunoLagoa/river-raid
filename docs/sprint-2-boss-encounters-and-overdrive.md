# Sprint 02: Batalhas de Chefe & Sistema Overdrive

## 🎯 Objetivo da Sprint
Aprofundar a camada de combate e clímax da gameplay através de:
1. **Batalhas com Chefes Multi-Fase (Boss Battles)**: Introduzir o *Dreadnought Naval* (encouraçado blindado que surge como evento especial após cruzar biomas ou pontes estratégicas), com torres destrutíveis e padrões de ataque únicos.
2. **Sistema de Especial Overdrive**: Barra de carga preenchida ao abater inimigos e realizar manobras arriscadas (*Near Miss*), permitindo disparar um super-ataque tático (Laser Contínuo ou Pulso Eletromagnético EMP).
3. **HUD do Chefe e Overdrive**: Barra de vida animada do chefe no topo da tela e medidor de Overdrive no HUD.

---

## 📋 Mapeamento de Tarefas Detalhadas

### Task 2.1: Constantes e Modelagem de Dados do Boss & Overdrive
- **Arquivos impactados:**
  - [constants.ts](file:///Users/bruno/Dev/pocs/river-raid/src/game/constants.ts)
  - [EnemyManager.ts](file:///Users/bruno/Dev/pocs/river-raid/src/game/EnemyManager.ts)
- **Sub-etapas:**
  1. Definir constantes de balanceamento em `constants.ts`:
     - `OVERDRIVE_MAX = 100`, `OVERDRIVE_KILL_GAIN = 4`, `OVERDRIVE_NEAR_MISS_GAIN = 10`, `OVERDRIVE_DURATION = 6.0`.
     - `BOSS_DREADNOUGHT_HP = 150`, `BOSS_TURRET_HP = 30`, `BOSS_POINTS = 5000`.
  2. Adicionar novos tipos em `EnemyManager.ts`:
     - `export type BossType = 'dreadnought' | 'hoverfortress'`
     - Interface `BossTurret { id: string; xOffset: number; yOffset: number; hp: number; maxHp: number; shootCooldown: number; angle: number }`
     - Interface `BossEnemy extends BaseEnemy { phase: number; hp: number; maxHp: number; turrets: BossTurret[]; isBoss: true }`
  3. Atualizar tipos de colisões e entidades.
- **Critérios de Aceite:**
  - Tipos compilam estritamente no TypeScript (`npm run typecheck`).

---

### Task 2.2: Sistema de Overdrive (`OverdriveSystem.ts`)
- **Arquivos impactados:**
  - `src/game/OverdriveSystem.ts` [NEW]
  - `src/game/OverdriveSystem.test.ts` [NEW]
  - [Player.ts](file:///Users/bruno/Dev/pocs/river-raid/src/game/Player.ts)
- **Sub-etapas:**
  1. Criar `OverdriveSystem` com:
     - `energy: number` (0 a 100).
     - `isActive: boolean` e `activeTimer: number`.
     - Métodos `addEnergy(amount: number)`, `tryActivate(): boolean`, `update(dt: number)`.
  2. Integrar com o disparo do jogador em `Player.ts`:
     - Quando ativo, ativa o modo **Overdrive Laser**: um feixe de plasma contínuo de alta potência que atravessa múltiplos alvos e destrói projéteis inimigos em rota de colisão.
     - Pulso de detonação inicial (*EMP Shockwave*) ao ativar, limpando tiros da tela instantaneamente.
  3. Escrever testes unitários em `OverdriveSystem.test.ts` cobrindo ganho de energia, ativação, expiração e cooldown.
- **Critérios de Aceite:**
  - Overdrive não ativa sem energia máxima (100%).
  - Duração de 6 segundos esgota a barra com decaimento suave.

---

### Task 2.3: IA e Padrões de Ataque do Chefe Dreadnought (`BossDreadnought.ts`)
- **Arquivos impactados:**
  - `src/game/BossDreadnought.ts` [NEW]
  - `src/game/BossDreadnought.test.ts` [NEW]
  - [EnemyManager.ts](file:///Users/bruno/Dev/pocs/river-raid/src/game/EnemyManager.ts)
- **Sub-etapas:**
  1. Implementar a classe `BossDreadnought`:
     - **Fase 1 (Aproximação e Torres)**: O encouraçado desce o rio e estaciona ocupando o centro da tela; 4 torres laterais disparam projéteis angulados em leque.
     - **Fase 2 (Blindagem Quebrada & Canhão Central)**: Após a destruição das torres, o núcleo central se abre disparando rajadas de mísseis guiados lentos.
     - **Fase 3 (Desespero & Propulsão)**: HP abaixo de 25%, aceleração com fogo nas turbinas e disparos rápidos.
  2. Integrar geração e spawn do Boss em `EnemyManager.ts` (desacelera o scroll do rio durante o confronto do chefe).
  3. Adicionar testes unitários detalhados de dano, destruição de torres e transição de fases.
- **Critérios de Aceite:**
  - Cada torre tem sua própria caixa de colisão AABB e barra de dano.
  - Ao ser derrotado, o rio volta à velocidade normal e concede pontuação e bônus de combustível.

---

### Task 2.4: Renderização de Alta Qualidade do Chefe (`BossRenderer.ts`)
- **Arquivos impactados:**
  - `src/game/BossRenderer.ts` [NEW]
  - `src/game/BossRenderer.test.ts` [NEW]
  - [Fx.ts](file:///Users/bruno/Dev/pocs/river-raid/src/game/Fx.ts)
- **Sub-etapas:**
  1. Desenhar a carcaça blindada pixel-art do Dreadnought (placas de metal, chaminés com fumaça, canhões rotativos que miram na direção do jogador).
  2. Adicionar feedback de dano (flash branco quando uma torre ou núcleo é atingido).
  3. Criar efeito de explosão massiva multifásica em `Fx.ts` ao abater o chefe (explosões em cadeia por 2.5s com screen shake épico).
  4. Testes de renderização em `BossRenderer.test.ts`.
- **Critérios de Aceite:**
  - Visual consistente com a estética retrô-moderna de 60 FPS.
  - Zero queda de FPS durante a animação de destruição.

---

### Task 2.5: HUD do Chefe, Barra de Overdrive & Teclas de Gatilho
- **Arquivos impactados:**
  - [UI.ts](file:///Users/bruno/Dev/pocs/river-raid/src/game/UI.ts)
  - [GameCanvas.tsx](file:///Users/bruno/Dev/pocs/river-raid/src/components/GameCanvas.tsx)
  - [TouchControls.tsx](file:///Users/bruno/Dev/pocs/river-raid/src/components/TouchControls.tsx)
  - [i18n.ts](file:///Users/bruno/Dev/pocs/river-raid/src/i18n.ts)
- **Sub-etapas:**
  1. Renderizar no topo do canvas: Barra de Vida do Chefe estilizada com nome ("DREADNOUGHT MK-I") e marcadores de fase.
  2. Renderizar no HUD inferior: Barra de Overdrive neon pulsante (tecla recomendada: `Shift` ou `X`, e botão dedicado `OVERDRIVE` nos controles touch).
  3. Mapear gatilho no teclado (`Shift` / `X`) e suporte a gamepad (botão `B` / `Y`).
  4. Atualizar textos em `i18n.ts`.
- **Critérios de Aceite:**
  - Barra de chefe só aparece durante o encontro.
  - Botão de Overdrive no mobile acende com brilho quando carregado a 100%.

---

## 🧪 Plano de Verificação da Sprint 02
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
