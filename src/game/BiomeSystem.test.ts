import { describe, it, expect, beforeEach } from 'vitest'
import { BiomeSystem, BIOME_DURATION, BIOME_FADE_DURATION } from './BiomeSystem'

const HOLD = BIOME_DURATION - BIOME_FADE_DURATION   // 110 s

describe('BiomeSystem', () => {
  let sys: BiomeSystem

  beforeEach(() => {
    sys = new BiomeSystem()
  })

  // ── Initial state ───────────────────────────────────────────────────────────

  it('starts in forest, not in transition', () => {
    const cfg = sys.getConfig()
    expect(sys.getCurrentBiomeId()).toBe('forest')
    expect(cfg.fromBiomeId).toBe('forest')
    expect(cfg.toBiomeId).toBe('forest')
    expect(cfg.inTransition).toBe(false)
    expect(cfg.blend).toBe(0)
  })

  it('starts with forest palette (water is blue)', () => {
    const { basePalette } = sys.getConfig()
    // Forest water: [26, 58, 138] — blue
    expect(basePalette.waterBase[2]).toBeGreaterThan(basePalette.waterBase[0])
  })

  // ── Accessors ───────────────────────────────────────────────────────────────

  it('getTimeInBiome grows during hold', () => {
    sys.update(10)
    expect(sys.getTimeInBiome()).toBeCloseTo(10, 1)
  })

  it('getTimeUntilTransition decreases during hold', () => {
    sys.update(10)
    expect(sys.getTimeUntilTransition()).toBeCloseTo(HOLD - 10, 1)
  })

  it('getTimeInBiome is 0 during transition', () => {
    sys.update(HOLD + 1)   // enter transition
    expect(sys.getConfig().inTransition).toBe(true)
    expect(sys.getTimeInBiome()).toBe(0)
  })

  it('getTimeUntilTransition is 0 during transition', () => {
    sys.update(HOLD + 1)
    expect(sys.getTimeUntilTransition()).toBe(0)
  })

  // ── Hold phase ──────────────────────────────────────────────────────────────

  it('stays in forest during the hold phase', () => {
    sys.update(HOLD - 10)
    expect(sys.getCurrentBiomeId()).toBe('forest')
    expect(sys.getConfig().inTransition).toBe(false)
  })

  // ── Transition: forest → desert ─────────────────────────────────────────────

  it('enters transition after HOLD_DURATION seconds', () => {
    sys.update(HOLD + 0.1)
    expect(sys.getConfig().inTransition).toBe(true)
    expect(sys.getConfig().fromBiomeId).toBe('forest')
    expect(sys.getConfig().toBiomeId).toBe('desert')
  })

  it('blend is between 0 and 1 during transition', () => {
    sys.update(HOLD + BIOME_FADE_DURATION / 2)
    const { blend, inTransition } = sys.getConfig()
    expect(inTransition).toBe(true)
    expect(blend).toBeGreaterThan(0)
    expect(blend).toBeLessThan(1)
  })

  it('basePalette interpolates between forest (blue) and desert (sandy) during transition', () => {
    // At mid-transition the water should be neither pure forest nor pure desert
    const forestWaterBlue = 138   // forest waterBase[2]
    const desertWaterBlue = 130   // desert waterBase[2]

    sys.update(HOLD + BIOME_FADE_DURATION / 2)
    const { basePalette } = sys.getConfig()
    expect(basePalette.waterBase[2]).toBeLessThanOrEqual(forestWaterBlue)
    expect(basePalette.waterBase[2]).toBeGreaterThanOrEqual(desertWaterBlue)
  })

  it('enemyWeights.tank interpolates upward during forest→desert transition', () => {
    const forestTank = 10   // forest tank weight
    const desertTank = 25   // desert tank weight

    sys.update(HOLD + BIOME_FADE_DURATION / 2)
    const { enemyWeights } = sys.getConfig()
    expect(enemyWeights.tank).toBeGreaterThan(forestTank)
    expect(enemyWeights.tank).toBeLessThan(desertTank)
  })

  it('riverMinWidth interpolates during transition', () => {
    sys.update(HOLD + BIOME_FADE_DURATION / 2)
    const { riverMinWidth } = sys.getConfig()
    expect(riverMinWidth).toBeGreaterThan(100)   // forest = 100
    expect(riverMinWidth).toBeLessThan(110)       // desert = 110
  })

  // ── Arrival at desert ───────────────────────────────────────────────────────

  it('arrives at desert after one biome cycle', () => {
    sys.update(BIOME_DURATION)
    expect(sys.getCurrentBiomeId()).toBe('desert')
    const cfg = sys.getConfig()
    expect(cfg.inTransition).toBe(false)
    expect(cfg.blend).toBe(0)
    expect(cfg.fromBiomeId).toBe('desert')
  })

  it('desert palette has sandy land (high red+green, lower blue)', () => {
    sys.update(BIOME_DURATION)
    const { basePalette } = sys.getConfig()
    // Desert landBase: [180, 140, 70] — red > green > blue
    expect(basePalette.landBase[0]).toBeGreaterThan(basePalette.landBase[2])
  })

  // ── Second cycle: desert → industrial ───────────────────────────────────────

  it('arrives at industrial after 240 s + fade', () => {
    sys.update(BIOME_DURATION * 2 + BIOME_FADE_DURATION)
    expect(sys.getCurrentBiomeId()).toBe('industrial')
    expect(sys.getConfig().inTransition).toBe(false)
  })

  it('industrial has higher enemyTierBias.elite than forest', () => {
    sys.update(BIOME_DURATION * 2 + BIOME_FADE_DURATION)
    const industrial = sys.getConfig().enemyTierBias.elite

    sys.reset()
    const forest = sys.getConfig().enemyTierBias.elite

    expect(industrial).toBeGreaterThan(forest)
  })

  // ── Third cycle: industrial → snow ──────────────────────────────────────────

  it('arrives at snow after 3 full cycles', () => {
    sys.update(BIOME_DURATION * 3 + BIOME_FADE_DURATION)
    expect(sys.getCurrentBiomeId()).toBe('snow')
    expect(sys.getConfig().inTransition).toBe(false)
  })

  // ── Loop: snow → forest ─────────────────────────────────────────────────────

  it('loops back to forest after 4 full cycles', () => {
    sys.update(BIOME_DURATION * 4 + BIOME_FADE_DURATION)
    expect(sys.getCurrentBiomeId()).toBe('forest')
    expect(sys.getConfig().inTransition).toBe(false)
  })

  // ── reset() ─────────────────────────────────────────────────────────────────

  it('reset() returns to initial state', () => {
    sys.update(BIOME_DURATION * 2 + 50)    // mid-industrial
    sys.reset()

    expect(sys.getCurrentBiomeId()).toBe('forest')
    expect(sys.getConfig().inTransition).toBe(false)
    expect(sys.getConfig().blend).toBe(0)
    expect(sys.getTimeInBiome()).toBeCloseTo(0, 1)
    expect(sys.getTimeUntilTransition()).toBeCloseTo(HOLD, 1)
  })

  // ── Incremental updates are equivalent to single bulk update ────────────────

  it('incremental updates match bulk update', () => {
    const bulk = new BiomeSystem()
    bulk.update(HOLD + 5)

    const incremental = new BiomeSystem()
    const steps = Math.round((HOLD + 5) / 0.1)   // match bulk's HOLD + 5 seconds
    for (let i = 0; i < steps; i++) {
      incremental.update(0.1)
    }

    const b = bulk.getConfig()
    const inc = incremental.getConfig()
    expect(b.inTransition).toBe(inc.inTransition)
    expect(b.fromBiomeId).toBe(inc.fromBiomeId)
    expect(b.blend).toBeCloseTo(inc.blend, 1)
  })

  // ── Edge: dt = 0 or negative ─────────────────────────────────────────────────

  it('ignores dt = 0', () => {
    sys.update(50)
    const before = sys.getTimeInBiome()
    sys.update(0)
    expect(sys.getTimeInBiome()).toBeCloseTo(before, 5)
  })

  it('ignores negative dt', () => {
    sys.update(50)
    const before = sys.getTimeInBiome()
    sys.update(-10)
    expect(sys.getTimeInBiome()).toBeCloseTo(before, 5)
  })

  it('refreshes hold config when dt stays within hold phase', () => {
    // dt < HOLD_DURATION: remaining=0, phase stays hold -> hits the else-if branch
    sys.update(HOLD - 10)
    expect(sys.getCurrentBiomeId()).toBe('forest')
    expect(sys.getConfig().inTransition).toBe(false)
  })
})
