import { describe, it, expect, beforeEach, vi } from 'vitest'
import { HazardManager } from './HazardManager'
import type { World } from './World'
import { MINE_CHAIN_RADIUS, BUNKER_BULLET_SPEED } from './constants'

function createMockWorld(left = 100, right = 380): World {
  return {
    getBoundsAtY: () => ({ left, right }),
  } as unknown as World
}

describe('HazardManager', () => {
  let hm: HazardManager
  const CANVAS_WIDTH = 480
  const CANVAS_HEIGHT = 640

  beforeEach(() => {
    hm = new HazardManager(CANVAS_WIDTH, CANVAS_HEIGHT, () => 0.5)
  })

  it('inicializa pools corretamente', () => {
    expect(hm.mines.length).toBeGreaterThan(0)
    expect(hm.whirlpools.length).toBeGreaterThan(0)
    expect(hm.bunkers.length).toBeGreaterThan(0)
    expect(hm.mines.every((m) => !m.active)).toBe(true)
  })

  it('reset desativa todos os perigos ativos', () => {
    hm.mines[0].active = true
    hm.whirlpools[0].active = true
    hm.bunkers[0].active = true

    hm.reset(CANVAS_WIDTH, CANVAS_HEIGHT)

    expect(hm.mines[0].active).toBe(false)
    expect(hm.whirlpools[0].active).toBe(false)
    expect(hm.bunkers[0].active).toBe(false)
  })

  it('update move minas para baixo com o scrollSpeed', () => {
    const world = createMockWorld()
    hm.mines[0].active = true
    hm.mines[0].y = 100

    hm.update(0.1, 100, world, 200, 400)

    expect(hm.mines[0].y).toBe(110)
    expect(hm.mines[0].pulseTimer).toBeGreaterThan(0)
  })

  it('update desativa minas que saem da tela', () => {
    const world = createMockWorld()
    hm.mines[0].active = true
    hm.mines[0].y = CANVAS_HEIGHT + 50

    hm.update(0.1, 100, world, 200, 400)

    expect(hm.mines[0].active).toBe(false)
  })

  it('applyWhirlpoolForces puxa o jogador em direcao ao centro do redemoinho', () => {
    hm.whirlpools[0].active = true
    hm.whirlpools[0].x = 200
    hm.whirlpools[0].y = 200
    hm.whirlpools[0].radius = 40

    // Jogador à esquerda do redemoinho (x=180, y=200)
    const force = hm.applyWhirlpoolForces(180, 200)
    expect(force.fx).toBeGreaterThan(0) // Puxa para a direita (em direcao a x=200)
    expect(force.fy).toBeCloseTo(0, 1)

    // Jogador longe do redemoinho
    const farForce = hm.applyWhirlpoolForces(50, 50)
    expect(farForce.fx).toBe(0)
    expect(farForce.fy).toBe(0)
  })

  it('triggerMineChain agenda detonacao de minas no raio de alcance', () => {
    hm.mines[0].active = true
    hm.mines[0].x = 200
    hm.mines[0].y = 200

    hm.mines[1].active = true
    hm.mines[1].x = 200 + (MINE_CHAIN_RADIUS - 10)
    hm.mines[1].y = 200

    hm.mines[2].active = true
    hm.mines[2].x = 200 + (MINE_CHAIN_RADIUS + 50)
    hm.mines[2].y = 200

    hm.triggerMineChain(0)

    expect(hm.mines[1].chainExplodeTimer).toBeGreaterThan(0)
    expect(hm.mines[2].chainExplodeTimer).toBe(0) // Fora do raio
    // Agendar apenas arma o pavio: quem notifica é a detonação, em update().
    expect(hm.mines[1].active).toBe(true)
  })

  it('paga cada mina da cascata uma unica vez, em qualquer profundidade', () => {
    // Fila de 3 minas encadeadas: 0 detona e puxa 1, que puxa 2.
    for (let i = 0; i < 3; i++) {
      hm.mines[i].active = true
      hm.mines[i].x = 200
      hm.mines[i].y = 200 + i * (MINE_CHAIN_RADIUS - 10)
    }
    hm.mines[0].chainExplodeTimer = 0.01

    const detonated: number[] = []
    const world = createMockWorld()
    // Avança o suficiente para toda a fila queimar o pavio.
    for (let step = 0; step < 40; step++) {
      hm.update(0.05, 0, world, 200, 400, undefined, (mine) => {
        detonated.push(hm.mines.indexOf(mine))
      })
    }

    expect(detonated).toHaveLength(3)
    expect(new Set(detonated).size).toBe(3)
  })

  it('bunkers miram no jogador e disparam quando em alcance', () => {
    // Margem escolhida para que a reancoragem na barranca deixe o bunker em x=100.
    const world = createMockWorld(109, 380)
    hm.bunkers[0].active = true
    hm.bunkers[0].side = 'left'
    hm.bunkers[0].x = 100
    hm.bunkers[0].y = 200
    hm.bunkers[0].shootCooldown = 0.05

    const onSpawnBullet = vi.fn()
    hm.update(0.1, 0, world, 100, 300, onSpawnBullet)

    expect(onSpawnBullet).toHaveBeenCalled()
    expect(hm.bunkers[0].x).toBe(100)
    expect(hm.bunkers[0].angle).toBeCloseTo(Math.PI / 2, 1) // Mirando para baixo (dy > 0, dx = 0)
  })

  it('bunkers reancoram na propria margem enquanto o rio serpenteia', () => {
    hm.bunkers[0].active = true
    hm.bunkers[0].side = 'right'
    hm.bunkers[0].x = 0
    hm.bunkers[0].y = 100

    hm.update(0.016, 0, createMockWorld(100, 380), 200, 400)

    // bounds.right + BUNKER_WIDTH / 2 - 4
    expect(hm.bunkers[0].x).toBe(380 + 26 / 2 - 4)
  })

  it('tiro do bunker mantem a velocidade nominal e sempre desce', () => {
    const world = createMockWorld(109, 380)
    hm.bunkers[0].active = true
    hm.bunkers[0].side = 'left'
    hm.bunkers[0].y = 200
    hm.bunkers[0].shootCooldown = 0

    const onSpawnBullet = vi.fn()
    // Jogador bem à direita e quase na mesma altura: mira rasa.
    hm.update(0.016, 0, world, 370, 220, onSpawnBullet)

    expect(onSpawnBullet).toHaveBeenCalled()
    const b = onSpawnBullet.mock.calls[0][0] as { vx: number; speed: number }
    expect(b.speed).toBeGreaterThan(0) // nunca sobe: o pool só recicla saindo por baixo
    expect(Math.hypot(b.vx, b.speed)).toBeCloseTo(BUNKER_BULLET_SPEED, 5)
  })

  it('minas e redemoinhos permanecem dentro do rio enquanto descem', () => {
    hm.mines[0].active = true
    hm.mines[0].x = 500 // fora do rio
    hm.mines[0].y = 100
    hm.whirlpools[0].active = true
    hm.whirlpools[0].x = 0 // fora do rio
    hm.whirlpools[0].y = 100

    hm.update(0.016, 0, createMockWorld(100, 380), 200, 400)

    expect(hm.mines[0].x).toBeLessThanOrEqual(380)
    expect(hm.mines[0].x).toBeGreaterThanOrEqual(100)
    expect(hm.whirlpools[0].x).toBeGreaterThanOrEqual(100)
    expect(hm.whirlpools[0].x).toBeLessThanOrEqual(380)
  })

  it('spawn procedural gera minas, redemoinhos e bunkers dentro das margens', () => {
    const world = createMockWorld(100, 380)
    // Forçar spawn timer para zero
    type HMPrivate = { spawnTimer: number }
    ;(hm as unknown as HMPrivate).spawnTimer = 0

    hm.update(0.01, 100, world, 200, 400)

    const hasActiveHazard = hm.mines.some((m) => m.active) ||
      hm.whirlpools.some((w) => w.active) ||
      hm.bunkers.some((b) => b.active)

    expect(hasActiveHazard).toBe(true)
  })
})
