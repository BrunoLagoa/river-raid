import { describe, it, expect } from 'vitest'
import { getGameModeConfig, getAllGameModes, GAME_MODES } from './GameMode'

describe('GameMode', () => {
  it('retorna configuracoes validas para todos os modos', () => {
    const modes = getAllGameModes()
    expect(modes.length).toBe(5)

    const classic = getGameModeConfig('classic')
    expect(classic.initialLives).toBe(3)
    expect(classic.fuelDrainMultiplier).toBe(1.0)
    expect(classic.minimapEnabled).toBe(true)

    const hardcore = getGameModeConfig('hardcore')
    expect(hardcore.initialLives).toBe(1)
    expect(hardcore.fuelDrainMultiplier).toBeGreaterThan(1.0)
    expect(hardcore.minimapEnabled).toBe(false)

    const bossRush = getGameModeConfig('boss_rush')
    expect(bossRush.firstBossSpawnTime).toBeLessThan(classic.firstBossSpawnTime)

    const zen = getGameModeConfig('zen')
    expect(zen.infiniteLives).toBe(true)
    expect(zen.infiniteFuel).toBe(true)
    expect(zen.fuelDrainMultiplier).toBe(0)
  })

  it('fallback para classic se modo for desconhecido', () => {
    // @ts-expect-error teste de fallback com valor invalido
    const config = getGameModeConfig('unknown_mode')
    expect(config).toEqual(GAME_MODES.classic)
  })
})
