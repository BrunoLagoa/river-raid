# 🗺️ Roadmap de Desenvolvimento — River Raid

Este diretório contém o detalhamento técnico e o plano de desenvolvimento dividido em **Sprints modulares**. Cada sprint é projetada para ser executada de forma independente, incremental e segura, garantindo que cada micro-task possa ser implementada e testada sem perda de contexto ou quebra de testes existentes.

---

## 📑 Sumário das Sprints

| Sprint | Título | Foco Principal | Status | Arquivo de Detalhamento |
|:---:|---|---|:---:|---|
| **01** | **Efeitos Climáticos & Iluminação Dinâmica** | Chuva, nevasca, tempestade de areia, farol noturno da aeronave e iluminação de disparos/explosões. | ✅ **Concluída** | [sprint-1-weather-and-lighting.md](file:///Users/bruno/Dev/pocs/river-raid/docs/sprint-1-weather-and-lighting.md) |
| **02** | **Batalhas de Chefe & Sistema Overdrive** | Batalhas com chefes navais/aéreos em fases e mecânica de medidor de especial (Overdrive: Laser / EMP). | ✅ **Concluída** | [sprint-2-boss-encounters-and-overdrive.md](file:///Users/bruno/Dev/pocs/river-raid/docs/sprint-2-boss-encounters-and-overdrive.md) |
| **03** | **Perigos Ambientais & Obstáculos** | Minas aquáticas flutuantes com reação em cadeia, redemoinhos no rio e casamatas/torres antiaéreas nas margens. | ⏳ **A Iniciar** | [sprint-3-hazards-and-obstacles.md](file:///Users/bruno/Dev/pocs/river-raid/docs/sprint-3-hazards-and-obstacles.md) |
| **04** | **Áudio Adaptativo & Síntese de Voz Retrô** | Camadas dinâmicas na trilha de áudio (combo x4, combustível baixo) e voz sintetizada 8-bit de avisos táticos. | ⏳ **Pendente** | [sprint-4-adaptive-audio-and-speech.md](file:///Users/bruno/Dev/pocs/river-raid/docs/sprint-4-adaptive-audio-and-speech.md) |
| **05** | **Controles Customizados, Haptics & Mobile Joystick** | Remapeamento de teclas, feedback tátil (gamepad/mobile) e floating touch joystick analógico. | ⏳ **Pendente** | [sprint-5-controls-and-haptics.md](file:///Users/bruno/Dev/pocs/river-raid/docs/sprint-5-controls-and-haptics.md) |
| **06** | **Hangar de Aeronaves & Estatísticas de Carreira** | Customização de skins de aeronaves desbloqueáveis e diário de bordo com estatísticas acumuladas de voo. | ⏳ **Pendente** | [sprint-6-hangar-and-pilot-stats.md](file:///Users/bruno/Dev/pocs/river-raid/docs/sprint-6-hangar-and-pilot-stats.md) |
| **07** | **Novos Modos de Jogo & Ghost Replay** | Modos Boss Rush, Hardcore e Prática Zen, além de gravação e reprodução do avião fantasma do recorde. | ⏳ **Pendente** | [sprint-7-game-modes-and-ghost-replay.md](file:///Users/bruno/Dev/pocs/river-raid/docs/sprint-7-game-modes-and-ghost-replay.md) |
| **08** | **PWA, Cache de Sprites & Otimizações** | Suporte a Progressive Web App (Offline First), pré-renderização em OffscreenCanvas e scaling HiDPI. | ⏳ **Pendente** | [sprint-8-pwa-and-performance.md](file:///Users/bruno/Dev/pocs/river-raid/docs/sprint-8-pwa-and-performance.md) |

---

## 🛡️ Diretrizes de Execução e Qualidade

1. **Test-Driven & Incremental**:
   - Cada task define seus testes em `src/game/*.test.ts` antes ou junto com a implementação.
   - Os comandos de validação obrigatórios após cada task são:
     ```bash
     npm run typecheck
     npm test
     npm run lint
     ```
2. **Isolamento Arquitetural**:
   - Toda lógica de simulação em 60 FPS reside em `src/game/`.
   - Componentes React em `src/components/` cuidam estritamente da interface, menus, configurações e overlays.
3. **Preservação de Performance**:
   - Zero alocação de objetos por frame em hot paths (utilizar `ObjectPool` e estruturas mutáveis pré-alocadas).
   - Suporte a `reducedMotion` em todos os novos efeitos visuais.
