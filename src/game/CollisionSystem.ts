export interface Rect {
  x: number
  y: number
  width: number
  height: number
}

export class CollisionSystem {
  static checkAABB(a: Rect, b: Rect): boolean {
    return (
      a.x - a.width / 2 < b.x + b.width / 2 &&
      a.x + a.width / 2 > b.x - b.width / 2 &&
      a.y - a.height / 2 < b.y + b.height / 2 &&
      a.y + a.height / 2 > b.y - b.height / 2
    )
  }
}
