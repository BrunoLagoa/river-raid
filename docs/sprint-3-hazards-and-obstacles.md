# Sprint 03: Perigos Ambientais & Obstáculos de Rio

## 🎯 Objetivo da Sprint
Tornar a navegação pelo rio mais estratégica e desafiadora, introduzindo:
1. **Minas Aquáticas Flutuantes (Sea Mines)** com temporizadores pulsantes e detonação em cadeia (*Chain Explosions*).
2. **Redemoinhos no Rio (Whirlpools)** que exercem força física vetorial sutil sobre a aeronave ao sobrevoá-los.
3. **Casamatas e Bunkers Costeiros (Shore Flak Turrets)** posicionados nas margens que disparam projéteis pesados em arco.

---

## 📋 Mapeamento de Tarefas Detalhadas

### ✅ Task 3.1: Tipagem e Constantes dos Novos Perigos [CONCLUÍDA]
- **Arquivos impactados:**
  - [constants.ts](file:///Users/bruno/Dev/pocs/river-raid/src/game/constants.ts)
  - [HazardManager.ts](file:///Users/bruno/Dev/pocs/river-raid/src/game/HazardManager.ts)
- **Sub-etapas:**
  1. [x] Definir em `constants.ts`: constantes para Minas, Redemoinhos e Bunkers.
  2. [x] Adicionar interfaces `SeaMine`, `Whirlpool`, `ShoreBunker`, `BunkerBulletSpawn`.
- **Critérios de Aceite:**
  - Tipos consistentes e integrados ao sistema de entidades.

---

### ✅ Task 3.2: Sistema de Minas Flutuantes e Reação em Cadeia (`HazardManager.ts`) [CONCLUÍDA]
- **Arquivos impactados:**
  - [HazardManager.ts](file:///Users/bruno/Dev/pocs/river-raid/src/game/HazardManager.ts) [NEW]
  - [HazardManager.test.ts](file:///Users/bruno/Dev/pocs/river-raid/src/game/HazardManager.test.ts) [NEW]
  - [CollisionSystem.ts](file:///Users/bruno/Dev/pocs/river-raid/src/game/CollisionSystem.ts)
- **Sub-etapas:**
  1. [x] Criar `HazardManager` para gerenciar pools e ciclo de vida de minas aquáticas.
  2. [x] Implementar detonação com tiro, laser de Overdrive e colisão física.
  3. [x] Implementar detonação em cadeia (`triggerMineChain`) destruindo minas e inimigos no raio `MINE_CHAIN_RADIUS`.
  4. [x] Testes unitários cobrindo física e reação em cadeia.
- **Critérios de Aceite:**
  - Tiros detonam minas com precisão.
  - Reações em cadeia destroem alvos próximos e somam pontos com combo.

---

### ✅ Task 3.3: Física de Redemoinhos & Bunkers de Margem [CONCLUÍDA]
- **Arquivos impactados:**
  - [HazardManager.ts](file:///Users/bruno/Dev/pocs/river-raid/src/game/HazardManager.ts)
  - [HazardManager.test.ts](file:///Users/bruno/Dev/pocs/river-raid/src/game/HazardManager.test.ts)
  - [Game.ts](file:///Users/bruno/Dev/pocs/river-raid/src/game/Game.ts)
- **Sub-etapas:**
  1. [x] Adicionar redemoinhos no leito do rio com rotação e força centrípeta vetorial calculada em `applyWhirlpoolForces`.
  2. [x] Adicionar casamatas/bunkers nas margens rochosas que miram na posição do jogador e disparam projéteis pesados.
  3. [x] Criar testes unitários em `HazardManager.test.ts`.
- **Critérios de Aceite:**
  - A força do redemoinho é controlável com manobras do caça.
  - Bunkers sofrem dano de tiros e concedem 150 pts ao serem destruídos.

---

### ✅ Task 3.4: Renderização Estilizada dos Novos Perigos (`HazardRenderer.ts`) [CONCLUÍDA]
- **Arquivos impactados:**
  - [HazardRenderer.ts](file:///Users/bruno/Dev/pocs/river-raid/src/game/HazardRenderer.ts) [NEW]
  - [HazardRenderer.test.ts](file:///Users/bruno/Dev/pocs/river-raid/src/game/HazardRenderer.test.ts) [NEW]
- **Sub-etapas:**
  1. [x] **Mina Aquática**: Esfera de metal escuro com 8 espinhos vermelhos e LED central pulsante.
  2. [x] **Redemoinho**: Espiral d'água com gradiente de profundidade e braços espiralados de espuma.
  3. [x] **Bunker Costeiro**: Casamata de concreto camuflada com cúpula giratória e cano duplo rotativo.
  4. [x] Testes visuais e de contexto em `HazardRenderer.test.ts`.
- **Critérios de Aceite:**
  - Identificação visual imediata dos perigos em alta velocidade.
  - Zero alocações por frame nos métodos de renderização.

---

### ✅ Task 3.5: Integração no Loop e Balanceamento de Spawn [CONCLUÍDA]
- **Arquivos impactados:**
  - [Game.ts](file:///Users/bruno/Dev/pocs/river-raid/src/game/Game.ts)
  - [Game.test.ts](file:///Users/bruno/Dev/pocs/river-raid/src/game/Game.test.ts)
  - [CollisionSystem.ts](file:///Users/bruno/Dev/pocs/river-raid/src/game/CollisionSystem.ts)
- **Sub-etapas:**
  1. [x] Integrar os perigos no loop de atualização, física e detecção de colisões espaciais.
  2. [x] Regular a taxa de spawn para garantir corredores navegáveis de pelo menos 60px.
  3. [x] Atualizar e rodar os testes de `Game.test.ts`.
- **Critérios de Aceite:**
  - O rio sempre possui pelo menos uma rota segura para passagem.
  - Todos os testes de colisão e ciclo de jogo passam com 100% de sucesso.

---

## 🧪 Status de Verificação da Sprint 03
- **Testes Automatizados:** `npm run typecheck && npm test && npm run test:coverage && npm run lint` — **100% Aprovado**.
- **Cobertura Final**: 84.18% Stmts, 77.55% Branch, 81.63% Funcs, 85.21% Lines.
- **Status da Sprint**: ✅ **Finalizada e Entregue**.
