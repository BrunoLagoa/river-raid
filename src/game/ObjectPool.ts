export class ObjectPool<T extends { active: boolean }> {
  private items: T[] = []
  private activeCache: T[] = []
  private factory: () => T
  private resetFn: (item: T) => void

  constructor(size: number, factory: () => T, resetFn: (item: T) => void) {
    this.factory = factory
    this.resetFn = resetFn
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
    const item = this.factory()
    this.resetFn(item)
    this.items.push(item)
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

  resetAll(): void {
    for (const item of this.items) {
      item.active = false
    }
  }
}
