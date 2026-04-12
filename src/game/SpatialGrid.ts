import type { Rect } from './CollisionSystem'

export class SpatialGrid {
  private readonly cellSize: number
  private readonly buckets = new Map<string, number[]>()
  private readonly marks = new Map<number, number>()
  private queryStamp = 0

  constructor(cellSize = 64) {
    this.cellSize = cellSize
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
        const key = `${gx},${gy}`
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
        const key = `${gx},${gy}`
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
