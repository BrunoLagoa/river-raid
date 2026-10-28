export class ObjectPool<T extends { active: boolean }> {
  private items: T[] = []
  private activeCache: T[] = []
  /** Position of each active item in `activeCache` for O(1) removal. */
  private activeIndex = new Map<T, number>()
  private factory: () => T
  private resetFn: (item: T) => void
  private readonly maxSize: number
  private recycleCursor = 0

  /**
   * @param size     Entries pre-allocated up front — the steady-state budget.
   * @param maxSize  Hard ceiling on how far the pool may grow under pressure.
   *                 Defaults to twice `size`. Past it, `acquire()` recycles the
   *                 oldest live entry instead of growing: a long fight would
   *                 otherwise leave the pool permanently larger and make every
   *                 `activeItems` scan slower for the rest of the run.
   */
  constructor(size: number, factory: () => T, resetFn: (item: T) => void, maxSize = size * 2) {
    this.factory = factory
    this.resetFn = resetFn
    this.maxSize = Math.max(size, maxSize)
    for (let i = 0; i < size; i++) {
      this.items.push(this.instrument(factory()))
    }
  }

  acquire(): T {
    for (const item of this.items) {
      if (!item.active) {
        this.resetFn(item)
        return item
      }
    }

    if (this.items.length < this.maxSize) {
      const item = this.instrument(this.factory())
      this.resetFn(item)
      this.items.push(item)
      return item
    }

    // Saturated: steal the oldest live entry, round-robin. The caller always
    // gets a usable object, so no call site has to handle a null pool.
    const item = this.items[this.recycleCursor]
    this.recycleCursor = (this.recycleCursor + 1) % this.items.length
    this.resetFn(item)
    return item
  }

  /**
   * The list is maintained by the `active` accessor installed on every pooled
   * object, so this getter is O(1) instead of rescanning the whole pool on
   * every read. Callers assign `item.active = false` directly all over the
   * engine; the accessor is what keeps that pattern cheap and correct.
   */
  get activeItems(): T[] {
    return this.activeCache
  }

  get all(): T[] {
    return this.items
  }

  /** Ceiling this pool may grow to before it starts recycling. */
  get capacity(): number {
    return this.maxSize
  }

  resetAll(): void {
    for (const item of this.items) {
      item.active = false
    }
    this.activeCache.length = 0
    this.activeIndex.clear()
    this.recycleCursor = 0
  }

  private instrument(item: T): T {
    let active = false
    Object.defineProperty(item, 'active', {
      configurable: true,
      enumerable: true,
      get: () => active,
      set: (next: boolean) => {
        const value = !!next
        if (value === active) return
        active = value
        if (value) this.activate(item)
        else this.deactivate(item)
      },
    })
    return item
  }

  private activate(item: T): void {
    this.activeIndex.set(item, this.activeCache.length)
    this.activeCache.push(item)
  }

  private deactivate(item: T): void {
    const index = this.activeIndex.get(item)
    if (index === undefined) return

    const last = this.activeCache.length - 1
    if (index !== last) {
      const moved = this.activeCache[last]
      this.activeCache[index] = moved
      this.activeIndex.set(moved, index)
    }
    this.activeCache.pop()
    this.activeIndex.delete(item)
  }
}
