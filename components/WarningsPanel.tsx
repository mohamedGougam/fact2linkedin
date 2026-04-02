'use client';

import type { SessionWarning } from '@/lib/sessionWarnings';

type WarningsPanelProps = {
  warnings: SessionWarning[];
};

/**
 * Subtle, scannable list of session notes — transparency without alarm.
 */
export function WarningsPanel({ warnings }: WarningsPanelProps) {
  if (warnings.length === 0) {
    return null;
  }

  return (
    <div
      className="rounded-lg border border-slate-200/90 bg-slate-50/80 px-3 py-2.5 text-sm text-slate-600 shadow-sm"
      role="status"
      aria-label="Session notes"
    >
      <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
        Notes
      </p>
      <ul className="list-inside list-disc space-y-1 text-[13px] leading-snug text-slate-600 marker:text-slate-400">
        {warnings.map((w) => (
          <li key={w.id}>{w.message}</li>
        ))}
      </ul>
    </div>
  );
}
