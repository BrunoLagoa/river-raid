# Sprint 01: Efeitos Climáticos & Iluminação Dinâmica

## 🎯 Objetivo da Sprint
Elevar a imersão visual e fidelidade atmosférica do jogo, introduzindo:
1. **Efeitos climáticos procedurais integrados aos biomas** (Chuva tropical com relâmpagos na Selva, Nevasca no Ártico, Tempestade de poeira no Deserto e Fumaça/Cinzas no Industrial).
2. **Sistema de iluminação dinâmica** (Farol cônico frontal do avião durante as fases noturnas e iluminação pontual ao redor de tiros, mísseis e explosões).
3. **Controles de acessibilidade** para alternar/reduzir esses efeitos via menu de configurações e respeito a `reducedMotion`.

---

## 📋 Mapeamento de Tarefas Detalhadas

### ✅ Task 1.1: Definições de Tipos e Constantes de Clima e Luz [CONCLUÍDA]
- **Arquivos impactados:**
  - [constants.ts](file:///Users/bruno/Dev/pocs/river-raid/src/game/constants.ts)
  - [BiomeSystem.ts](file:///Users/bruno/Dev/pocs/river-raid/src/game/BiomeSystem.ts)
  - [BiomeSystem.test.ts](file:///Users/bruno/Dev/pocs/river-raid/src/game/BiomeSystem.test.ts)
- **Sub-etapas:**
  1. [x] Adicionar constantes de densidade, velocidade e cores de partículas climáticas em `constants.ts`.
  2. [x] Adicionar propriedade `weatherType: 'rain' | 'snow' | 'sandstorm' | 'smog' | 'clear'` no tipo `EffectiveBiomeConfig` e nas definições de `BIOMES` em `BiomeSystem.ts`.
  3. [x] Atualizar `BiomeSystem.test.ts` para validar a interpolação e mapeamento do tipo de clima por bioma.
- **Critérios de Aceite:**
  - `npm run typecheck` passa sem erros.
  - Testes do `BiomeSystem` verificam que cada bioma exporta o clima correto.

---

### ✅ Task 1.2: Motor de Partículas Climáticas (`WeatherSystem.ts`) [CONCLUÍDA]
- **Arquivos impactados:**
  - [WeatherSystem.ts](file:///Users/bruno/Dev/pocs/river-raid/src/game/WeatherSystem.ts) [NEW]
  - [WeatherSystem.test.ts](file:///Users/bruno/Dev/pocs/river-raid/src/game/WeatherSystem.test.ts) [NEW]
  - [ObjectPool.ts](file:///Users/bruno/Dev/pocs/river-raid/src/game/ObjectPool.ts)
- **Sub-etapas:**
  1. [x] Criar a classe `WeatherSystem` com pooling pré-alocado de partículas para evitar *garbage collection* a 60 FPS.
  2. [x] Implementar lógica de atualização de partículas:
     - **Chuva (Jungle)**: Gotas rápidas verticais/diagonais com flashes esporádicos de relâmpagos na tela (flash de luz de 0.08s).
     - **Nevasca (Snow)**: Flocos flutuantes com movimento senoidal lateral e turbulência de vento.
     - **Tempestade de Areia (Desert)**: Partículas horizontais com névoa volumétrica suave.
     - **Cinzas/Fumaça (Industrial)**: Partículas escuras lentas subindo e descendo com oscilação.
  3. [x] Implementar método `render(ctx: CanvasRenderingContext2D, width: number, height: number, reducedMotion: boolean)`.
  4. [x] Criar suíte completa de testes unitários em `WeatherSystem.test.ts`.
- **Critérios de Aceite:**
  - Partículas são recicladas sem alocação contínua de memória (`ObjectPool`).
  - Suporta `reducedMotion = true` desativando flashes e reduzindo partículas em 80%.

---

### ✅ Task 1.3: Sistema de Iluminação Dinâmica (`LightingSystem.ts`) [CONCLUÍDA]
- **Arquivos impactados:**
  - [LightingSystem.ts](file:///Users/bruno/Dev/pocs/river-raid/src/game/LightingSystem.ts) [NEW]
  - [LightingSystem.test.ts](file:///Users/bruno/Dev/pocs/river-raid/src/game/LightingSystem.test.ts) [NEW]
  - [Atmosphere.ts](file:///Users/bruno/Dev/pocs/river-raid/src/game/Atmosphere.ts)
- **Sub-etapas:**
  1. [x] Criar `LightingSystem` para gerenciar fontes pontuais de luz e a máscara de escuridão noturna:
     - **Farol do Avião (Cone Light)**: Projetado a partir do nariz da aeronave apontando para frente com gradiente radial cônico.
     - **Fontes Pontuais (Point Lights)**: Tiros de canhão, mísseis, explosões e power-ups geram emissão temporária de luz.
  2. [x] Integrar com as fases do ciclo dia/noite do `Atmosphere.ts` (a máscara de escuridão só atua nas fases `night` e `dawn`).
  3. [x] Usar composição Canvas `'destination-out'` ou blend modes eficientes para perfurar a camada de sombra noturna com nitidez e alta performance.
  4. [x] Escrever testes unitários em `LightingSystem.test.ts`.
- **Critérios de Aceite:**
  - Iluminação é fluida e renderizada em uma única passada de composição.
  - Zero impacto em fases de dia claro (`day`).

---

### ✅ Task 1.4: Integração no Loop Principal (`Game.ts`) [CONCLUÍDA]
- **Arquivos impactados:**
  - [Game.ts](file:///Users/bruno/Dev/pocs/river-raid/src/game/Game.ts)
  - [Game.test.ts](file:///Users/bruno/Dev/pocs/river-raid/src/game/Game.test.ts)
  - [Fx.ts](file:///Users/bruno/Dev/pocs/river-raid/src/game/Fx.ts)
- **Sub-etapas:**
  1. [x] Instanciar `WeatherSystem` e `LightingSystem` no construtor de `Game.ts`.
  2. [x] Atualizar clima conforme o `effectiveBiome` retornado pelo `BiomeSystem`.
  3. [x] Injetar tiros e explosões ativas como fontes de luz no `LightingSystem`.
  4. [x] Ordenar a renderização no canvas:
     - Fundo/Rio/Margens -> Entidades -> **Máscara de Iluminação** -> **Partículas Climáticas** -> HUD/UI -> Scanlines.
  5. [x] Atualizar os testes em `Game.test.ts` garantindo que novos sistemas sejam atualizados e resetados corretamente no ciclo de vida do jogo.
- **Critérios de Aceite:**
  - Jogo renderiza os novos efeitos em sincronia com o ciclo dia/noite e biomas.
  - Todos os 91+ testes existentes de `Game.test.ts` continuam passando.

---

### ✅ Task 1.5: Configurações de Acessibilidade no Menu React [CONCLUÍDA]
- **Arquivos impactados:**
  - [SettingsService.ts](file:///Users/bruno/Dev/pocs/river-raid/src/game/SettingsService.ts)
  - [SettingsScreen.tsx](file:///Users/bruno/Dev/pocs/river-raid/src/components/SettingsScreen.tsx)
  - [i18n.ts](file:///Users/bruno/Dev/pocs/river-raid/src/i18n.ts)
  - [GameCanvas.tsx](file:///Users/bruno/Dev/pocs/river-raid/src/components/GameCanvas.tsx)
  - [SettingsService.test.ts](file:///Users/bruno/Dev/pocs/river-raid/src/game/SettingsService.test.ts)
- **Sub-etapas:**
  1. [x] Adicionar chave `weatherEffects: boolean` e `dynamicLighting: boolean` em `GameSettings` (ambos `true` por padrão).
  2. [x] Adicionar toggles na tela `SettingsScreen.tsx` com suporte a internacionalização em `i18n.ts` (PT e EN).
  3. [x] Repassar as novas opções para a instância de `Game` via `GameCanvas.tsx`.
  4. [x] Atualizar testes unitários em `SettingsService.test.ts`.
- **Critérios de Aceite:**
  - Usuário pode desativar individualmente o clima e a iluminação.
  - As preferências persistem no `localStorage`.

---

## 🧪 Status de Verificação da Sprint 01
- **Testes Automatizados:** `npm run typecheck && npm test && npm run test:coverage && npm run lint` — **100% Aprovado**.
- **Cobertura Final**: 83.91% Stmts, 79.53% Branch, 80.80% Funcs, 84.78% Lines (Superando os portões mínimos de qualidade).
- **Status da Sprint**: ✅ **Finalizada e Entregue**.
1. **Testes Automatizados:**
   ```bash
   npm run typecheck
   npm test
   npm run lint
   ```
2. **Validação Visual no Navegador:**
   - Iniciar jogo em bioma de neve e verificar nevasca.
   - Avançar até a fase noturna e validar o farol cônico do avião iluminando o rio escuro e as margens.
   - Disparar tiros e detonar pontes/tanques para verificar flashes de luz dinâmicos.
