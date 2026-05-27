# Design — Fases temáticas (BiomeSystem) — Fase 1

- **Data:** 2026-05-27
- **Status:** Aprovado para implementação
- **Escopo:** Fase 1 (MVP de visual + dificuldade por bioma)
- **Decisões consolidadas via `/workflow` + skill `brainstorming`**

---

## 1. Resumo

Introduzir zonas temáticas (biomas) ao longo do rio, com paleta, mix de inimigos, curva de dificuldade, weights de scenery e largura de rio próprios. Três biomas iniciais (Floresta → Deserto → Industrial) em ordem fixa com loop, transições por tempo (120s por bioma, 10s de fade visual). Refatora `Atmosphere` para separar paleta-base (do bioma) de modulação dia/noite.

Esta é a **Fase 1** de uma feature maior. Fases 2 e 3 ficam registradas como follow-up (Seção 11).

---

## 2. Decisões fixadas

| Decisão | Valor |
|---|---|
| Interação com Atmosphere | Bioma define paleta-base; Atmosphere modula (brightness + tinte) |
| Transição | Por tempo, fade visual |
| Quantidade de biomas | 3 (Floresta, Deserto, Industrial), ordem fixa com loop |
| Duração | 120s por bioma, 10s de fade |
| Arquitetura | Push model — `BiomeSystem` central produz `EffectiveBiomeConfig` interpolado, distribuído aos sistemas |
| Dimensões customizadas na Fase 1 | Paleta, scenery weights, mix de inimigos, curva de dificuldade, largura/curvatura do rio |
| Fora desta Fase | Novos tipos de scenery, densidade de fuel variável, áudio por bioma, `FuelSystem` integrado |

---

## 3. Arquitetura

Novo módulo `src/game/BiomeSystem.ts`. Responsabilidade única: rastrear bioma atual, controlar transição, produzir um `EffectiveBiomeConfig` interpolado a cada frame. Consumido por `Atmosphere`, `World`, `Scenery`, `EnemyManager` via getter.

Pipeline do `Game.update` (já estruturado em etapas pela decisão 2026-04-16):

```
Game.update
  ├─ biomeSystem.update(dt)
  ├─ const biomeCfg = biomeSystem.getConfig()
  ├─ atmosphere.update(dt, biomeCfg.basePalette)
  ├─ world.update(dt, biomeCfg)
  ├─ scenery.update(dt, biomeCfg)
  ├─ enemyManager.update(dt, biomeCfg, ...)
  └─ ...resto do pipeline (colisões, FX, métricas)
```

`BiomeSystem` é puramente determinístico (driven por tempo). Não recebe `RandomSource`. Reset acontece em `Game.restart()`.

---

## 4. Tipos e contratos

### 4.1 Definição estática de bioma

```ts
type BiomeId = 'forest' | 'desert' | 'industrial'

interface BiomeDefinition {
  id: BiomeId
  durationSec: number                     // 120 fixo nesta Fase
  basePalette: PaletteRaw                 // ver Seção 5
  enemyWeights: Record<EnemyType, number>
  enemySpawnRateMult: number              // 1.0 = base; multiplica intervalo de spawn
  enemyTierBias: { basic: number; smart: number; elite: number }
  sceneryWeights: Partial<Record<SceneryType, number>>
  riverMinWidth: number                   // sobrescreve MIN_WIDTH em World
  riverMaxWidthRatio: number              // sobrescreve MAX_WIDTH_RATIO em World
}
```

### 4.2 Config efetivo (interpolado a cada frame)

```ts
interface EffectiveBiomeConfig {
  // Identificação
  fromBiomeId: BiomeId
  toBiomeId: BiomeId
  blend: number                           // 0 = só from, 1 = só to (durante hold = 0)
  inTransition: boolean

  // Para Atmosphere
  basePalette: PaletteRaw                 // já interpolado from→to

  // Para EnemyManager
  enemyWeights: Record<EnemyType, number>
  enemySpawnRateMult: number
  enemyTierBias: { basic: number; smart: number; elite: number }

  // Para Scenery
  sceneryWeights: Record<SceneryType, number>

  // Para World
  riverMinWidth: number
  riverMaxWidthRatio: number
}
```

### 4.3 API pública do `BiomeSystem`

```ts
class BiomeSystem {
  constructor()
  update(dt: number): void
  getConfig(): EffectiveBiomeConfig
  reset(): void
  // Acessores para debug/UI (Fase 1+)
  getCurrentBiomeId(): BiomeId
  getTimeInBiome(): number
  getTimeUntilTransition(): number
}
```

---

## 5. Definição dos 3 biomas

### 5.1 Paletas-base

Cada paleta segue o tipo `PaletteRaw` existente em `Atmosphere.ts`. Valores são alvo; ajustes finos na execução podem ocorrer dentro de uma faixa de ±10% por componente RGB para preservar legibilidade do gameplay (player + inimigos sempre visíveis).

**Floresta** (atual "Day", mantido como base de continuidade visual):
```ts
{
  landBase:       [26,  92, 26],
  landEdgeDark:   [15,  74, 15],
  landEdgeBright: [42,  90, 170],
  waterBase:      [26,  58, 138],
  waterFlow:      [42,  85, 170],
  waterWave:      [120, 180, 255, 0.08],
  waterDepth:     [0,   10,  40, 0.15],
  shimmer:        [100, 160, 255, 0.08],
  brightness: 1.0,
}
```

**Deserto** (areia/ocre, água azul-esverdeada mais clara):
```ts
{
  landBase:       [180, 140,  70],
  landEdgeDark:   [130,  95,  40],
  landEdgeBright: [220, 180, 110],
  waterBase:      [40,  120, 130],
  waterFlow:      [70,  150, 160],
  waterWave:      [180, 220, 220, 0.08],
  waterDepth:     [10,   30,  35, 0.15],
  shimmer:        [200, 220, 200, 0.10],
  brightness: 1.1,
}
```

**Industrial** (cinza/concreto, água escura poluída):
```ts
{
  landBase:       [60,   65,  70],
  landEdgeDark:   [35,   38,  42],
  landEdgeBright: [110, 110, 120],
  waterBase:      [30,   40,  45],
  waterFlow:      [50,   60,  70],
  waterWave:      [100, 110, 120, 0.07],
  waterDepth:     [5,     8,  12, 0.20],
  shimmer:        [140, 145, 160, 0.06],
  brightness: 0.85,
}
```

### 5.2 Weights e curvas

| Campo | Floresta | Deserto | Industrial |
|---|---|---|---|
| `enemyWeights.helicopter` | 30 | 20 | 15 |
| `enemyWeights.plane` | 20 | 20 | 15 |
| `enemyWeights.boat` | 20 | 10 | 5 |
| `enemyWeights.gunboat` | 15 | 15 | 20 |
| `enemyWeights.tank` | 10 | 25 | 30 |
| `enemyWeights.bridge` | (controlado por outro sistema) | — | — |
| `enemySpawnRateMult` | 1.0 | 1.0 | 0.85 (mais rápido) |
| `enemyTierBias.basic` | 1.0 | 0.9 | 0.7 |
| `enemyTierBias.smart` | 1.0 | 1.1 | 1.2 |
| `enemyTierBias.elite` | 1.0 | 1.0 | 1.4 |
| `sceneryWeights.palm` | 25 | 5 | 0 |
| `sceneryWeights.tree` | 35 | 0 | 5 |
| `sceneryWeights.house` | 5 | 8 | 50 |
| `sceneryWeights.bush` | 25 | 15 | 10 |
| `sceneryWeights.rock` | 5 | 60 | 25 |
| `sceneryWeights.fueltank` | 5 | 12 | 10 |
| `riverMinWidth` | 100 | 110 | 80 |
| `riverMaxWidthRatio` | 0.72 | 0.78 | 0.60 |

Bridge não entra em `enemyWeights` reweight nesta Fase; permanece controlado pelo timing de spawn de ponte existente.

---

## 6. Máquina de estados do `BiomeSystem`

```
hold (110s)
  ├─ config = currentBiome
  ├─ blend = 0, inTransition = false
  └─ ao terminar → transition

transition (10s)
  ├─ from = currentBiome, to = next(currentBiome)
  ├─ t = elapsed / 10
  ├─ blend = easeInOut(t)
  ├─ config = lerp(from, to, blend)
  ├─ inTransition = true
  └─ ao terminar → currentBiome = to, hold

Loop: forest → desert → industrial → forest → ...
```

**Easing:** `easeInOut(t) = t*t*(3 - 2*t)` (smoothstep). Suficiente para Fase 1.

**Lerp:** todos os campos numéricos (incluindo weights) são interpolação linear no `blend`; paleta usa o `lerpPaletteRaw` já existente em `Atmosphere`.

---

## 7. Mudanças por módulo

### 7.1 `Atmosphere.ts`

Separa paleta-base (vinda do bioma) de modulação dia/noite (responsabilidade exclusiva do Atmosphere).

- `update(dt, basePalette?: PaletteRaw)`: novo parâmetro opcional. Quando ausente, fallback para paleta-base "neutra" (mantém testes existentes compatíveis).
- 4 paletas absolutas atuais (`PALETTES[]`) viram **4 perfis de modulação** (`MODULATIONS[]`):
  - `brightness` (já existe)
  - `tintRGB: RGB` + `tintStrength: number` (novos)
- `getColorPalette()` retorna: `final = applyModulation(basePalette, currentModulation)`, onde `applyModulation` faz `lerp(basePalette × brightness, tintRGB, tintStrength)` componente a componente.
- API pública preservada: `getColorPalette`, `drawClouds`, scanlines, `reset`.

**Perfis de modulação propostos:**

| Fase | brightness | tintRGB | tintStrength |
|---|---|---|---|
| Day | 1.0 | [255,255,255] | 0.0 |
| Sunset | 0.85 | [255,140,80] | 0.18 |
| Night | 0.55 | [60,80,140] | 0.30 |
| Dawn | 0.75 | [200,170,220] | 0.15 |

**Aceito como impacto:** o look exato das paletas atuais (Day/Sunset/Night/Dawn) muda ligeiramente porque agora são derivadas algoritmicamente da Floresta-base. Aceitamos essa variação em troca da composabilidade.

### 7.2 `World.ts`

`MIN_WIDTH` e `MAX_WIDTH_RATIO` viram **defaults**. `update(dt, biomeCfg)`:

- Valores efetivos lidos no início de cada **bank transition** (transição de margens, `World.genPhase = 'transition'`), não no meio dela. Termo "bank transition" para evitar confusão com a transição do bioma.
- `effectiveMinWidth = biomeCfg.riverMinWidth ?? MIN_WIDTH`
- `effectiveMaxWidth = canvasWidth × (biomeCfg.riverMaxWidthRatio ?? MAX_WIDTH_RATIO)`

Sem outras mudanças em geração procedural.

### 7.3 `EnemyManager.ts`

`update(dt, biomeCfg, ...args atuais)`. Duas integrações:

1. **Weight sampling do tipo de inimigo em `spawn()`:**
   - Substitui lógica embutida atual por `weightedPickType(biomeCfg.enemyWeights, spawnRisk, gameTime)`.
   - `spawnRisk` continua reduzindo peso de tipos agressivos em curva (regra existente preservada).
   - `gameTime` continua gatilho de "tipos avançados disponíveis a partir de X" (progressão temporal global preservada).
2. **Curva de dificuldade por bioma:**
   - `spawnInterval` final = `baseInterval × biomeCfg.enemySpawnRateMult`.
   - `resolveAiTier()` multiplica pesos atuais pelo `biomeCfg.enemyTierBias` antes do sorteio.

Determinismo: preservado. `random()` injetado continua sendo a única fonte de aleatoriedade.

### 7.4 `Scenery.ts`

Duas mudanças:

1. **Injetar `RandomSource`** no construtor (alinhado com a decisão de 2026-04-16). `pickType()` usa a fonte injetada em vez de `Math.random()` direto.
2. **`pickType()` usa weights do biomaConfig**:
   - `update(biomeCfg)` recebe weights efetivos.
   - `SCENERY_CONFIGS.weight` viram defaults para chamadas sem bioma (compatibilidade).

Fase 1 reutiliza os 6 tipos atuais (palm, tree, house, bush, rock, fueltank). Identidade vem da reponderação.

### 7.5 `Game.ts`

Construtor instancia `BiomeSystem`. Pipeline de `update` ganha a etapa do bioma antes de Atmosphere/World/Scenery/EnemyManager (Seção 3). `Game.restart()` chama `biomeSystem.reset()`.

---

## 8. Testes

### 8.1 Novo: `src/game/BiomeSystem.test.ts`

Cobertura mínima exigida:

- Estado inicial: `forest`, `inTransition=false`, `blend=0`.
- Após 100s: ainda em hold em `forest`.
- Após 115s: em `transition`, `inTransition=true`, `blend ∈ (0,1)`.
- Após 120s: chegou em `desert`, `inTransition=false`, `blend=0`.
- Após 240s: em `industrial`.
- Após 360s: voltou para `forest` (loop).
- Em transição, paleta interpolada bate com `lerpPaletteRaw(from.basePalette, to.basePalette, blend)`.
- Em transição, `enemyWeights.tank` é lerp linear entre from e to.
- Em transição, `riverMinWidth` é lerp linear entre from e to.
- `reset()` volta para `forest`, timer zerado.
- Acessores: `getCurrentBiomeId()` retorna `from` durante hold e durante transição; `getTimeInBiome()` cresce monotonicamente em hold e zera no início de cada bioma; `getTimeUntilTransition()` decresce em hold e é 0 durante transition.

### 8.2 Atualizações em testes existentes

- `Game.test.ts`: validar que `restart()` reseta bioma; suíte atual continua passando porque bioma inicial (`forest`) é compatível com defaults.
- `EnemyManager.test.ts`: novo helper `makeBiomeConfig(overrides)` para casos específicos; testes existentes recebem um config neutro derivado de Floresta. **Não muda comportamento padrão dos testes existentes.**
- `World.test.ts`: novo caso onde bioma `industrial` reduz `riverMinWidth` e a geração reflete isso após uma bank transition.
- `Atmosphere.test.ts`: validar que `update(dt, basePaletteA)` e `update(dt, basePaletteB)` produzem `getColorPalette()` distintos; validar que sem `basePalette` o fallback é estável.

### 8.3 Cobertura

`BiomeSystem` entra na lista include do `vite.config.ts` (alinhado com `AGENTS.md`: "se um novo core gameplay file deve contar para coverage gates, atualize coverage include"). `Scenery` permanece fora desta vez (dívida explícita registrada).

---

## 9. Determinismo e RNG

- `BiomeSystem`: 100% determinístico (driven por tempo).
- `Scenery`: passa a aceitar `RandomSource` injetado. Compatível com `createSeededRandom` para testes reproduzíveis.
- `EnemyManager`/`World`/`FuelSystem`: já usam `RandomSource` injetado; comportamento preservado.

Resultado: o jogo continua reproduzível com seed; bioma é puramente função de tempo.

---

## 10. Riscos e mitigações

| Risco | Mitigação |
|---|---|
| Refator de Atmosphere muda look atual do jogo | Floresta-base + modulação Day mantida o mais próximo do "Day" atual; aceito pequena variação visual |
| Testes existentes de EnemyManager quebram por mudança de assinatura | Default config neutro mantém comportamento; helper `makeBiomeConfig` |
| Largura do rio muda muito brusco visualmente | Valor efetivo aplicado só no início de nova `transition` de margens (não no meio) |
| Cobertura mínima (55%) violada por novos branches | Testes do `BiomeSystem` cobrem todos os caminhos de hold/transition/loop; Scenery dívida documentada |
| Loop volta a Floresta sem aumentar dificuldade base | Fora do escopo da Fase 1; registrado como follow-up (Seção 11) |
| Inconsistência visual durante transição (margens já em curva quando paleta troca) | Aceito; o fade de 10s mascara visualmente; jogador raramente percebe |
| Refator de Scenery muda RNG (Math.random → injetado) e altera resultado de testes | Default = `Math.random`, comportamento preservado em produção; testes só ganham determinismo se passarem seed |

---

## 11. Fora do escopo desta Fase (follow-up)

- **Fase 2 — Identidade visual:** novos tipos de scenery por bioma (cactos, chaminés, etc.), densidade variável de fuel.
- **Fase 3 — Imersão sonora:** SoundManager com tema/SFX por bioma.
- **Bridge-boss entre zonas:** marco visual de transição.
- **Loop com dificuldade crescente:** após primeiro loop, multiplicadores aumentam.
- **Cobertura do `Scenery`** (incluir no vite.config.ts coverage include).
- **`FuelSystem` integrado** ao contrato `BiomeConfig` (passthrough ou ativo).
- **Ordem aleatória por seed** como opção de settings.
- **Integração com `ObjectiveSystem`:** objetivos zone-aware.

---

## 12. Plano de execução (resumo, detalhar em `/plan`)

1. Criar `BiomeSystem.ts` + tipos `BiomeId`, `BiomeDefinition`, `EffectiveBiomeConfig`.
2. Criar testes do `BiomeSystem`.
3. Refatorar `Atmosphere.ts` (separar paleta-base de modulação). Atualizar `Atmosphere.test.ts`.
4. Refatorar `World.ts` (largura/curvatura por bioma). Atualizar testes.
5. Refatorar `Scenery.ts` (RNG injetado + weights por bioma).
6. Refatorar `EnemyManager.ts` (weights + curva). Atualizar testes com helper.
7. Integrar pipeline em `Game.ts` + reset em `restart()`.
8. Atualizar `vite.config.ts` coverage include com `BiomeSystem`.
9. Rodar `npm run typecheck`, `npm test`, `npm run build`.
10. `/review` e `/review-code`.
11. `/memory-save` registrando decisão.
