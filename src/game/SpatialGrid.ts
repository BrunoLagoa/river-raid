import type { Rect } from './CollisionSystem'

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
    this.buckets.clear()
  }

  insert(index: number, rect: Rect): void {
    const minX = Math.floor((rect.x - rect.width / 2) / this.cellSize)
    const maxX = Math.floor((rect.x + rect.width / 2) / this.cellSize)
    const minY = Math.floor((rect.y - rect.height / 2) / this.cellSize)
    const maxY = Math.floor((rect.y + rect.height / 2) / this.cellSize)

    for (let gy = minY; gy <= maxY; gy++) {
      for (let gx = minX; gx <= maxX; gx++) {
        const key = SpatialGrid.key(gx, gy)
        let bucket = this.buckets.get(key)
        if (!bucket) {
          bucket = []
          this.buckets.set(key, bucket)
        }
        bucket.push(index)
      }
    }
  }

  query(rect: Rect, out: number[]): number[] {
    out.length = 0
    this.queryStamp += 1

    const minX = Math.floor((rect.x - rect.width / 2) / this.cellSize)
    const maxX = Math.floor((rect.x + rect.width / 2) / this.cellSize)
    const minY = Math.floor((rect.y - rect.height / 2) / this.cellSize)
    const maxY = Math.floor((rect.y + rect.height / 2) / this.cellSize)

    for (let gy = minY; gy <= maxY; gy++) {
      for (let gx = minX; gx <= maxX; gx++) {
        const key = SpatialGrid.key(gx, gy)
        const bucket = this.buckets.get(key)
        if (!bucket) continue

        for (const index of bucket) {
          if (this.marks.get(index) === this.queryStamp) continue
          this.marks.set(index, this.queryStamp)
          out.push(index)
        }
      }
    }

    return out
  }
}
