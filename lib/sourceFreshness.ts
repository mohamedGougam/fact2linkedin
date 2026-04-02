/**
 * Simple freshness buckets from a published date string (when the provider supplies one).
 * Not a score — just coarse recency for UI labels.
 */

export type FreshnessCategory = 'very_recent' | 'recent' | 'older' | 'unknown_date';

/** User-visible labels (sentence case). */
export const FRESHNESS_DISPLAY: Record<FreshnessCategory, string> = {
  very_recent: 'Very recent',
  recent: 'Recent',
  older: 'Older',
  unknown_date: 'Unknown date'
};

/** Age thresholds (days) — transparent and easy to tweak. */
const VERY_RECENT_DAYS = 14;
const RECENT_DAYS = 180;

function parseRelativeAgo(s: string, now: Date): Date | null {
  const m = s
    .trim()
    .toLowerCase()
    .match(/^(\d+)\s*(hour|day|week|month|year)s?\s*ago$/);
  if (!m) return null;
  const n = Number(m[1]);
  if (!Number.isFinite(n) || n < 0) return null;
  const unit = m[2];
  const d = new Date(now.getTime());
  switch (unit) {
    case 'hour':
      d.setHours(d.getHours() - n);
      return d;
    case 'day':
      d.setDate(d.getDate() - n);
      return d;
    case 'week':
      d.setDate(d.getDate() - n * 7);
      return d;
    case 'month':
      d.setMonth(d.getMonth() - n);
      return d;
    case 'year':
      d.setFullYear(d.getFullYear() - n);
      return d;
    default:
      return null;
  }
}

/**
 * Best-effort parse of `publishedAt` from APIs (ISO, common date strings, or "N days ago").
 */
export function parsePublishedDate(
  publishedAt: string | undefined | null,
  now: Date = new Date()
): Date | null {
  if (publishedAt === undefined || publishedAt === null) return null;
  const raw = publishedAt.trim();
  if (!raw) return null;

  const rel = parseRelativeAgo(raw, now);
  if (rel) return rel;

  const ms = Date.parse(raw);
  if (!Number.isNaN(ms)) {
    const d = new Date(ms);
    if (!Number.isNaN(d.getTime())) return d;
  }

  return null;
}

/**
 * Classify how fresh a publication is relative to `now`.
 */
export function classifyFreshness(
  publishedAt: string | undefined | null,
  now: Date = new Date()
): FreshnessCategory {
  const d = parsePublishedDate(publishedAt, now);
  if (!d) return 'unknown_date';

  const ageMs = now.getTime() - d.getTime();
  if (ageMs < 0) {
    // Future-dated strings: treat as very recent
    return 'very_recent';
  }

  const ageDays = ageMs / (1000 * 60 * 60 * 24);

  if (ageDays <= VERY_RECENT_DAYS) return 'very_recent';
  if (ageDays <= RECENT_DAYS) return 'recent';
  return 'older';
}
