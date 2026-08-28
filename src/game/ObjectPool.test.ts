import { describe, it, expect, beforeEach } from 'vitest'
import { ObjectPool } from './ObjectPool'

interface TestItem {
  active: boolean
  value: number
}

describe('ObjectPool', () => {
  let pool: ObjectPool<TestItem>

  beforeEach(() => {
    pool = new ObjectPool<TestItem>(
      3,
      () => ({ active: false, value: 0 }),
      (item) => {
        item.active = true
        item.value = 0
      }
    )
  })

  describe('initialization', () => {
    it('cria itens com tamanho especificado', () => {
      expect(pool.all.length).toBe(3)
    })
  })

  describe('acquire', () => {
    it('retorna item', () => {
      const item = pool.acquire()
      expect(item).toBeDefined()
    })

    it('reseta item ao adquirir', () => {
      const item = pool.acquire()
      item.value = 100

      const item2 = pool.acquire()
      expect(item2.value).toBe(0)
    })

    it('expande pool se cheio', () => {
      pool.acquire()
      pool.acquire()
      pool.acquire()
      pool.acquire()
      expect(pool.all.length).toBe(4)
    })

    it('nao cresce alem do teto (2x o tamanho inicial por padrao)', () => {
      expect(pool.capacity).toBe(6)
      for (let i = 0; i < 20; i++) pool.acquire()
      expect(pool.all.length).toBe(6)
    })

    it('respeita um maxSize explicito', () => {
      const capped = new ObjectPool<TestItem>(
        2,
        () => ({ active: false, value: 0 }),
        (item) => { item.active = true },
        3,
      )
      for (let i = 0; i < 10; i++) capped.acquire()
      expect(capped.capacity).toBe(3)
      expect(capped.all.length).toBe(3)
    })

    it('nunca aceita maxSize abaixo do tamanho inicial', () => {
      const capped = new ObjectPool<TestItem>(
        4,
        () => ({ active: false, value: 0 }),
        (item) => { item.active = true },
        1,
      )
      expect(capped.capacity).toBe(4)
      expect(capped.all.length).toBe(4)
    })

    it('recicla o item vivo mais antigo em round-robin quando saturado', () => {
      const saturated: TestItem[] = []
      for (let i = 0; i < 6; i++) saturated.push(pool.acquire())

      // Pool cheio no teto: os proximos acquire reusam os mais antigos, em ordem.
      expect(pool.acquire()).toBe(saturated[0])
      expect(pool.acquire()).toBe(saturated[1])
      expect(pool.all.length).toBe(6)
    })

    it('aplica resetFn ao item reciclado', () => {
      const live: TestItem[] = []
      for (let i = 0; i < 6; i++) live.push(pool.acquire())
      live[0].value = 99

      const recycled = pool.acquire()

      expect(recycled).toBe(live[0])
      expect(recycled.value).toBe(0)
      expect(recycled.active).toBe(true)
    })
  })

  describe('activeItems', () => {
    it('retorna apenas itens ativos', () => {
      pool.acquire()
      pool.acquire()
      expect(pool.activeItems.length).toBe(2)
    })
  })

  describe('all', () => {
    it('retorna todos os itens', () => {
      pool.acquire()
      expect(pool.all.length).toBe(3)
    })
  })

  describe('resetAll', () => {
    it('desativa todos os itens', () => {
      pool.acquire()
      pool.acquire()
      pool.resetAll()
      expect(pool.activeItems.length).toBe(0)
    })

    it('zera o cursor de reciclagem', () => {
      for (let i = 0; i < 6; i++) pool.acquire()
      pool.acquire() // avanca o cursor para 1
      pool.resetAll()

      const first = pool.acquire()
      expect(first).toBe(pool.all[0])
    })
  })
})