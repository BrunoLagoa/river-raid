# 🗺️ Roadmap de Desenvolvimento — River Raid

Este diretório contém o detalhamento técnico e o plano de desenvolvimento dividido em **Sprints modulares**. Cada sprint é projetada para ser executada de forma independente, incremental e segura, garantindo que cada micro-task possa ser implementada e testada sem perda de contexto ou quebra de testes existentes.

---

## 📑 Sumário das Sprints

| Sprint | Título | Foco Principal | Status | Arquivo de Detalhamento |
|:---:|---|---|:---:|---|
| **01** | **Efeitos Climáticos & Iluminação Dinâmica** | Chuva, nevasca, tempestade de areia, farol noturno da aeronave e iluminação de disparos/explosões. | ✅ **Concluída** | [sprint-1-weather-and-lighting.md](sprint-1-weather-and-lighting.md) |
| **02** | **Batalhas de Chefe & Sistema Overdrive** | Batalhas com chefes navais/aéreos em fases e mecânica de medidor de especial (Overdrive: Laser / EMP). | ✅ **Concluída** | [sprint-2-boss-encounters-and-overdrive.md](sprint-2-boss-encounters-and-overdrive.md) |
| **03** | **Perigos Ambientais & Obstáculos** | Minas aquáticas flutuantes com reação em cadeia, redemoinhos no rio e casamatas/torres antiaéreas nas margens. | ✅ **Concluída** | [sprint-3-hazards-and-obstacles.md](sprint-3-hazards-and-obstacles.md) |
| **04** | **Áudio Adaptativo & Síntese de Voz Retrô** | Camadas dinâmicas na trilha de áudio (combo x4, combustível baixo) e voz sintetizada 8-bit de avisos táticos. | ✅ **Concluída** | [sprint-4-adaptive-audio-and-speech.md](sprint-4-adaptive-audio-and-speech.md) |
| **05** | **Controles Customizados, Haptics & Mobile Joystick** | Remapeamento de teclas, feedback tátil (gamepad/mobile) e floating touch joystick analógico. | ✅ **Concluída** | [sprint-5-controls-and-haptics.md](sprint-5-controls-and-haptics.md) |
| **06** | **Hangar de Aeronaves & Estatísticas de Carreira** | Customização de skins de aeronaves desbloqueáveis e diário de bordo com estatísticas acumuladas de voo. | ✅ **Concluída** | [sprint-6-hangar-and-pilot-stats.md](sprint-6-hangar-and-pilot-stats.md) |
| **07** | **Novos Modos de Jogo & Ghost Replay** | Modos Boss Rush, Hardcore e Prática Zen, além de gravação e reprodução do avião fantasma do recorde. | ✅ **Concluída** | [sprint-7-game-modes-and-ghost-replay.md](sprint-7-game-modes-and-ghost-replay.md) |
| **08** | **PWA, Cache de Sprites & Otimizações** | Suporte a Progressive Web App (Offline First), pré-renderização em OffscreenCanvas e scaling HiDPI. | ✅ **Concluída** | [sprint-8-pwa-and-performance.md](sprint-8-pwa-and-performance.md) |
| **09** | **Cinemática de Abertura** | Introdução in-engine (~37 s, noite → amanhecer) que apresenta o conflito e vira o gameplay sem troca de cena. | ✅ **Concluída** | [sprint-9-intro-cinematic.md](sprint-9-intro-cinematic.md) |

---

## 🛡️ Diretrizes de Execução e Qualidade

1. **Test-Driven & Incremental**:
   - Cada task define seus testes em `src/game/*.test.ts` antes ou junto com a implementação.
   - A sequência de validação está no item 4 abaixo.
2. **Isolamento Arquitetural**:
   - Toda lógica de simulação em 60 FPS reside em `src/game/`.
   - Componentes React em `src/components/` cuidam estritamente da interface, menus, configurações e overlays.
3. **Preservação de Performance**:
   - Zero alocação de objetos por frame em hot paths (utilizar `ObjectPool` e estruturas mutáveis pré-alocadas).
   - Suporte a `reducedMotion` em todos os novos efeitos visuais.
4. **Validação antes de concluir**:
   ```bash
   npm run typecheck
   npm run lint
   npm test
   npm run test:coverage   # ao tocar em engine/cobertura
   npm run build
   ```
