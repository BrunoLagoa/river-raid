export class ObjectPool<T extends { active: boolean }> {
  private items: T[] = []
  private activeCache: T[] = []
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
      this.items.push(factory())
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
      const item = this.factory()
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

  get activeItems(): T[] {
    this.activeCache.length = 0
    for (const item of this.items) {
      if (item.active) this.activeCache.push(item)
    }
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
    this.recycleCursor = 0
  }
}
