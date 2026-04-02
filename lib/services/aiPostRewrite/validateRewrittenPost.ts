/**
 * Ensure model output is safe to show as plain post text (no empty blobs, reasonable size).
 */

const MIN_CHARS = 30;
const MAX_CHARS = 14_000;

/**
 * Returns trimmed post text, or `null` if invalid.
 */
export function validateRewrittenPost(raw: unknown): string | null {
  if (typeof raw !== 'string') {
    return null;
  }

  let t = raw.trim();
  if (t.length < MIN_CHARS || t.length > MAX_CHARS) {
    return null;
  }

  // Strip accidental markdown fences
  t = t.replace(/^```(?:text|plaintext)?\s*\n?/i, '').replace(/\n?```\s*$/i, '').trim();

  if (t.length < MIN_CHARS || t.length > MAX_CHARS) {
    return null;
  }

  return t;
}
