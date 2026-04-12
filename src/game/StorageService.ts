interface SecureEnvelope {
  v: number
  d: string
  c: string
}

const STORAGE_VERSION = 1
const SALT = 'river-raid-local-v1'

function fnv1a(input: string): string {
  let hash = 0x811c9dc5
  for (let i = 0; i < input.length; i++) {
    hash ^= input.charCodeAt(i)
    hash = Math.imul(hash, 0x01000193)
  }
  return (hash >>> 0).toString(16).padStart(8, '0')
}

function toBase64(bytes: Uint8Array): string {
  let binary = ''
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i])
  }
  return btoa(binary)
}

function fromBase64(base64: string): Uint8Array | null {
  try {
    const binary = atob(base64)
    const out = new Uint8Array(binary.length)
    for (let i = 0; i < binary.length; i++) {
      out[i] = binary.charCodeAt(i)
    }
    return out
  } catch {
    return null
  }
}

function obfuscate(value: string, key: string): string {
  const src = new TextEncoder().encode(value)
  const k = new TextEncoder().encode(`${SALT}:${key}`)
  const out = new Uint8Array(src.length)
  for (let i = 0; i < src.length; i++) {
    out[i] = src[i] ^ k[i % k.length]
  }
  return toBase64(out)
}

function deobfuscate(value: string, key: string): string | null {
  const src = fromBase64(value)
  if (!src) return null
  const k = new TextEncoder().encode(`${SALT}:${key}`)
  const out = new Uint8Array(src.length)
  for (let i = 0; i < src.length; i++) {
    out[i] = src[i] ^ k[i % k.length]
  }
  try {
    return new TextDecoder().decode(out)
  } catch {
    return null
  }
}

function envelopeChecksum(key: string, obfuscatedData: string): string {
  return fnv1a(`${SALT}|${key}|${STORAGE_VERSION}|${obfuscatedData}`)
}

function isEnvelope(value: unknown): value is SecureEnvelope {
  return (
    typeof value === 'object' &&
    value !== null &&
    'v' in value &&
    'd' in value &&
    'c' in value
  )
}

function readEnvelope(key: string): SecureEnvelope | null {
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return null

    const parsed: unknown = JSON.parse(raw)
    if (!isEnvelope(parsed)) {
      localStorage.removeItem(key)
      return null
    }

    if (parsed.v !== STORAGE_VERSION || typeof parsed.d !== 'string' || typeof parsed.c !== 'string') {
      localStorage.removeItem(key)
      return null
    }

    const expected = envelopeChecksum(key, parsed.d)
    if (parsed.c !== expected) {
      localStorage.removeItem(key)
      return null
    }

    return parsed
  } catch {
    try {
      localStorage.removeItem(key)
    } catch {
      // ignore
    }
    return null
  }
}

export function readSecureJSON<T>(key: string, fallback: T): T {
  const envelope = readEnvelope(key)
  if (!envelope) return fallback

  const decoded = deobfuscate(envelope.d, key)
  if (!decoded) {
    try {
      localStorage.removeItem(key)
    } catch {
      // ignore
    }
    return fallback
  }

  try {
    return JSON.parse(decoded) as T
  } catch {
    try {
      localStorage.removeItem(key)
    } catch {
      // ignore
    }
    return fallback
  }
}

export function writeSecureJSON<T>(key: string, data: T): void {
  try {
    const payload = JSON.stringify(data)
    const obfuscated = obfuscate(payload, key)
    const envelope: SecureEnvelope = {
      v: STORAGE_VERSION,
      d: obfuscated,
      c: envelopeChecksum(key, obfuscated),
    }
    localStorage.setItem(key, JSON.stringify(envelope))
  } catch {
    // ignore
  }
}

export function readSecureNumber(key: string, fallback = 0): number {
  const value = readSecureJSON<number | null>(key, null)
  if (typeof value !== 'number' || !Number.isFinite(value)) return fallback
  return value
}

export function writeSecureNumber(key: string, value: number): void {
  writeSecureJSON<number>(key, Number.isFinite(value) ? value : 0)
}
