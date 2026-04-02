/**
 * Shared formatting for ISO-8601 timestamps shown in the UI (history, packages, etc.).
 */

/**
 * Medium date + short time in the user’s locale. Safe if `iso` is invalid — returns it unchanged.
 */
export function formatIsoTimestampUi(iso: string): string {
  try {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return iso;
    return d.toLocaleString(undefined, {
      dateStyle: 'medium',
      timeStyle: 'short'
    });
  } catch {
    return iso;
  }
}
