/**
 * Remove inactive items from an array in-place using swap-remove.
 * Avoids allocating a new array every frame (unlike Array.filter).
 *
 * @param arr   The array to compact
 * @param keep  Predicate — return `true` to keep the item
 * @returns     The new logical length (arr.length is updated)
 */
export function compactArray<T>(arr: T[], keep: (item: T) => boolean): number {
  let write = 0
  for (let i = 0; i < arr.length; i++) {
    if (keep(arr[i])) {
      if (write !== i) arr[write] = arr[i]
      write++
    }
  }
  arr.length = write
  return write
}
