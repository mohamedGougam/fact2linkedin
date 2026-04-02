/**
 * User-facing source labels (no internal IDs or pipeline names).
 */

/** Hostname for display, e.g. `example.com`. */
export function hostnameFromUrl(url: string): string {
  const u = url.trim();
  if (!u) return '';
  try {
    const withProto = /^https?:\/\//i.test(u) ? u : `https://${u}`;
    return new URL(withProto).hostname.replace(/^www\./i, '');
  } catch {
    return '';
  }
}
