import type { Rect } from './geometry'

export class SpatialGrid {
  private readonly cellSize: number
  private readonly buckets = new Map<number, number[]>()
  private readonly marks = new Map<number, number>()
  private queryStamp = 0

  constructor(cellSize = 64) {
    this.cellSize = cellSize
  }

  // Pack two signed cell coords into one integer key — avoids the per-insert
  // string allocation of a `${gx},${gy}` key. Unique for |coord| < 32768 cells,
  // far beyond any realistic canvas; collisions would only cost an extra AABB
  // recheck, never a missed hit.
  private static key(gx: number, gy: number): number {
    return ((gx & 0xffff) << 16) | (gy & 0xffff)
  }

  clear(): void {
    // Reuse the bucket arrays instead of dropping the Map every frame: clearing
    // them in place avoids a burst of array allocations during GC pressure.
    for (const bucket of this.buckets.values()) bucket.length = 0
    this.marks.clear()
  }

  insert(index: number, rect: Rect): void {
    const minX = Math.floor((rect.x - rect.width / 2) / this.cellSize)
    const maxX = Math.floor((rect.x + rect.width / 2) / this.cellSize)
    const minY = Math.floor((rect.y - rect.height / 2) / this.cellSize)
    const maxY = Math.floor((rect.y + rect.height / 2) / this.cellSize)

    for (let gx = minX; gx <= maxX; gx++) {
      for (let gy = minY; gy <= maxY; gy++) {
        const key = SpatialGrid.key(gx, gy)
        const bucket = this.buckets.get(key)
        if (bucket) bucket.push(index)
        else this.buckets.set(key, [index])
      }
    }
  }

  query(rect: Rect, out: number[]): number[] {
    out.length = 0
    this.queryStamp += 1
    const stamp = this.queryStamp

    const minX = Math.floor((rect.x - rect.width / 2) / this.cellSize)
    const maxX = Math.floor((rect.x + rect.width / 2) / this.cellSize)
    const minY = Math.floor((rect.y - rect.height / 2) / this.cellSize)
    const maxY = Math.floor((rect.y + rect.height / 2) / this.cellSize)

    for (let gx = minX; gx <= maxX; gx++) {
      for (let gy = minY; gy <= maxY; gy++) {
        const key = SpatialGrid.key(gx, gy)
        const bucket = this.buckets.get(key)
        if (!bucket) continue

        for (const index of bucket) {
          if (this.marks.get(index) === stamp) continue
          this.marks.set(index, stamp)
          out.push(index)
        }
      }
    }

    return out
  }
}
