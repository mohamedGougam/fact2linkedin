const MIN_CHARS = 80;
const MAX_CHARS = 12_000;

export function validateBrief(raw: unknown): string | null {
  if (typeof raw !== "string") return null;
  let t = raw.trim();
  if (t.length < MIN_CHARS || t.length > MAX_CHARS) return null;
  t = t.replace(/^```(?:text|plaintext)?\s*\n?/i, "").replace(/\n?```\s*$/i, "").trim();
  if (t.length < MIN_CHARS || t.length > MAX_CHARS) return null;
  return t;
}

