# Sprint 03: Perigos Ambientais & Obstáculos de Rio

## 🎯 Objetivo da Sprint
Tornar a navegação pelo rio mais estratégica e desafiadora, introduzindo:
1. **Minas Aquáticas Flutuantes (Sea Mines)** com temporizadores pulsantes e detonação em cadeia (*Chain Explosions*).
2. **Redemoinhos no Rio (Whirlpools)** que exercem força física vetorial sutil sobre a aeronave ao sobrevoá-los.
3. **Casamatas e Bunkers Costeiros (Shore Flak Turrets)** posicionados nas margens que disparam projéteis pesados em arco.

---

## 📋 Mapeamento de Tarefas Detalhadas

### Task 3.1: Tipagem e Constantes dos Novos Perigos
- **Arquivos impactados:**
  - [constants.ts](file:///Users/bruno/Dev/pocs/river-raid/src/game/constants.ts)
  - [World.ts](file:///Users/bruno/Dev/pocs/river-raid/src/game/World.ts)
  - [EnemyManager.ts](file:///Users/bruno/Dev/pocs/river-raid/src/game/EnemyManager.ts)
- **Sub-etapas:**
  1. Definir em `constants.ts`:
     - `MINE_SIZE = 18`, `MINE_CHAIN_RADIUS = 60`, `MINE_TRIGGER_PROXIMITY = 40`, `MINE_POINTS = 50`.
     - `WHIRLPOOL_RADIUS = 35`, `WHIRLPOOL_PULL_FORCE = 160`.
     - `BUNKER_SHOOT_INTERVAL = 3.2`, `BUNKER_BULLET_SPEED = 180`, `BUNKER_POINTS = 150`.
  2. Adicionar tipo `HazardType = 'mine' | 'whirlpool' | 'bunker'` e interfaces associadas.
- **Critérios de Aceite:**
  - Tipos consistentes e integrados ao sistema de entidades.

---

### Task 3.2: Sistema de Minas Flutuantes e Reação em Cadeia (`MineSystem.ts`)
- **Arquivos impactados:**
  - `src/game/MineSystem.ts` [NEW]
  - `src/game/MineSystem.test.ts` [NEW]
  - [CollisionSystem.ts](file:///Users/bruno/Dev/pocs/river-raid/src/game/CollisionSystem.ts)
- **Sub-etapas:**
  1. Criar `MineSystem` para gerenciar grupos de minas aquáticas que descem com o rio.
  2. Implementar detonação ao receber tiro do jogador ou por proximidade excessiva:
     - Ao detonar, cria uma onda de choque de dano em raio de 60px.
     - Se outra mina estiver no raio, ela detona após 0.1s gerando uma explosão em cadeia.
  3. Barcos e tanques pegos na explosão de minas sofrem dano/destruição concedendo pontos ao jogador.
  4. Testes unitários cobrindo física e reação em cadeia em `MineSystem.test.ts`.
- **Critérios de Aceite:**
  - Tiros detonam minas com precisão.
  - Reações em cadeia geram multiplicador extra de pontuação.

---

### Task 3.3: Física de Redemoinhos & Bunkers de Margem
- **Arquivos impactados:**
  - `src/game/HazardManager.ts` [NEW]
  - `src/game/HazardManager.test.ts` [NEW]
  - [Player.ts](file:///Users/bruno/Dev/pocs/river-raid/src/game/Player.ts)
  - [Scenery.ts](file:///Users/bruno/Dev/pocs/river-raid/src/game/Scenery.ts)
- **Sub-etapas:**
  1. Adicionar redemoinhos no leito do rio que giram visualmente e aplicam força centrípeta vetorial sobre a posição do avião (`player.x += pullVx * dt`).
  2. Adicionar casamatas/bunkers nas margens rochosas que miram na posição atual do jogador e disparam projéteis com rastro de fumaça.
  3. Criar testes unitários em `HazardManager.test.ts`.
- **Critérios de Aceite:**
  - A força do redemoinho é controlável pelo jogador com contra-esterçamento.
  - Bunkers podem ser destruídos com tiros do canhão.

---

### Task 3.4: Renderização Estilizada dos Novos Perigos
- **Arquivos impactados:**
  - `src/game/HazardRenderer.ts` [NEW]
  - `src/game/HazardRenderer.test.ts` [NEW]
  - [Fx.ts](file:///Users/bruno/Dev/pocs/river-raid/src/game/Fx.ts)
- **Sub-etapas:**
  1. **Mina Aquática**: Esfera preta com espinhos vermelhos e LED central piscante (LED acelera o piscar quando armada).
  2. **Redemoinho**: Espiral de água rotativa com gradiente de profundidade e espuma espiralada.
  3. **Bunker Costeiro**: Casamata de concreto camuflada com cúpula de aço giratória.
  4. Testes visuais e de contexto em `HazardRenderer.test.ts`.
- **Critérios de Aceite:**
  - Identificação visual imediata dos perigos pelo jogador em alta velocidade.

---

### Task 3.5: Integração no Loop e Balanceamento de Spawn
- **Arquivos impactados:**
  - [Game.ts](file:///Users/bruno/Dev/pocs/river-raid/src/game/Game.ts)
  - [Game.test.ts](file:///Users/bruno/Dev/pocs/river-raid/src/game/Game.test.ts)
- **Sub-etapas:**
  1. Integrar os perigos no loop de atualização e detecção de colisões espaciais (`SpatialGrid.ts`).
  2. Regular a taxa de spawn para garantir corredores navegáveis e evitar bloqueios injustos do rio.
  3. Atualizar e rodar os testes de `Game.test.ts`.
- **Critérios de Aceite:**
  - O rio sempre possui pelo menos uma rota segura para passagem.
  - Todos os testes de colisão e ciclo de jogo passam com 100% de sucesso.

---

## 🧪 Plano de Verificação da Sprint 03
1. **Testes Automatizados:**
   ```bash
   npm run typecheck
   npm test
   ```
2. **Validação de Gameplay no Navegador:**
   - Atirar em uma mina em um cluster e observar a reação em cadeia destruindo barcos próximos.
   - Navegar sobre um redemoinho e sentir a força física arrastando sutilmente a aeronave.
   - Destruir um bunker na margem do rio e receber os pontos no HUD.
