# River Raid 🛩️

Clone moderno e aprimorado do clássico *River Raid*, construído com `React + Vite + TypeScript + HTML5 Canvas`. 

O projeto utiliza uma arquitetura híbrida de alto desempenho: o **React** cuida da interface (shell, menus e overlays), enquanto uma **Engine modular em TypeScript puro** (`src/game/`) gerencia o loop principal de 60 FPS via Canvas, garantindo fluidez e isolamento de lógica.

## 🚀 Jogue Online
- **GitHub Pages:** [brunolagoa.github.io/river-raid/](https://brunolagoa.github.io/river-raid/)

---

## 🕹️ Mecânicas de Gameplay

### Core
- **Auto-Scroll Dinâmico:** O rio avança continuamente, acelerando conforme o tempo de jogo passa.
- **Gerenciamento de Combustível:** Pilote sobre tanques de FUEL para reabastecer. Ficar sem combustível resulta em queda imediata.
- **Inimigos com IA:**
  - **Helicópteros:** Movimentação lateral errática e disparos frequentes.
  - **Aviões de Caça:** Velozes, cruzam a tela horizontalmente e atiram com precisão.
  - **Barcos:** Obstáculos lentos que patrulham o rio.
  - **Pontes:** Checkpoints físicos e estratégicos que podem dropar combustível.

### 🌟 Sistema de Power-ups (Novo!)
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
- O jogo detecta automaticamente dispositivos touch e exibe um **D-Pad Virtual** e **Botão de Ação** ergonômicos nas extremidades da tela.

---

## 🛠️ Stack Técnica
- **Framework:** React 19 + Vite 8
- **Linguagem:** TypeScript 6 (Strict Mode)
- **Renderização:** HTML5 Canvas API (Context 2D)
- **Áudio:** Web Audio API (Sons procedurais e sintéticos)
- **Design:** CSS Moderno (Dynamic Viewports, Glassmorphism, Neon FX)

---

## 📁 Estrutura do Projeto
```text
src/
  ├── game/                # Engine de Jogo (Pure TS)
  │   ├── Game.ts          # Orquestrador Central
  │   ├── Player.ts        # Lógica da Aeronave e Tiros
  │   ├── EnemyManager.ts  # IA e Spawn de Inimigos
  │   ├── PowerUpSystem.ts # Sistema de Itens e Timers
  │   ├── World.ts         # Geração Procedural do Rio
  │   ├── FuelSystem.ts    # Logística de Combustível
  │   ├── CollisionSystem.ts# Física de Colisões AABB
  │   ├── Fx.ts            # Partículas, Shakes e Popups
  │   ├── SoundManager.ts  # Sintetizador de Áudio
  │   └── UI.ts            # Rendering do HUD e Radar
  ├── components/          # Componentes React
  │   ├── GameCanvas.tsx   # Ponte React <-> Canvas
  │   └── TouchControls.tsx# Interface Mobile
  └── App.tsx              # Shell e Gestão de Telas
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
