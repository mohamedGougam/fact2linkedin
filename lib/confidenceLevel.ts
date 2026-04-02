/**
 * Maps a 0–100 score to a simple band for UI (badges, colors).
 * Thresholds are fixed — replace this with model output later if needed.
 */

export type ConfidenceBand = 'high' | 'medium' | 'low';

/** Deterministic bands: high ≥75, medium ≥45, else low. */
export function getConfidenceBand(score: number): ConfidenceBand {
  const s = Math.max(0, Math.min(100, score));
  if (s >= 75) return 'high';
  if (s >= 45) return 'medium';
  return 'low';
}
