/**
 * LinkedIn draft archetypes (which templates to generate). Independent of {@link Tone} (voice).
 */
export type PostStyle =
  | 'professional_insight'
  | 'educational'
  | 'bold_thought_leadership'
  | 'storytelling'
  | 'statistic_led';

export const POST_STYLES: PostStyle[] = [
  'professional_insight',
  'educational',
  'bold_thought_leadership',
  'storytelling',
  'statistic_led'
];

export const POST_STYLE_LABELS: Record<PostStyle, string> = {
  professional_insight: 'Professional insight',
  educational: 'Educational',
  bold_thought_leadership: 'Bold thought leadership',
  storytelling: 'Storytelling',
  statistic_led: 'Statistic-led'
};

export function isPostStyle(value: unknown): value is PostStyle {
  return typeof value === 'string' && (POST_STYLES as string[]).includes(value);
}

/**
 * Valid non-empty subset, deduped, canonical order (same order as POST_STYLES).
 */
export function normalizePostStyles(raw: unknown): PostStyle[] | null {
  if (!Array.isArray(raw) || raw.length === 0) return null;
  if (raw.length > 32) return null;
  const seen = new Set<PostStyle>();
  for (const item of raw) {
    if (!isPostStyle(item)) return null;
    seen.add(item);
  }
  const out = POST_STYLES.filter((s) => seen.has(s));
  return out.length > 0 ? out : null;
}
