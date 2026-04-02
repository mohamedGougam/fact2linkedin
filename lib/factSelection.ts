import type { Fact } from '@/lib/types/fact';

/**
 * Bulk "high confidence" uses each fact’s existing 0–100 confidence score.
 * Facts at or above this value are selected; others are deselected.
 */
export const HIGH_CONFIDENCE_THRESHOLD = 70;

/** One boolean per fact: selected iff confidence meets the threshold. */
export function selectionHighConfidenceOnly(facts: Fact[]): boolean[] {
  return facts.map((f) => f.confidence >= HIGH_CONFIDENCE_THRESHOLD);
}
