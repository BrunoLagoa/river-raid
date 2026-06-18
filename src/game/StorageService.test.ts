import { describe, it, expect, beforeEach } from 'vitest'
import {
  readSecureJSON,
  writeSecureJSON,
  readSecureNumber,
  writeSecureNumber,
} from './StorageService'

beforeEach(() => {
  localStorage.clear()
})

describe('StorageService', () => {
  it('faz round-trip de objetos JSON', () => {
    writeSecureJSON('k', { a: 1, b: 'x', c: [1, 2, 3] })
    expect(readSecureJSON('k', null)).toEqual({ a: 1, b: 'x', c: [1, 2, 3] })
  })

  it('retorna fallback quando a chave não existe', () => {
    expect(readSecureJSON('missing', { fallback: true })).toEqual({ fallback: true })
  })

  it('retorna fallback e limpa quando o envelope é adulterado', () => {
    writeSecureJSON('k', { secret: 42 })
    const raw = JSON.parse(localStorage.getItem('k')!)
    raw.d = raw.d + 'tampered'
    localStorage.setItem('k', JSON.stringify(raw))

    expect(readSecureJSON('k', 'fallback')).toBe('fallback')
    expect(localStorage.getItem('k')).toBeNull()
  })

  it('retorna fallback quando o conteúdo não é um envelope válido', () => {
    localStorage.setItem('k', JSON.stringify({ not: 'an envelope' }))
    expect(readSecureJSON('k', 0)).toBe(0)
  })

  it('readSecureNumber valida tipo e finitude', () => {
    writeSecureNumber('n', 1234)
    expect(readSecureNumber('n', 0)).toBe(1234)

    writeSecureJSON('bad', 'not a number')
    expect(readSecureNumber('bad', 7)).toBe(7)
  })

  it('writeSecureNumber normaliza valores não finitos para 0', () => {
    writeSecureNumber('inf', Number.POSITIVE_INFINITY)
    expect(readSecureNumber('inf', -1)).toBe(0)
  })

  it('a chave faz parte do checksum (envelope de outra chave é rejeitado)', () => {
    writeSecureJSON('keyA', { v: 1 })
    const envelope = localStorage.getItem('keyA')!
    localStorage.setItem('keyB', envelope)
    expect(readSecureJSON('keyB', 'fallback')).toBe('fallback')
  })
})
