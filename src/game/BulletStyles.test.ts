import { describe, it, expect } from 'vitest'
import { BULLET_STYLES, resolveBulletKind, type BulletKind } from './BulletStyles'

const ALL_KINDS: BulletKind[] = ['normal', 'rapid', 'double', 'overcharge']

describe('resolveBulletKind', () => {
  it('sem power-up de tiro retorna normal', () => {
    expect(resolveBulletKind(0, 0)).toBe('normal')
  })

  it('somente rapid fire retorna rapid', () => {
    expect(resolveBulletKind(0, 3.2)).toBe('rapid')
  })

  it('somente double shot retorna double', () => {
    expect(resolveBulletKind(5.5, 0)).toBe('double')
  })

  it('ambos ativos retorna overcharge', () => {
    expect(resolveBulletKind(5.5, 3.2)).toBe('overcharge')
  })

  it('timer zerado ou negativo nao conta como ativo', () => {
    expect(resolveBulletKind(-0.1, -2)).toBe('normal')
  })
})

describe('BULLET_STYLES', () => {
  it('define um estilo para cada estado', () => {
    for (const kind of ALL_KINDS) {
      expect(BULLET_STYLES[kind]).toBeDefined()
    }
  })

  it('cada estado tem cor de corpo distinta', () => {
    const bodies = ALL_KINDS.map((k) => BULLET_STYLES[k].body)
    expect(new Set(bodies).size).toBe(ALL_KINDS.length)
  })

  // Guard-rail: player fire must never be confused with incoming fire.
  it('nenhuma cor colide com as balas inimigas', () => {
    const enemyBulletColors = ['#ff4444', '#ff8888', '#cc44ff', '#ee88ff']
    for (const kind of ALL_KINDS) {
      expect(enemyBulletColors).not.toContain(BULLET_STYLES[kind].body)
      expect(enemyBulletColors).not.toContain(BULLET_STYLES[kind].core)
    }
  })

  it('cada estado tem silhueta propria (largura ou altura diferente)', () => {
    const shapes = ALL_KINDS.map((k) => `${BULLET_STYLES[k].width}x${BULLET_STYLES[k].height}`)
    expect(new Set(shapes).size).toBe(ALL_KINDS.length)
  })

  it('apenas overcharge pulsa e usa nucleo entalhado', () => {
    expect(BULLET_STYLES.overcharge.pulses).toBe(true)
    expect(BULLET_STYLES.overcharge.notched).toBe(true)
    for (const kind of ['normal', 'rapid', 'double'] as BulletKind[]) {
      expect(BULLET_STYLES[kind].pulses).toBe(false)
      expect(BULLET_STYLES[kind].notched).toBe(false)
    }
  })
})
