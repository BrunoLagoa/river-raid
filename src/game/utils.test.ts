import { describe, it, expect } from 'vitest'
import { compactArray } from './utils'

describe('compactArray', () => {
  it('should remove elements for which predicate returns true (simulate in-place filter)', () => {
    const arr = [1, 2, 3, 4, 5]
    
    // Predicate: remove element if it is even
    compactArray(arr, (n) => n % 2 !== 0)
    
    expect(arr).toEqual([1, 3, 5])
  })

  it('should empty array if all elements match predicate', () => {
    const arr = [2, 4, 6]
    compactArray(arr, () => false)
    expect(arr).toEqual([])
  })

  it('should keep all elements if none match predicate', () => {
    const arr = [1, 3, 5]
    compactArray(arr, () => true)
    expect(arr).toEqual([1, 3, 5])
  })
})
