'use client';

/** Compact label when something is flagged for future automation. */
export function AutomationCandidateIndicator() {
  return (
    <span
      className="inline-flex shrink-0 items-center rounded bg-violet-100 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-violet-800 ring-1 ring-violet-200/80"
      title="Marked as an automation candidate (no scheduling yet)"
    >
      Auto
    </span>
  );
}
