import { describe, it, expect, beforeEach } from 'vitest'
import { SpatialGrid } from './SpatialGrid'

describe('SpatialGrid', () => {
  let grid: SpatialGrid

  beforeEach(() => {
    grid = new SpatialGrid(64)
  })

  describe('insert', () => {
    it('insere rect na grid', () => {
      grid.insert(0, { x: 100, y: 100, width: 10, height: 10 })
      const results: number[] = []
      grid.query({ x: 100, y: 100, width: 10, height: 10 }, results)
      expect(results).toContain(0)
    })

    it('insere multiplos itens', () => {
      grid.insert(0, { x: 100, y: 100, width: 10, height: 10 })
      grid.insert(1, { x: 200, y: 200, width: 10, height: 10 })
      const results: number[] = []
      grid.query({ x: 100, y: 100, width: 10, height: 10 }, results)
      expect(results.length).toBe(1)
    })
  })

  describe('query', () => {
    it('retorna resultados vazio para area sem itens', () => {
      const results: number[] = []
      grid.query({ x: 1000, y: 1000, width: 10, height: 10 }, results)
      expect(results.length).toBe(0)
    })

    it('retorna itens na regiao', () => {
      grid.insert(0, { x: 100, y: 100, width: 50, height: 50 })
      const results: number[] = []
      grid.query({ x: 110, y: 110, width: 10, height: 10 }, results)
      expect(results).toContain(0)
    })

    it('nao retorna duplicatas', () => {
      grid.insert(0, { x: 100, y: 100, width: 100, height: 100 })
      const results: number[] = []
      grid.query({ x: 100, y: 100, width: 10, height: 10 }, results)
      expect(results.filter((i) => i === 0).length).toBe(1)
    })
  })

  describe('clear', () => {
    it('limpa todos os dados', () => {
      grid.insert(0, { x: 100, y: 100, width: 10, height: 10 })
      grid.clear()
      const results: number[] = []
      grid.query({ x: 100, y: 100, width: 10, height: 10 }, results)
      expect(results.length).toBe(0)
    })
  })

  describe('multiple queries', () => {
    it('distingue queries diferentes', () => {
      grid.insert(0, { x: 100, y: 100, width: 10, height: 10 })
      
      const results1: number[] = []
      grid.query({ x: 100, y: 100, width: 10, height: 10 }, results1)
      
      const results2: number[] = []
      grid.query({ x: 500, y: 500, width: 10, height: 10 }, results2)
      
      expect(results1.length).toBe(1)
      expect(results2.length).toBe(0)
    })
  })
})