# River Raid — Project Memory

## Nome
River Raid

## Descrição
Clone do clássico River Raid (Atari 2600) — vertical shooter com auto-scroll, movimentação horizontal, tiros e gerenciamento de combustível. Implementado como web game.

## Stack Principal
- **Runtime:** Browser (Canvas 2D)
- **Framework:** React 19 + Vite 8 + TypeScript 6
- **Build:** Vite com `@vitejs/plugin-react`
- **Testes:** Vitest + Testing Library
- **Lint:** ESLint 9 + typescript-eslint
- **Sem frameworks de jogo externos** — engine pura em Canvas 2D

## Estrutura de Pastas (alto nível)

```
src/
  game/           → Engine do jogo (TS puro, agnóstico ao framework)
    Game.ts          → Main loop (rAF), orquestra todos os sistemas
    Player.ts        → Aeronave: posição, movimento, tiros, estados
    EnemyManager.ts  → Spawn, tipos de inimigos, balas inimigas, dificuldade
    World.ts         → Geração procedural do rio: segmentos, curvas, margens
    FuelSystem.ts    → Dreno de combustível, coleta de tanques
    CollisionSystem.ts → Detecção de colisão AABB
    Fx.ts            → Partículas, score popups, screen flash, shake
    SoundManager.ts  → Sons procedurais (Web Audio API), mute
    UI.ts            → HUD in-canvas + minimap
    Scenery.ts       → Objetos decorativos (árvores, casas, rochas)
    StorageService.ts → Abstração localStorage
    RankingService.ts → Lógica de ranking/high score
    utils.ts         → Utilitários compartilhados
  components/
    GameCanvas.tsx   → Monta canvas, instância do Game, lifecycle bridge
  App.tsx            → Shell: telas menu/game/gameover
```

## Diretrizes Principais
- React shell + engine modular em TS puro
- React NUNCA chama métodos do game durante render
- Game.ts é agnóstico — React só chama `start()`, `stop()`, `restart()`
- Canvas apenas para renderização de gameplay
- Sem alocação de objetos no game loop — usar object pools
- Target: 60 FPS
- TypeScript strict, ESM only

## Sistema de Comandos
- Diretório: /Users/bruno/.config/opencode/commands
- Status: Estável
- Frequência de mudança: Baixa
- Regras:
  - NÃO recarregar automaticamente
  - NÃO reprocessar a cada execução
  - Recarregar apenas se houver mudança explícita

## Spec Files
- `introducion.md` — spec detalhado (referência canônica, filename com typo)
- `prd.md` — spec de produto com fases
- `spec.md` — spec adicional
