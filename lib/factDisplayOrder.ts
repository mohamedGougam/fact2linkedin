/**
 * Original fact indices in display order: pinned rows first (stable by original index),
 * then unpinned (stable by original index). Selection and generation still use original indices.
 */
export function getFactDisplayOrder(factCount: number, pinned: boolean[]): number[] {
  if (factCount === 0) return [];
  return Array.from({ length: factCount }, (_, i) => i).sort((a, b) => {
    const pa = pinned[a] ?? false;
    const pb = pinned[b] ?? false;
    if (pa !== pb) return pa ? -1 : 1;
    return a - b;
  });
}
