/** Pure booking overlap helpers for Gate C+ tests. */

export function rangesOverlap(
  aStart: Date,
  aEnd: Date,
  bStart: Date,
  bEnd: Date,
): boolean {
  return aStart < bEnd && aEnd > bStart;
}

export function isCapacityExceeded(overlapCount: number, capacity: number): boolean {
  return overlapCount >= capacity;
}
