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
  })
})