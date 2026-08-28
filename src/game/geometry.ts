// ─── geometry.ts ─────────────────────────────────────────────────────────────
// Primitivas de geometria compartilhadas pela engine.
//
// Vivem aqui, e não no CollisionSystem, para que módulos folha (SpatialGrid,
// FuelSystem) possam usá-las sem importar o sistema de colisões — o que fechava
// ciclos de importação e fazia o type-checker resolver `CollisionSystem` como
// tipo-erro em alguns contextos.

export interface Rect {
  x: number
  y: number
  width: number
  height: number
}

/** Interseção AABB entre dois retângulos centrados em (x, y). */
export function checkAABB(a: Rect, b: Rect): boolean {
  return (
    a.x - a.width / 2 < b.x + b.width / 2 &&
    a.x + a.width / 2 > b.x - b.width / 2 &&
    a.y - a.height / 2 < b.y + b.height / 2 &&
    a.y + a.height / 2 > b.y - b.height / 2
  )
}
