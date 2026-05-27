# Design: Novos Power-ups — rapid_fire, bomb, magnet_fuel

**Data:** 2026-05-27  
**Escopo:** `PowerUpSystem`, `Player`, `CollisionSystem`, `Game`, `Fx`, `UI`, `constants`  
**Abordagem:** Opção A — mínima invasão, seguindo padrão existente

---

## Resumo

Adicionar 3 novos power-ups ao `PowerUpSystem` do River Raid:

| Power-up | Letra | Efeito |
|---|---|---|
| `rapid_fire` | `R` | Reduz cooldown de tiro para 40% por 8s |
| `bomb` | `B` | Destroi todos os inimigos na tela instantaneamente com onda de choque |
| `magnet_fuel` | `M` | Atrai tanques de combustível em direção ao jogador por 8s |

---

## 1. Tipos e dados

### `PowerUpSystem.ts`

Expandir `PowerUpType`:

```ts
export type PowerUpType =
  | 'double_shot'
  | 'shield'
  | 'slow_motion'
  | 'rapid_fire'
  | 'bomb'
  | 'magnet_fuel'
```

O array `types` em `trySpawnAt` passa a incluir os 3 novos tipos (chance uniforme entre os 6).

### `Player.ts`

Adicionar dois timers (mesmo padrão de `doubleShotTimer`):

```ts
rapidFireTimer = 0     // segundos restantes de rapid_fire
magnetFuelTimer = 0    // segundos restantes de magnet_fuel
```

Decrementar ambos em `Player.update` junto com `doubleShotTimer`.  
Resetar ambos em `reset()` e `respawn()`.

### `constants.ts`

```ts
export const POWERUP_RAPID_FIRE_DURATION = 8.0
export const POWERUP_RAPID_FIRE_COOLDOWN_MULTIPLIER = 0.4
export const POWERUP_MAGNET_FUEL_DURATION = 8.0
export const POWERUP_MAGNET_FUEL_SPEED = 180          // px/s
export const POWERUP_BOMB_SHOCKWAVE_DURATION = 0.35   // segundos
```

---

## 2. Efeitos e aplicação

### `rapid_fire`

**Coleta** (`CollisionSystem.checkPlayerVsPowerUps`):
```ts
if (p.type === 'rapid_fire') player.rapidFireTimer = POWERUP_RAPID_FIRE_DURATION
```

**Disparo** (`Player.ts` — método de shoot):
- Cooldown efetivo = `PLAYER_SHOOT_COOLDOWN * (rapidFireTimer > 0 ? POWERUP_RAPID_FIRE_COOLDOWN_MULTIPLIER : 1.0)`
- Resultado: ~2.5x mais tiros por segundo durante o efeito

### `bomb`

**Coleta** (`CollisionSystem.checkPlayerVsPowerUps`):
1. Iterar todos os inimigos ativos em `ctx.enemyManager.enemies`
2. Para cada inimigo ativo: marcar como destruído, chamar `ctx.fx.spawnExplosion(enemy.x, enemy.y)`
3. Adicionar screen shake proporcional ao número de inimigos destruídos
4. Ativar onda de choque: `ctx.fx.triggerShockwave(player.x, player.y)`

**Sem timer no Player** — efeito instantâneo.

### `magnet_fuel`

**Coleta** (`CollisionSystem.checkPlayerVsPowerUps`):
```ts
if (p.type === 'magnet_fuel') player.magnetFuelTimer = POWERUP_MAGNET_FUEL_DURATION
```

**Atração** (`Game.update` — após `fuelSystem.update`):
```ts
if (player.magnetFuelTimer > 0) {
  for (const tank of fuelSystem.tanks) {
    if (!tank.active) continue
    const dx = player.x - tank.x
    const dy = player.y - tank.y
    const dist = Math.hypot(dx, dy)
    if (dist > 1) {
      tank.x += (dx / dist) * POWERUP_MAGNET_FUEL_SPEED * dt
      tank.y += (dy / dist) * POWERUP_MAGNET_FUEL_SPEED * dt
    }
  }
}
```

---

## 3. Onda de choque do `bomb`

### `Fx.ts`

Adicionar estado interno:
```ts
private shockwaveTimer = 0
private shockwaveOrigin = { x: 0, y: 0 }
```

Método público:
```ts
triggerShockwave(x: number, y: number): void {
  this.shockwaveTimer = POWERUP_BOMB_SHOCKWAVE_DURATION
  this.shockwaveOrigin = { x, y }
}
```

Atualizar em `Fx.update(dt)`:
```ts
if (this.shockwaveTimer > 0) this.shockwaveTimer -= dt
```

### `Game.render`

Renderizar onda antes dos inimigos:
- Círculo expansivo centrado em `shockwaveOrigin`
- Raio: `(1 - timer/DURATION) * 400` px
- Stroke branco, `lineWidth = 3`, `globalAlpha = timer / DURATION`

---

## 4. Visual — render no canvas

Adicionar ao `PowerUpSystem.render` (mesmo padrão dos existentes):

| Power-up | Letra | `fillStyle` | `strokeStyle` |
|---|---|---|---|
| `rapid_fire` | `R` | `#ff8800` | `#ffddaa` |
| `bomb` | `B` | `#cc2200` | `#ff9977` |
| `magnet_fuel` | `M` | `#00cc88` | `#aaffdd` |

---

## 5. HUD — indicadores de power-up ativo

`UI.ts` já exibe barras de timer para `double_shot` e `slow_motion`.  
Adicionar barras para `rapid_fire` e `magnet_fuel` com o mesmo padrão.  
`bomb` não exibe barra (efeito instantâneo, sem timer).

---

## 6. Testes

Adicionar testes em `PowerUpSystem.test.ts`:
- `trySpawnAt` pode gerar os 3 novos tipos
- `rapid_fire`: cooldown reduzido quando timer > 0; cooldown normal quando timer = 0
- `magnet_fuel`: tanques se movem em direção ao jogador quando timer ativo
- `bomb`: todos os inimigos destruídos ao coletar; shockwave ativado

Seguir padrão existente com `RandomSource` injetável para testes deterministas.

---

## 7. Arquivos modificados

| Arquivo | Mudança |
|---|---|
| `src/game/constants.ts` | +5 constantes |
| `src/game/PowerUpSystem.ts` | +3 tipos, +3 cores/letras em render |
| `src/game/Player.ts` | +2 timers, decremento em update, reset |
| `src/game/CollisionSystem.ts` | +3 casos em `checkPlayerVsPowerUps` |
| `src/game/Game.ts` | +lógica de atração do magnet em update, +render da shockwave |
| `src/game/Fx.ts` | +`triggerShockwave`, +`shockwaveTimer`, +render |
| `src/game/UI.ts` | +2 barras de HUD |
| `src/game/PowerUpSystem.test.ts` | +testes dos 3 novos power-ups |

---

## Fora do escopo

- Novos sons para os power-ups (pode ser adicionado em iteração futura)
- Conquistas específicas para os novos power-ups
- Animações de partícula específicas para `magnet_fuel` (ex: trilha de atração)
