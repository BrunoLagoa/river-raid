# River Raid 🛩️

Clone moderno e aprimorado do clássico *River Raid*, construído com `React + Vite + TypeScript + HTML5 Canvas`. 

O projeto utiliza uma arquitetura híbrida de alto desempenho: o **React** cuida da interface (shell, menus e overlays), enquanto uma **Engine modular em TypeScript puro** (`src/game/`) gerencia o loop principal de 60 FPS via Canvas, garantindo fluidez e isolamento de lógica.

## 🚀 Jogue Online
- **GitHub Pages:** [brunolagoa.github.io/river-raid/](https://brunolagoa.github.io/river-raid/)

---

## 🕹️ Mecânicas de Gameplay

### Core
- **Auto-Scroll Dinâmico:** O rio avança continuamente, acelerando conforme o tempo de jogo passa.
- **Sistema de 3 Vidas:** Você tem 3 chances antes do Game Over. Ao morrer, o avião renasce no centro do rio com **2.5s de invencibilidade** (sprite piscante). Ficar sem combustível também consome uma vida e restaura 30% do tanque para evitar loops de morte.
- **Gerenciamento de Combustível:** Pilote sobre tanques de FUEL para reabastecer. O tanque drena continuamente conforme o tempo passa.
- **Inimigos com IA:**
  - **Helicópteros:** Movimentação lateral errática e disparos frequentes.
  - **Aviões de Caça:** Velozes, cruzam a tela horizontalmente e atiram com precisão.
  - **Barcos:** Obstáculos lentos que patrulham o rio.
  - **Pontes:** Checkpoints físicos e estratégicos que podem dropar combustível.

### 🌟 Sistema de Power-ups
Itens especiais flutuam no rio após a destruição de inimigos (8% de chance):
- **[D] Double Shot:** Dispare dois mísseis paralelos simultâneos por 10 segundos.
- **[S] Shield:** Ativa uma redoma de energia rotacional (com animação orbital). Absorve 1 hit e concede 1.5s de invencibilidade.
- **[T] Slow Motion:** Manipula o tempo do cenário e inimigos, reduzindo a velocidade global em 50% por 5 segundos. Seus tiros continuam na velocidade normal!

### 🔥 Combo Multiplier (Sistema Tático)
Recompensa para jogadores precisos:
- **Níveis de Multiplicador:** Acertos consecutivos elevam seu score de **1x** até **4x MAX!**.
- **Janela de Tempo:** Cada nível de combo tem uma "vida" de 6 segundos. Se não abater ninguém nesse tempo, o combo entra em *Decay* (cai um nível por vez).
- **Penalidade de Miss:** Se um projétil sair da tela sem atingir nada, o multiplicador reseta instantaneamente para **1x**.
- **Custo de Gatilho:** Cada tiro disparado consome **-0.3s** da sua barra de tempo de combo, desencorajando o uso indiscriminado de munição.

### 🌅 Ciclo Dia/Noite
O jogo possui um ciclo atmosférico contínuo de **8 minutos** com 4 fases que alteram toda a paleta de cores do cenário em tempo real:
- ☀️ **Day** (2 min) — Cores vibrantes, nuvens brancas, brilho máximo.
- 🌅 **Sunset** (2 min) — Tons quentes alaranjados, nuvens alaranjadas, brilho 75%.
- 🌙 **Night** (2 min) — Cores frias e escuras, nuvens azul-cinza, brilho 45%.
- 🌄 **Dawn** (2 min) — Tons suaves em lilás/roxo, nuvens púrpura, brilho 70%.

As transições usam interpolação `smoothstep` com período de retenção (35% hold) para mudanças suaves e orgânicas. O ciclo roda em tempo real independente de pausas, mortes ou slow motion.

### 🏆 Ranking Top 10
- Sistema de ranking local com persistência via `localStorage`.
- Armazenamento seguro com ofuscação XOR e verificação de integridade via checksum FNV-1a para prevenir manipulação de scores.
- Entrada de nome do jogador na tela de Game Over quando o score qualifica para o Top 10.

### ✨ Polimento Visual
O jogo conta com camadas avançadas de feedback visual para uma experiência mais imersiva:
- **Screen Shake Dinâmico:** Tremores de tela com intensidades variadas para destruição de pontes (forte), morte de inimigos (médio), subida de combo (micro) e morte do jogador (impactante).
- **Trail de Fumaça Reativo:** O rastro do avião muda de cor em tempo real: Laranja vibrante ao acelerar (↑) e cinza escuro ao frear (↓).
- **Rio Vivo e Orgânico:** O rio possui 8 camadas de ondas senoidais, gradiente de profundidade e brilho (*shimmer*) dinâmico na superfície da água.
- **Cenário Decorativo Pixel-Art:** Palmeiras, árvores, casas, arbustos, rochas e depósitos de combustível nas margens do rio, com dimming noturno.
- **Nuvens Parallax:** Nuvens em pixel-art com 3 variações de forma, movendo-se em velocidades diferentes e com cores que acompanham o ciclo dia/noite.
- **CRT Scanlines:** Overlay sutil de linhas horizontais simulando um monitor de tubo.
- **Death Smoke:** Nuvens de fumaça escura que permanecem no ar momentaneamente após a destruição de qualquer alvo.
- **Explosões Massivas:** Pontes possuem explosões com o dobro de partículas e tremores prolongados.
- **HUD de Vidas:** Ícones de mini-avião abaixo do score mostram as vidas restantes em tempo real.
- **Mini-mapa Radar:** Radar no canto superior direito mostra posição do jogador, inimigos (vermelho), combustível (verde) e power-ups (ciano).

### 🎵 Áudio
- **Música Chiptune Procedural:** Melodia gerada em tempo real via Web Audio API com osciladores `square` (lead) e `triangle` (bass), alternando entre duas variações a cada 32 compassos.
- **Efeitos Sonoros:** Tiro, explosão, coleta de combustível, alerta de combustível baixo, hit em inimigo e game over — todos sintetizados proceduralmente.

---

## 📱 Controles e Plataforma

### Desktop (Teclado)
- `←` / `→` ou `A` / `D`: Movimentação lateral.
- `↑` / `↓` ou `W` / `S`: Ajuste de velocidade (Acelerar/Frear).
- `Espaço`: Disparar metralhadora.
- `P` / `Esc`: Pausar jogo.
- `M`: Alternar Mudo.
- `Enter`: Iniciar / Reiniciar.

### Mobile (Touch)
- O jogo detecta automaticamente dispositivos touch e oferece dois modos de controle:
  - **D-Pad Virtual:** Direcional com botões de seta e botão FIRE dedicado.
  - **Swipe Controls:** Arraste para mover horizontalmente, toque para atirar.
- Botões de Pausa e Mudo posicionados no canto superior esquerdo da tela.

---

## 🛠️ Stack Técnica
- **Runtime:** Node.js 24
- **Framework:** React 19 + Vite 8
- **Linguagem:** TypeScript 6 (Strict Mode)
- **Renderização:** HTML5 Canvas API (Context 2D)
- **Áudio:** Web Audio API (Sons procedurais e sintéticos)
- **Testes:** Vitest 4
- **Design:** CSS Moderno (Dynamic Viewports, Glassmorphism, Neon FX)
- **CI/CD:** GitHub Actions → GitHub Pages (deploy automático na `main`)

---

## 📁 Estrutura do Projeto
```text
src/
  ├── game/                  # Engine de Jogo (Pure TS)
  │   ├── Game.ts            # Orquestrador Central e Loop Principal
  │   ├── Player.ts          # Lógica da Aeronave e Tiros
  │   ├── EnemyManager.ts    # IA e Spawn de Inimigos
  │   ├── PowerUpSystem.ts   # Sistema de Itens e Timers
  │   ├── World.ts           # Geração Procedural do Rio
  │   ├── FuelSystem.ts      # Logística de Combustível
  │   ├── CollisionSystem.ts # Física de Colisões AABB
  │   ├── Atmosphere.ts      # Ciclo Dia/Noite, Nuvens e Scanlines
  │   ├── Scenery.ts         # Cenário Decorativo Pixel-Art
  │   ├── Fx.ts              # Partículas, Shakes e Popups
  │   ├── SoundManager.ts    # Sintetizador de Áudio e Música
  │   ├── UI.ts              # Rendering do HUD e Radar
  │   ├── RankingService.ts  # Sistema de Ranking Top 10
  │   ├── StorageService.ts  # Armazenamento Seguro (localStorage)
  │   └── utils.ts           # Funções Utilitárias
  ├── components/            # Componentes React
  │   ├── GameCanvas.tsx     # Ponte React ↔ Canvas
  │   ├── TouchControls.tsx  # Interface Mobile (D-Pad)
  │   └── SwipeControls.tsx  # Interface Mobile (Swipe)
  └── App.tsx                # Shell e Gestão de Telas
```

---

## 📈 Roadmap e Documentação
Para detalhes técnicos mais profundos e planos de futuras versões, consulte:
- `spec.md`: Roadmap de evolução detalhado.
- `prd.md`: Documento de Requisitos de Produto.
- `introducion.md`: Glossário técnico e especificações da engine.
- `AGENTS.md`: Guia de arquitetura para agentes de IA.

---
*Construído com ❤️ por Bruno Lagoa e assistentes IA.*
